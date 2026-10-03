import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import { FamilyTree } from './FamilyTree'
import { ashworthFamilies, ashworthPeople, generateFamily } from './FamilyTree.fixtures'

const meta = {
  title: 'Components/FamilyTree',
  component: FamilyTree,
  parameters: { layout: 'padded' },
  args: {
    people: ashworthPeople,
    families: ashworthFamilies,
    onSelect: fn(),
  },
  argTypes: {
    people: { control: false },
    families: { control: false },
    rootId: {
      control: 'select',
      options: [undefined, ...ashworthPeople.map((p) => p.id)],
    },
  },
} satisfies Meta<typeof FamilyTree>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Five generations, including a remarriage (Florence), a single parent
 * (Margaret) and a childless couple (Michael). Drag to pan, scroll to zoom.
 */
export const Default: Story = {}

export const InitiallySelected: Story = {
  args: { defaultSelectedId: 'sarah' },
}

/** `selectedId` + `onSelect` keep selection in the parent's state. */
export const Controlled: Story = {
  args: { selectedId: 'george' },
  render: function Render(args) {
    const [, updateArgs] = useArgs<typeof args>()
    return (
      <FamilyTree
        {...args}
        onSelect={(person) => {
          args.onSelect?.(person)
          updateArgs({ selectedId: person.id })
        }}
      />
    )
  },
}

/** `rootId` picks whose descendants to show. */
export const SubtreeFromRoot: Story = {
  args: { rootId: 'florence' },
}

/** `initialZoom` starts at a fixed scale instead of fitting the whole tree in view. */
export const InitialZoom: Story = {
  args: { initialZoom: 1 },
}

export const CompactSpacing: Story = {
  args: {
    layout: { nodeWidth: 150, nodeHeight: 100, partnerGap: 16, siblingGap: 12, generationGap: 40 },
  },
}

/** `renderNode` replaces the default node. It renders inside a box of the layout's node size. */
export const CustomNode: Story = {
  args: {
    layout: { nodeWidth: 120, nodeHeight: 56 },
    renderNode: ({ person, node, selected, select }) => (
      <button
        type="button"
        onClick={select}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 28,
          border: `2px solid ${selected ? '#db2777' : node.role === 'partner' ? '#a1a1aa' : '#0d9488'}`,
          background: node.role === 'partner' ? '#fafafa' : '#f0fdfa',
          font: '600 12px system-ui, sans-serif',
          cursor: 'pointer',
        }}
      >
        {person.name.split(' ')[0]}
      </button>
    ),
  },
}

/** The tree and its nodes are themed with CSS custom properties. */
export const Themed: Story = {
  decorators: [
    (Story) => (
      <div
        style={
          {
            '--ft-tree-bg': '#fdf6e3',
            '--ft-tree-border': '#e8dcb8',
            '--ft-connector-color': '#93a1a1',
            '--ft-connector-width': '2px',
            '--ft-partner-connector-color': '#cb4b16',
            '--ft-node-bg': '#fffdf5',
            '--ft-node-border': '#b58900',
            '--ft-node-accent': '#cb4b16',
            '--ft-node-radius': '2px',
            '--ft-node-font': 'Georgia, serif',
          } as CSSProperties
        }
      >
        <Story />
      </div>
    ),
  ],
}

const large = generateFamily(6, 3)

/** About 500 people, for checking that panning and zooming stay smooth. */
export const Large: Story = {
  args: { people: large.people, families: large.families, minZoom: 0.02 },
}

export const Empty: Story = {
  args: { people: [], families: [] },
}
