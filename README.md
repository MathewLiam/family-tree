# family-tree

An interactive family tree React component library, built from scratch (no graphing library) with webpack and Babel.

## Scripts

| Command             | What it does                                                         |
| ------------------- | -------------------------------------------------------------------- |
| `npm run storybook` | Starts Storybook at http://localhost:6006                             |
| `npm run build-storybook` | Builds a static Storybook site into `storybook-static/`         |
| `npm run build`     | Builds the library into `dist/` (ESM, CJS, CSS, type declarations)    |
| `npm run typecheck` | Type-checks `src/` and `.storybook/`                                 |
| `npm run lint`      | Runs ESLint (including Storybook rules)                              |

## Layout

- `src/`: the library. Everything exported from `src/index.ts` is public.
- `src/**/*.stories.tsx`: Storybook stories, kept next to each component. They aren't included in the library build.
- `.storybook/`: Storybook config. It uses `@storybook/react-webpack5` with the Babel compiler addon, so stories compile with the same `babel.config.json` as the library.
- `webpack.config.js`: builds the library (`dist/index.mjs`, `dist/index.cjs`, `dist/style.css`).
- `babel.config.json`: transpiles TypeScript and JSX. Babel only strips types, so `tsc` handles type checking and `.d.ts` output (`tsconfig.build.json`).

`react` and `react-dom` are peer dependencies and are never bundled.

## Using the library

```tsx
import { PersonNode, type Person } from 'family-tree'
import 'family-tree/style.css'

const person: Person = {
  id: '1',
  name: 'Margaret Barrand',
  dateOfBirth: '1920-03-12', // ISO strings and Date objects are formatted for the locale
  dateOfDeath: 'c. 1999', // any other string is shown as written
}

<PersonNode person={person} selected={isSelected} onSelect={(p) => select(p.id)} />
```

To theme nodes, set the `--ft-node-*` CSS custom properties on the node or on any parent element (see `src/components/PersonNode/PersonNode.css`).

## Publishing

The package is published to GitHub Packages by `.github/workflows/publish.yml` whenever a GitHub release is published:

1. Create a release with a tag like `v1.2.0`. The tag sets the published version, so `package.json` doesn't need bumping.
2. The workflow typechecks, lints, builds, and publishes `@<repo-owner>/family-tree@1.2.0`.

Releases marked as pre-release (e.g. `v1.3.0-beta.1`) are published under the `next` dist-tag.

## Installing from GitHub Packages

In the consuming project, add an `.npmrc` (replace `<owner>` with the GitHub user or org, in lowercase):

```
@<owner>:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` must be a token with `read:packages` (a classic personal access token locally; in GitHub Actions, the workflow's `GITHUB_TOKEN` with `packages: read`). Then:

```sh
npm install @<owner>/family-tree
```

## Adding a component

1. Create `src/components/MyThing/MyThing.tsx` (plus `MyThing.css` if it needs styles).
2. Re-export it from `src/components/MyThing/index.ts` and from `src/index.ts`.
3. Add `src/components/MyThing/MyThing.stories.tsx`.
