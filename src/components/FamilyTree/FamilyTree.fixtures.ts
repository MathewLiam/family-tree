import type { Family, Person } from '../../types'

/**
 * A fictional five-generation family. Covers a remarriage (Florence), a
 * single parent (Margaret), a childless couple (Michael), a person with no
 * partner (Harold), and partial or missing dates.
 */
export const ashworthPeople: Person[] = [
  { id: 'arthur', name: 'Arthur Ashworth', dateOfBirth: 'c. 1890', dateOfDeath: '1962-05-14' },
  { id: 'edith', name: 'Edith Clarke', dateOfBirth: '1893', dateOfDeath: '1970-11-02' },

  { id: 'george', name: 'George Ashworth', dateOfBirth: '1915-02-08', dateOfDeath: '1988-07-19' },
  { id: 'mary', name: 'Mary Holt', dateOfBirth: '1917-09-30', dateOfDeath: '2004-01-11' },
  { id: 'florence', name: 'Florence Ashworth', dateOfBirth: '1918-06-21', dateOfDeath: '2001-03-03' },
  { id: 'albert', name: 'Albert Price', dateOfBirth: '1914-12-01', dateOfDeath: '1944-06-06' },
  { id: 'frank', name: 'Francis Doyle', dateOfBirth: '1916-04-17', dateOfDeath: '1990' },
  { id: 'harold', name: 'Harold Ashworth', dateOfBirth: '1921-10-10', dateOfDeath: '1943-08-22' },

  { id: 'peter', name: 'Peter Ashworth', dateOfBirth: '1942-03-15' },
  { id: 'susan', name: 'Susan Whitfield', dateOfBirth: '1944-08-02' },
  { id: 'margaret', name: 'Margaret Ashworth', dateOfBirth: '1945-12-24', dateOfDeath: '2019-04-09' },
  { id: 'joan', name: 'Joan Price', dateOfBirth: '1940-01-29' },
  { id: 'michael', name: 'Michael Doyle', dateOfBirth: '1948-07-04' },
  { id: 'anne', name: 'Anne Kowalski', dateOfBirth: '1950-05-05' },

  { id: 'david', name: 'David Ashworth', dateOfBirth: '1968-10-01' },
  { id: 'sarah', name: 'Sarah Ashworth', dateOfBirth: '1971-02-14' },
  { id: 'james', name: 'James Okafor', dateOfBirth: '1970-06-30' },
  { id: 'claire', name: 'Claire Ashworth', dateOfBirth: '1970-09-09' },

  { id: 'emily', name: 'Emily Okafor', dateOfBirth: '1999-11-20' },
  { id: 'tom', name: 'Thomas Okafor', dateOfBirth: '2002-04-03' },
]

export const ashworthFamilies: Family[] = [
  { id: 'f-arthur-edith', partnerIds: ['arthur', 'edith'], childIds: ['george', 'florence', 'harold'] },
  { id: 'f-george-mary', partnerIds: ['george', 'mary'], childIds: ['peter', 'margaret'] },
  { id: 'f-florence-albert', partnerIds: ['florence', 'albert'], childIds: ['joan'] },
  { id: 'f-florence-frank', partnerIds: ['florence', 'frank'], childIds: ['michael'] },
  { id: 'f-peter-susan', partnerIds: ['peter', 'susan'], childIds: ['david', 'sarah'] },
  { id: 'f-margaret', partnerIds: ['margaret'], childIds: ['claire'] },
  { id: 'f-michael-anne', partnerIds: ['michael', 'anne'], childIds: [] },
  { id: 'f-sarah-james', partnerIds: ['sarah', 'james'], childIds: ['emily', 'tom'] },
]

/**
 * Generates a large, regular tree for checking performance: every descendant
 * has a partner and `childrenPerFamily` children, down to `generations` deep.
 */
export function generateFamily(
  generations: number,
  childrenPerFamily: number,
): { people: Person[]; families: Family[] } {
  const people: Person[] = []
  const families: Family[] = []
  let next = 0

  const addPerson = (generation: number, surname: string): Person => {
    const id = `p${next++}`
    const year = 1850 + generation * 28 + (next % 9)
    const person: Person = {
      id,
      name: `Person ${next} ${surname}`,
      dateOfBirth: String(year),
      ...(year < 1950 && { dateOfDeath: String(year + 60 + (next % 25)) }),
    }
    people.push(person)
    return person
  }

  const grow = (person: Person, generation: number) => {
    if (generation >= generations - 1) return
    const partner = addPerson(generation, 'Partner')
    const children = Array.from({ length: childrenPerFamily }, () => addPerson(generation + 1, 'Smith'))
    families.push({ id: `f${families.length}`, partnerIds: [person.id, partner.id], childIds: children.map((c) => c.id) })
    for (const child of children) grow(child, generation + 1)
  }

  grow(addPerson(0, 'Smith'), 0)
  return { people, families }
}
