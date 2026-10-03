/**
 * A date as recorded in a family history.
 *
 * - `Date`: formatted for the reader's locale.
 * - ISO date string (`"1920-03-12"`): parsed and formatted the same way.
 * - Any other string (`"1850"`, `"c. 1850"`, `"Mar 1850"`): shown as written,
 *   because genealogical dates are often partial or approximate.
 */
export type PersonDate = Date | string

export interface Person {
  id: string
  name: string
  dateOfBirth?: PersonDate
  dateOfDeath?: PersonDate
}

/**
 * A partnership and/or set of children, like a GEDCOM `FAM` record.
 *
 * - Couple with children: `{ partnerIds: [a, b], childIds: [c, d] }`
 * - Single parent: `{ partnerIds: [a], childIds: [c] }`
 * - Childless couple: `{ partnerIds: [a, b], childIds: [] }`
 *
 * A person with several partners has one family per partnership.
 */
export interface Family {
  id: string
  partnerIds: string[]
  childIds: string[]
}
