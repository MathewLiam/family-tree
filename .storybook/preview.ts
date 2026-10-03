import type { Preview } from '@storybook/react-webpack5'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        date: /^date/i,
      },
    },
  },
  tags: ['autodocs'],
}

export default preview
