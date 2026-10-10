import { format } from 'date-fns'
import { enGB } from 'date-fns/locale/en-GB'

/**
 * One date style for the whole web app ("28 Sep 2026", "28 Sep 2026, 14:05").
 * `toLocaleDateString()` without a locale follows the browser, so the same
 * page read 9/28/2026 on one machine and 28/09/2026 on another. Dates render
 * in the viewer's time zone.
 */
type DateInput = Date | number

/** "28 Sep 2026" */
export function formatDate(date: DateInput): string {
  return format(date, 'd MMM yyyy', { locale: enGB })
}

/** "28 Sep 2026, 14:05" */
export function formatDateTime(date: DateInput): string {
  return format(date, 'd MMM yyyy, HH:mm', { locale: enGB })
}

/** "14:05" */
export function formatTime(date: DateInput): string {
  return format(date, 'HH:mm', { locale: enGB })
}
