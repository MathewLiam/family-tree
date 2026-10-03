import type { StorybookConfig } from '@storybook/react-webpack5'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    // Compiles stories with the project's babel.config.json, same as the library build.
    '@storybook/addon-webpack5-compiler-babel',
    '@storybook/addon-docs',
  ],
  framework: '@storybook/react-webpack5',
}

export default config
