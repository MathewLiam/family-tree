import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from 'react'

export interface Transform {
  x: number
  y: number
  /** Scale. */
  k: number
}

export interface PanZoomOptions {
  /** Size of the content being panned, in px at scale 1. */
  contentWidth: number
  contentHeight: number
  minZoom: number
  maxZoom: number
  /** Space kept around the content when fitting it to the viewport. */
  fitPadding: number
  /** The scale to start at, or `'fit'` to fit the content to the viewport. */
  initialZoom: number | 'fit'
}

/** Pointer movement, in px, before a press becomes a drag (so clicks still work). */
const DRAG_THRESHOLD = 4
const KEY_PAN_STEP = 48
const BUTTON_ZOOM_STEP = 1.25

/**
 * Drag-to-pan, wheel-to-zoom (around the pointer) and keyboard controls for a
 * viewport element. Apply the returned transform to the content with
 * `translate(x, y) scale(k)` and `transform-origin: 0 0`.
 */
export function usePanZoom(
  viewportRef: RefObject<HTMLElement | null>,
  { contentWidth, contentHeight, minZoom, maxZoom, fitPadding, initialZoom }: PanZoomOptions,
) {
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const drag = useRef<{ pointerId: number; startX: number; startY: number; origin: Transform } | null>(null)
  const suppressClick = useRef(false)

  const clampZoom = useCallback(
    (k: number) => Math.min(maxZoom, Math.max(minZoom, k)),
    [minZoom, maxZoom],
  )

  /** Zooms by `factor`, keeping the point (cx, cy) in viewport coordinates fixed. */
  const zoomAt = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      const el = viewportRef.current
      const px = cx ?? (el ? el.clientWidth / 2 : 0)
      const py = cy ?? (el ? el.clientHeight / 2 : 0)
      setTransform((t) => {
        const k = clampZoom(t.k * factor)
        const ratio = k / t.k
        return { k, x: px - (px - t.x) * ratio, y: py - (py - t.y) * ratio }
      })
    },
    [viewportRef, clampZoom],
  )

  /** Scales the content to fit the viewport (never above 100%) and centres it. */
  const fit = useCallback(() => {
    const el = viewportRef.current
    if (!el || el.clientWidth === 0 || contentWidth === 0) return
    const { clientWidth: vw, clientHeight: vh } = el
    const k = clampZoom(
      Math.min((vw - 2 * fitPadding) / contentWidth, (vh - 2 * fitPadding) / contentHeight, 1),
    )
    setTransform({ k, x: (vw - contentWidth * k) / 2, y: (vh - contentHeight * k) / 2 })
  }, [viewportRef, contentWidth, contentHeight, fitPadding, clampZoom])

  /** Pans, keeping the current scale, so the content point (cx, cy) is centred in the viewport. */
  const centerOn = useCallback(
    (cx: number, cy: number) => {
      const el = viewportRef.current
      if (!el || el.clientWidth === 0) return
      setTransform((t) => ({ ...t, x: el.clientWidth / 2 - cx * t.k, y: el.clientHeight / 2 - cy * t.k }))
    },
    [viewportRef],
  )

  /**
   * Applies `initialZoom`. A fixed scale centres the content horizontally, and
   * vertically if it fits; otherwise its top edge is kept in view.
   */
  const reset = useCallback(() => {
    if (initialZoom === 'fit') return fit()
    const el = viewportRef.current
    if (!el || el.clientWidth === 0) return
    const { clientWidth: vw, clientHeight: vh } = el
    const k = clampZoom(initialZoom)
    const height = contentHeight * k
    setTransform({
      k,
      x: (vw - contentWidth * k) / 2,
      y: height + 2 * fitPadding <= vh ? (vh - height) / 2 : fitPadding,
    })
  }, [initialZoom, fit, viewportRef, contentWidth, contentHeight, fitPadding, clampZoom])

  // Reset whenever the content changes size (including the first render).
  useLayoutEffect(reset, [reset])

  // React's onWheel is passive, so preventDefault (to stop the page scrolling) needs a native listener.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = el.getBoundingClientRect()
      const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16 : event.deltaY
      zoomAt(Math.exp(-delta * 0.002), event.clientX - rect.left, event.clientY - rect.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [viewportRef, zoomAt])

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return
    suppressClick.current = false
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: transform,
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.pointerId !== event.pointerId) return
    const dx = event.clientX - d.startX
    const dy = event.clientY - d.startY
    if (!isPanning) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      setIsPanning(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    setTransform({ ...d.origin, x: d.origin.x + dx, y: d.origin.y + dy })
  }

  const endDrag = (event: PointerEvent<HTMLElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return
    drag.current = null
    if (isPanning) {
      // A drag that ends over a node must not also select it.
      suppressClick.current = true
      setIsPanning(false)
    }
  }

  const onClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!suppressClick.current) return
    suppressClick.current = false
    event.stopPropagation()
    event.preventDefault()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    // Only handle keys when the viewport itself has focus, not a node or control inside it.
    if (event.target !== event.currentTarget) return
    const pan = (dx: number, dy: number) => setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }))
    const actions: Record<string, () => void> = {
      ArrowLeft: () => pan(KEY_PAN_STEP, 0),
      ArrowRight: () => pan(-KEY_PAN_STEP, 0),
      ArrowUp: () => pan(0, KEY_PAN_STEP),
      ArrowDown: () => pan(0, -KEY_PAN_STEP),
      '+': () => zoomAt(BUTTON_ZOOM_STEP),
      '=': () => zoomAt(BUTTON_ZOOM_STEP),
      '-': () => zoomAt(1 / BUTTON_ZOOM_STEP),
      '0': fit,
    }
    const action = actions[event.key]
    if (action) {
      event.preventDefault()
      action()
    }
  }

  return {
    transform,
    isPanning,
    zoomIn: () => zoomAt(BUTTON_ZOOM_STEP),
    zoomOut: () => zoomAt(1 / BUTTON_ZOOM_STEP),
    fit,
    centerOn,
    viewportProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClickCapture,
      onKeyDown,
    },
  }
}
