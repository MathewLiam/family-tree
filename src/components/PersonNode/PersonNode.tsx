import type { Person, PersonDate } from '../../types'
import { formatDate, toDateTimeAttribute, type DateFormatter } from '../../utils/formatDate'
import './PersonNode.css'

export interface PersonNodeProps {
  person: Person
  /** Highlights the node, e.g. the person currently in focus in the tree. */
  selected?: boolean
  /** Makes the node interactive (rendered as a button). */
  onSelect?: (person: Person) => void
  /** Locale for formatting dates. Defaults to the browser's locale. */
  locale?: string
  /** Overrides date formatting entirely. */
  formatDate?: DateFormatter
  className?: string
}

export function PersonNode({
  person,
  selected = false,
  onSelect,
  locale,
  formatDate: customFormat,
  className,
}: PersonNodeProps) {
  const format: DateFormatter = customFormat ?? ((date) => formatDate(date, locale))
  const interactive = onSelect !== undefined
  const Element = interactive ? 'button' : 'div'

  const classes = ['ft-person-node']
  if (selected) classes.push('ft-person-node--selected')
  if (person.dateOfDeath !== undefined) classes.push('ft-person-node--deceased')
  if (className) classes.push(className)

  return (
    <Element
      className={classes.join(' ')}
      data-person-id={person.id}
      {...(interactive && {
        type: 'button' as const,
        'aria-pressed': selected,
        onClick: () => onSelect(person),
      })}
    >
      <span className="ft-person-node__name" title={person.name}>
        {person.name}
      </span>
      <span className="ft-person-node__dates">
        {person.dateOfBirth !== undefined && (
          <LifeEvent label="Born" date={person.dateOfBirth} format={format} />
        )}
        {person.dateOfDeath !== undefined && (
          <LifeEvent label="Died" date={person.dateOfDeath} format={format} />
        )}
      </span>
    </Element>
  )
}

interface LifeEventProps {
  label: string
  date: PersonDate
  format: DateFormatter
}

function LifeEvent({ label, date, format }: LifeEventProps) {
  return (
    <span className="ft-person-node__event">
      <span className="ft-person-node__label">{label}</span>{' '}
      <time dateTime={toDateTimeAttribute(date)}>{format(date)}</time>
    </span>
  )
}
