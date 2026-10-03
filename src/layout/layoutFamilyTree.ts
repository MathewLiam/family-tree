import type { Family, Person } from '../types'

export interface LayoutOptions {
  /** Width of every node, in px. */
  nodeWidth: number
  /** Height of every node, in px. */
  nodeHeight: number
  /** Horizontal space between partners. */
  partnerGap: number
  /** Horizontal space between neighbouring subtrees. */
  siblingGap: number
  /** Vertical space between generations. */
  generationGap: number
}

export const defaultLayoutOptions: LayoutOptions = {
  nodeWidth: 176,
  nodeHeight: 112,
  partnerGap: 32,
  siblingGap: 24,
  generationGap: 64,
}

export type Point = readonly [x: number, y: number]

export interface LayoutNode {
  person: Person
  /** Top-left corner, in px. */
  x: number
  y: number
  width: number
  height: number
  /** 0 for the root person, 1 for their children, and so on. */
  generation: number
  /** `descendant` for the root and their descendants; `partner` for people who partnered into the tree. */
  role: 'descendant' | 'partner'
}

export interface LayoutConnector {
  id: string
  /** `partner` joins a couple; `descent` runs from a family down to one child. */
  kind: 'partner' | 'descent'
  familyId: string
  /** A polyline of straight segments. */
  points: Point[]
}

export interface FamilyTreeLayout {
  nodes: LayoutNode[]
  connectors: LayoutConnector[]
  width: number
  height: number
}

/** Vertical offset between the child "buses" of different families of one person. */
const BUS_SPACING = 8

interface Branch {
  family: Family
  partner?: Person
  children: Unit[]
}

/** A descendant, the partners shown beside them, and the subtrees below. */
interface Unit {
  person: Person
  row: Person[]
  branches: Branch[]
  rowWidth: number
  childrenWidth: number
  width: number
}

interface Context {
  people: Map<string, Person>
  familiesByPartner: Map<string, Family[]>
  seen: Set<string>
  usedFamilies: Set<string>
  options: LayoutOptions
}

/**
 * Lays out the descendants of one person as a top-down tree.
 *
 * Partners sit beside the person they partnered with. A couple's children
 * hang from the middle of the line joining them; a single parent's children
 * hang from the parent. Each subtree gets its own column, wide enough for its
 * widest generation, so subtrees never overlap.
 *
 * People not descended from (or partnered to a descendant of) the root are
 * omitted. Anyone reachable twice, e.g. through cousin marriage, appears once.
 *
 * @param rootId Defaults to the first person who isn't anyone's child.
 */
export function layoutFamilyTree(
  people: readonly Person[],
  families: readonly Family[],
  rootId?: string,
  options: Partial<LayoutOptions> = {},
): FamilyTreeLayout {
  const ctx: Context = {
    people: new Map(people.map((p) => [p.id, p])),
    familiesByPartner: new Map(),
    seen: new Set(),
    usedFamilies: new Set(),
    options: { ...defaultLayoutOptions, ...options },
  }
  for (const family of families) {
    for (const partnerId of family.partnerIds) {
      const list = ctx.familiesByPartner.get(partnerId) ?? []
      list.push(family)
      ctx.familiesByPartner.set(partnerId, list)
    }
  }

  const root = findRoot(people, families, rootId, ctx.people)
  if (!root) return { nodes: [], connectors: [], width: 0, height: 0 }

  const unit = buildUnit(root, ctx)
  const layout: FamilyTreeLayout = { nodes: [], connectors: [], width: unit.width, height: 0 }
  place(unit, 0, 0, layout, ctx.options)

  const { nodeHeight, generationGap } = ctx.options
  const generations = Math.max(...layout.nodes.map((n) => n.generation)) + 1
  layout.height = generations * nodeHeight + (generations - 1) * generationGap
  return layout
}

function findRoot(
  people: readonly Person[],
  families: readonly Family[],
  rootId: string | undefined,
  byId: Map<string, Person>,
): Person | undefined {
  if (rootId !== undefined) return byId.get(rootId)
  const children = new Set(families.flatMap((f) => f.childIds))
  return people.find((p) => !children.has(p.id)) ?? people[0]
}

function buildUnit(person: Person, ctx: Context): Unit {
  ctx.seen.add(person.id)
  const branches: Branch[] = []

  for (const family of ctx.familiesByPartner.get(person.id) ?? []) {
    if (ctx.usedFamilies.has(family.id)) continue
    ctx.usedFamilies.add(family.id)

    // Families are couples or single parents, so only the first other partner is used.
    const partnerId = family.partnerIds.find((id) => id !== person.id)
    let partner = partnerId === undefined ? undefined : ctx.people.get(partnerId)
    if (partner && ctx.seen.has(partner.id)) partner = undefined
    if (partner) ctx.seen.add(partner.id)

    const children: Unit[] = []
    for (const childId of family.childIds) {
      const child = ctx.people.get(childId)
      if (child && !ctx.seen.has(child.id)) children.push(buildUnit(child, ctx))
    }

    if (partner || children.length > 0) branches.push({ family, partner, children })
  }

  // One partner sits to the right. With more, the first sits to the left and the rest to the right.
  const partners = branches.flatMap((b) => (b.partner ? [b.partner] : []))
  const row =
    partners.length < 2 ? [person, ...partners] : [partners[0], person, ...partners.slice(1)]

  // Order branches left to right by where their children hang from, so their subtrees don't cross.
  const slot = (p: Person) => row.indexOf(p)
  const anchorSlot = (b: Branch) => (b.partner ? (slot(b.partner) + slot(person)) / 2 : slot(person))
  branches.sort((a, b) => anchorSlot(a) - anchorSlot(b))

  const { nodeWidth, partnerGap, siblingGap } = ctx.options
  const allChildren = branches.flatMap((b) => b.children)
  const rowWidth = row.length * nodeWidth + (row.length - 1) * partnerGap
  const childrenWidth =
    allChildren.reduce((sum, c) => sum + c.width, 0) +
    Math.max(0, allChildren.length - 1) * siblingGap

  return {
    person,
    row,
    branches,
    rowWidth,
    childrenWidth,
    width: Math.max(rowWidth, childrenWidth),
  }
}

/** Positions a unit with its left edge at `left`. Returns the centre x of the unit's person. */
function place(
  unit: Unit,
  left: number,
  generation: number,
  layout: FamilyTreeLayout,
  options: LayoutOptions,
): number {
  const { nodeWidth: w, nodeHeight: h, partnerGap, siblingGap, generationGap } = options
  const y = generation * (h + generationGap)
  const rowLeft = left + (unit.width - unit.rowWidth) / 2

  const xOf = new Map<string, number>()
  unit.row.forEach((person, i) => {
    const x = rowLeft + i * (w + partnerGap)
    xOf.set(person.id, x)
    layout.nodes.push({
      person,
      x,
      y,
      width: w,
      height: h,
      generation,
      role: person === unit.person ? 'descendant' : 'partner',
    })
  })

  const personX = xOf.get(unit.person.id)!
  const midY = y + h / 2
  const childTop = y + h + generationGap
  const parentBranches = unit.branches.filter((b) => b.children.length > 0)
  let childLeft = left + (unit.width - unit.childrenWidth) / 2

  for (const branch of unit.branches) {
    const { family, partner, children } = branch
    let anchor: Point

    if (partner) {
      const partnerX = xOf.get(partner.id)!
      const [l, r] = partnerX < personX ? [partnerX, personX] : [personX, partnerX]
      layout.connectors.push({
        id: `${family.id}:partners`,
        kind: 'partner',
        familyId: family.id,
        points: [
          [l + w, midY],
          [r, midY],
        ],
      })
      anchor = [(l + w + r) / 2, midY]
    } else {
      anchor = [personX + w / 2, y + h]
    }

    if (children.length === 0) continue

    // Stagger the horizontal bus when one person has children in several families.
    const index = parentBranches.indexOf(branch)
    const busY =
      y + h + generationGap / 2 + (index - (parentBranches.length - 1) / 2) * BUS_SPACING

    for (const child of children) {
      const childX = place(child, childLeft, generation + 1, layout, options)
      childLeft += child.width + siblingGap
      layout.connectors.push({
        id: `${family.id}:${child.person.id}`,
        kind: 'descent',
        familyId: family.id,
        points: [anchor, [anchor[0], busY], [childX, busY], [childX, childTop]],
      })
    }
  }

  return personX + w / 2
}
