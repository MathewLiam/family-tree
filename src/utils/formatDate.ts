import type { PersonDate } from '../types'

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export type DateFormatter = (date: PersonDate) => string

/**
 * Formats a {@link PersonDate} for display, e.g. "12 Mar 1920".
 * Strings that aren't full ISO dates are returned unchanged.
 */
export function formatDate(date: PersonDate, locale?: string): string {
  if (date instanceof Date) {
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const match = ISO_DATE.exec(date)
  if (!match) return date

  // Format in UTC so the day can't shift with the reader's time zone.
  const [, year, month, day] = match
  return new Date(Date.UTC(+year, +month - 1, +day)).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Machine-readable value for a `<time dateTime>` attribute, if one can be derived. */
export function toDateTimeAttribute(date: PersonDate): string | undefined {
  if (date instanceof Date) {
    if (Number.isNaN(date.getTime())) return undefined
    // Use local parts, matching how the date is displayed (toISOString would use UTC).
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  }
  return ISO_DATE.test(date) || /^\d{4}$/.test(date) ? date : undefined
}
