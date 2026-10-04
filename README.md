# @mathewliam/family-tree

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
  - `src/components/FamilyTree/`: the interactive tree (`FamilyTree.tsx`), its pan/zoom hook (`usePanZoom.ts`) and the sample family used by the stories (`FamilyTree.fixtures.ts`).
  - `src/components/PersonNode/`: the card shown for each person.
  - `src/layout/layoutFamilyTree.ts`: the layout algorithm. It's plain TypeScript with no React, so it can be used on its own.
  - `src/types.ts`: the `Person`, `Family` and `PersonDate` data types.
  - `src/utils/formatDate.ts`: date formatting for `PersonDate`s.
- `src/**/*.stories.tsx`: Storybook stories, kept next to each component. They aren't included in the library build.
- `.storybook/`: Storybook config. It uses `@storybook/react-webpack5` with the Babel compiler addon, so stories compile with the same `babel.config.json` as the library.
- `webpack.config.js`: builds the library (`dist/index.mjs`, `dist/index.cjs`, `dist/style.css`).
- `babel.config.json`: transpiles TypeScript and JSX. Babel only strips types, so `tsc` handles type checking and `.d.ts` output (`tsconfig.build.json`).

`react` and `react-dom` are peer dependencies and are never bundled.

## Using the library

```tsx
import { FamilyTree, type Family, type Person } from '@mathewliam/family-tree'
import '@mathewliam/family-tree/style.css'

const people: Person[] = [
  { id: 'margaret', name: 'Margaret Barrand', dateOfBirth: '1920-03-12', dateOfDeath: 'c. 1999' },
  { id: 'arthur', name: 'Arthur Barrand', dateOfBirth: '1918-07-02' },
  { id: 'june', name: 'June Barrand', dateOfBirth: new Date(1946, 5, 1) },
]

const families: Family[] = [
  { id: 'f1', partnerIds: ['margaret', 'arthur'], childIds: ['june'] },
]

<FamilyTree people={people} families={families} onSelect={(person) => console.log(person.id)} />
```

### Data

- `Person`: an `id`, a `name`, and optional `dateOfBirth` / `dateOfDeath`. Dates can be `Date` objects or ISO strings (`'1920-03-12'`), which are formatted for the locale. Any other string (`'1850'`, `'c. 1850'`) is shown as written.
- `Family`: a partnership and/or set of children, like a GEDCOM `FAM` record: `partnerIds` (one or two people) and `childIds`. A person with several partners has one family per partnership.

### `FamilyTree`

A top-down descendant tree. Drag to pan, scroll to zoom, and click a person to select them. When the tree has focus, the arrow keys pan, `+` / `-` zoom, and `0` fits the tree to the view.

| Prop                | Default         | Description                                                                                     |
| ------------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| `people`            |                 | Everyone who might appear in the tree.                                                          |
| `families`          |                 | Partnerships and children linking them.                                                         |
| `rootId`            | first non-child | Whose descendants to show. Anyone not descended from (or partnered to a descendant of) them is left out. |
| `selectedId`        |                 | The selected person, for a controlled tree.                                                     |
| `defaultSelectedId` |                 | The initially selected person, for an uncontrolled tree.                                        |
| `onSelect`          |                 | Called with the `Person` when a node is clicked.                                                |
| `focusSelected`     | `false`         | Pans to the selected person when `selectedId` is changed by the parent (e.g. from a search), rather than by a click in the tree. |
| `renderNode`        |                 | Replaces the default `PersonNode`. Receives `{ person, node, selected, select }` and renders inside a box of the layout's node size. |
| `layout`            | see below       | Node size and spacing, as a partial `LayoutOptions`.                                            |
| `locale`            | browser locale  | Passed to the default `PersonNode`.                                                             |
| `formatDate`        |                 | Passed to the default `PersonNode`.                                                             |
| `minZoom`           | `0.1`           | Smallest scale.                                                                                 |
| `maxZoom`           | `2`             | Largest scale.                                                                                  |
| `initialZoom`       | `'fit'`         | Scale to start at (and reset to when the tree's size changes). `'fit'` fits the whole tree without zooming in past 100%. |
| `showControls`      | `true`          | Shows the zoom in / zoom out / fit buttons.                                                     |
| `className`         |                 | Extra class for the root element.                                                               |
| `aria-label`        | `'Family tree'` | Accessible name for the tree.                                                                   |

`layout` accepts `nodeWidth` (176), `nodeHeight` (112), `partnerGap` (32), `siblingGap` (24) and `generationGap` (64), all in px. The defaults are exported as `defaultLayoutOptions`.

### `PersonNode`

The card `FamilyTree` uses for each person. It can also be used on its own:

```tsx
<PersonNode person={person} selected={isSelected} onSelect={(p) => select(p.id)} />
```

It takes `person`, `selected`, `onSelect` (which makes it a button), `locale`, `formatDate` and `className`.

### Layout without React

`layoutFamilyTree(people, families, rootId?, options?)` returns the positioned `nodes` and `connectors` (as polylines) plus the overall `width` and `height`, for rendering the tree some other way. `formatDate(date, locale?)` is exported too.

### Theming

Set CSS custom properties on the tree or on any parent element:

- `--ft-tree-*` (`height`, `bg`, `border`, `radius`), `--ft-connector-color`, `--ft-connector-width`, `--ft-partner-connector-color`, `--ft-control-bg` and `--ft-control-text` style the tree. See `src/components/FamilyTree/FamilyTree.css`.
- `--ft-node-*` styles the nodes. See `src/components/PersonNode/PersonNode.css`.

The tree's height defaults to `36rem`; set `--ft-tree-height` to change it.

## Publishing

The package is published to GitHub Packages by `.github/workflows/publish.yml` whenever a GitHub release is published:

1. Create a release with a tag like `v1.2.0`. The tag sets the published version, so `package.json` doesn't need bumping.
2. The workflow typechecks, lints, builds, and publishes `@mathewliam/family-tree@1.2.0`. The repository must be owned by the `MathewLiam` GitHub account, because GitHub Packages only accepts a scope matching the owner.

Releases marked as pre-release (e.g. `v1.3.0-beta.1`) are published under the `next` dist-tag.

## Installing from GitHub Packages

In the consuming project, add an `.npmrc`:

```
@mathewliam:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` must be a token with `read:packages` (a classic personal access token locally; in GitHub Actions, the workflow's `GITHUB_TOKEN` with `packages: read`). Then:

```sh
npm install @mathewliam/family-tree
```

## Adding a component

1. Create `src/components/MyThing/MyThing.tsx` (plus `MyThing.css` if it needs styles).
2. Re-export it from `src/components/MyThing/index.ts` and from `src/index.ts`.
3. Add `src/components/MyThing/MyThing.stories.tsx`.
