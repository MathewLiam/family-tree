import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import { PersonNode } from './PersonNode'

const meta = {
  title: 'Components/PersonNode',
  component: PersonNode,
  args: {
    person: {
      id: '1',
      name: 'Margaret Rose Barrand',
      dateOfBirth: '1920-03-12',
      dateOfDeath: '1999-01-01',
    },
  },
} satisfies Meta<typeof PersonNode>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Living: Story = {
  args: {
    person: { id: '2', name: 'Thomas Barrand', dateOfBirth: '1948-07-04' },
  },
}

export const NoDates: Story = {
  args: {
    person: { id: '3', name: 'Unknown Barrand' },
  },
}

/** Strings that aren't full ISO dates are shown exactly as written. */
export const PartialDates: Story = {
  args: {
    person: { id: '4', name: 'William Barrand', dateOfBirth: 'c. 1850', dateOfDeath: '1912' },
  },
}

/** Long names wrap to two lines, then truncate. The full name shows on hover. */
export const LongName: Story = {
  args: {
    person: {
      id: '5',
      name: 'William Henry Fitzgerald-Montgomery Barrand-Smythe',
      dateOfBirth: '1871-11-30',
      dateOfDeath: '1944-02-08',
    },
  },
}

export const DateObjects: Story = {
  args: {
    person: {
      id: '6',
      name: 'Edith Barrand',
      dateOfBirth: new Date(1902, 0, 15),
      dateOfDeath: new Date(1987, 9, 3),
    },
  },
}

export const USLocale: Story = {
  args: { locale: 'en-US' },
}

export const CustomDateFormat: Story = {
  args: {
    formatDate: (date) => (date instanceof Date ? String(date.getFullYear()) : date.slice(0, 4)),
  },
}

export const Selected: Story = {
  args: { selected: true },
}

/** Passing `onSelect` renders the node as a button. Click to toggle selection. */
export const Interactive: Story = {
  args: {
    selected: false,
    onSelect: fn(),
  },
  render: function Render(args) {
    const [{ selected }, updateArgs] = useArgs<typeof args>()
    return (
      <PersonNode
        {...args}
        selected={selected}
        onSelect={(person) => {
          args.onSelect?.(person)
          updateArgs({ selected: !selected })
        }}
      />
    )
  },
}

/** Nodes are themed by overriding the `--ft-node-*` custom properties. */
export const Themed: Story = {
  args: { onSelect: fn() },
  decorators: [
    (Story) => (
      <div
        style={
          {
            '--ft-node-bg': '#fdf6e3',
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
