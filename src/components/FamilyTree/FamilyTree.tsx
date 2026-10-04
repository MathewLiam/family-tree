import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  layoutFamilyTree,
  type LayoutConnector,
  type LayoutNode,
  type LayoutOptions,
} from '../../layout/layoutFamilyTree'
import type { Family, Person } from '../../types'
import type { DateFormatter } from '../../utils/formatDate'
import { PersonNode } from '../PersonNode'
import { usePanZoom } from './usePanZoom'
import './FamilyTree.css'

export interface RenderNodeProps {
  person: Person
  node: LayoutNode
  selected: boolean
  /** Selects this person. */
  select: () => void
}

export interface FamilyTreeProps {
  people: Person[]
  families: Family[]
  /** Whose descendants to show. Defaults to the first person who isn't anyone's child. */
  rootId?: string

  /** The selected person's id, for a controlled tree. */
  selectedId?: string
  /** The initially selected person's id, for an uncontrolled tree. */
  defaultSelectedId?: string
  onSelect?: (person: Person) => void
  /**
   * Pans to centre the selected person when `selectedId` is changed by the
   * parent (e.g. from a search), rather than by clicking a node in the tree.
   */
  focusSelected?: boolean

  /** Replaces the default {@link PersonNode}. Rendered inside a box of the layout's node size. */
  renderNode?: (props: RenderNodeProps) => ReactNode
  /** Node size and spacing, in px. */
  layout?: Partial<LayoutOptions>

  /** Passed to the default {@link PersonNode}. */
  locale?: string
  /** Passed to the default {@link PersonNode}. */
  formatDate?: DateFormatter

  minZoom?: number
  maxZoom?: number
  /**
   * The scale to show the tree at when it first renders (and when its size
   * changes), clamped to `minZoom`–`maxZoom`. `'fit'` (the default) fits the
   * whole tree in view, without zooming in past 100%.
   */
  initialZoom?: number | 'fit'
  /** Shows the zoom in / zoom out / fit buttons. */
  showControls?: boolean

  className?: string
  'aria-label'?: string
}

const FIT_PADDING = 32

/**
 * An interactive, top-down descendant tree. Drag to pan, scroll to zoom, and
 * click a person to select them. When the tree itself has focus, the arrow keys
 * pan, `+` and `-` zoom, and `0` fits the tree to the view.
 */
export function FamilyTree({
  people,
  families,
  rootId,
  selectedId: controlledSelectedId,
  defaultSelectedId,
  onSelect,
  focusSelected = false,
  renderNode,
  layout: layoutOptions,
  locale,
  formatDate,
  minZoom = 0.1,
  maxZoom = 2,
  initialZoom = 'fit',
  showControls = true,
  className,
  'aria-label': ariaLabel = 'Family tree',
}: FamilyTreeProps) {
  const { nodeWidth, nodeHeight, partnerGap, siblingGap, generationGap } = layoutOptions ?? {}
  const layout = useMemo(
    () =>
      layoutFamilyTree(people, families, rootId, {
        ...(nodeWidth !== undefined && { nodeWidth }),
        ...(nodeHeight !== undefined && { nodeHeight }),
        ...(partnerGap !== undefined && { partnerGap }),
        ...(siblingGap !== undefined && { siblingGap }),
        ...(generationGap !== undefined && { generationGap }),
      }),
    [people, families, rootId, nodeWidth, nodeHeight, partnerGap, siblingGap, generationGap],
  )

  const [uncontrolledSelectedId, setUncontrolledSelectedId] = useState(defaultSelectedId)
  const isControlled = controlledSelectedId !== undefined
  const selectedId = isControlled ? controlledSelectedId : uncontrolledSelectedId

  // A new object per click in the tree, so focusSelected can tell clicks from outside changes.
  const [lastClick, setLastClick] = useState<{ id: string }>()

  const select = useCallback(
    (person: Person) => {
      setLastClick({ id: person.id })
      if (!isControlled) setUncontrolledSelectedId(person.id)
      onSelect?.(person)
    },
    [isControlled, onSelect],
  )

  const viewportRef = useRef<HTMLDivElement>(null)
  const { transform, isPanning, zoomIn, zoomOut, fit, centerOn, viewportProps } = usePanZoom(viewportRef, {
    contentWidth: layout.width,
    contentHeight: layout.height,
    minZoom,
    maxZoom,
    fitPadding: FIT_PADDING,
    initialZoom,
  })

  // Skips the first render, so initialZoom still decides where the tree starts.
  const previousSelectedId = useRef(selectedId)
  const handledClick = useRef(lastClick)
  useEffect(() => {
    const clicked = lastClick !== handledClick.current
    handledClick.current = lastClick
    if (selectedId === previousSelectedId.current) return
    previousSelectedId.current = selectedId
    if (!focusSelected || clicked) return
    const node = layout.nodes.find((n) => n.person.id === selectedId)
    if (node) centerOn(node.x + node.width / 2, node.y + node.height / 2)
  }, [focusSelected, selectedId, lastClick, layout, centerOn])

  // Built separately from the transform, so panning and zooming don't re-render every node.
  const content = useMemo(
    () => (
      <>
        <svg
          className="ft-family-tree__connectors"
          width={layout.width}
          height={layout.height}
          aria-hidden="true"
        >
          {layout.connectors.map((connector) => (
            <path
              key={connector.id}
              className={`ft-family-tree__connector ft-family-tree__connector--${connector.kind}`}
              d={toPath(connector)}
            />
          ))}
        </svg>
        {layout.nodes.map((node) => {
          const { person } = node
          const selected = person.id === selectedId
          return (
            <div
              key={person.id}
              className={`ft-family-tree__node ft-family-tree__node--${node.role}`}
              style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
            >
              {renderNode ? (
                renderNode({ person, node, selected, select: () => select(person) })
              ) : (
                <PersonNode
                  person={person}
                  selected={selected}
                  onSelect={select}
                  locale={locale}
                  formatDate={formatDate}
                />
              )}
            </div>
          )
        })}
      </>
    ),
    [layout, selectedId, renderNode, select, locale, formatDate],
  )

  const classes = ['ft-family-tree']
  if (isPanning) classes.push('ft-family-tree--panning')
  if (className) classes.push(className)

  return (
    <div className={classes.join(' ')}>
      <div
        ref={viewportRef}
        className="ft-family-tree__viewport"
        role="group"
        aria-label={ariaLabel}
        tabIndex={0}
        {...viewportProps}
      >
        <div
          className="ft-family-tree__canvas"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
          }}
        >
          {content}
        </div>
      </div>

      {showControls && (
        <div className="ft-family-tree__controls">
          <button type="button" className="ft-family-tree__control" onClick={zoomIn} aria-label="Zoom in">
            +
          </button>
          <button type="button" className="ft-family-tree__control" onClick={zoomOut} aria-label="Zoom out">
            −
          </button>
          <button type="button" className="ft-family-tree__control" onClick={fit} aria-label="Fit to view">
            ⤢
          </button>
        </div>
      )}
    </div>
  )
}

function toPath({ points }: LayoutConnector): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')
}
