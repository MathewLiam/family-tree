import path from 'node:path'
import { fileURLToPath } from 'node:url'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// React is provided by the consuming app, so never bundle it.
const externals = [/^react(-dom)?(\/.*)?$/]

/** Library build: one config per module format. */
const library = (format) => ({
  name: format,
  mode: 'production',
  entry: './src/index.ts',
  target: 'web',
  devtool: 'source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  externals,
  externalsType: format === 'esm' ? 'module' : 'commonjs',
  experiments: format === 'esm' ? { outputModule: true } : {},
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: format === 'esm' ? 'index.mjs' : 'index.cjs',
    library: { type: format === 'esm' ? 'module' : 'commonjs2' },
    // Inline small assets; larger ones are emitted alongside the bundle.
    assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        // Babel's env follows webpack's mode, so the build uses
        // react/jsx-runtime rather than react/jsx-dev-runtime.
        use: { loader: 'babel-loader', options: { envName: 'production' } },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff2?)$/,
        type: 'asset',
      },
    ],
  },
  plugins: [new MiniCssExtractPlugin({ filename: 'style.css' })],
  optimization: {
    // Keep output readable-ish for consumers' bundlers; they will minify.
    minimize: false,
  },
})

export default [library('esm'), library('cjs')]
