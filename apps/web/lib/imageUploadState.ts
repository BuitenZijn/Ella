/**
 * Whether the image `ImageUpload` was given has been removed: the creator
 * pressed remove on this very value. A new `value` from the parent (say,
 * after it saved another image) is not removed.
 */
export function isImageRemoved<Id extends string>(
  removedValue: Id | null,
  value: Id | null | undefined,
): boolean {
  return removedValue !== null && removedValue === value
}

/**
 * What `ImageUpload.upload()` resolves to when no new file was picked: the
 * image it was given, or null when the creator removed it (or there never
 * was one).
 *
 * It used to resolve to the image it was given even after the creator
 * removed it, so an existing image could never be removed.
 */
export function imageWithoutUpload<Id extends string>(
  value: Id | null | undefined,
  removedValue: Id | null,
): Id | null {
  return isImageRemoved(removedValue, value) ? null : (value ?? null)
}

/** Something the creator did to the box that bears on the image it was given */
export type ImageBoxAction<Id extends string> =
  { type: 'remove'; value: Id | null | undefined } | { type: 'clear' }

/**
 * Which image the box counts as removed (`removedValue`) after an action:
 *
 * - `remove` removes the image it was given; with none, only a picked file
 *   went and nothing changes here.
 * - `clear` (e.g. the creator cancels an edit) puts everything back, the
 *   image it was given included.
 *
 * `clear` used to keep the removal, so cancelling after a removal showed an
 * empty box, and a later `upload()` still resolved to null.
 */
export function nextRemovedValue<Id extends string>(
  removedValue: Id | null,
  action: ImageBoxAction<Id>,
): Id | null {
  switch (action.type) {
    case 'remove':
      return action.value ?? removedValue
    case 'clear':
      return null
  }
}
