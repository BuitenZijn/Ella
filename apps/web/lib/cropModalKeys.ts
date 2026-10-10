/** The parts of a key event the crop modal looks at. */
export interface CropKeyEvent {
  key: string
  shiftKey: boolean
  target: EventTarget | null
  preventDefault: () => void
  stopPropagation: () => void
}

/** Something that can be focused, like an HTMLElement. */
export interface Focusable {
  focus: () => void
}

export interface CropKeyHandlers {
  /** Escape: close the crop modal without cropping. */
  onCancel: () => void
  /** Enter (outside a button, which activates itself): apply the crop. */
  onConfirm: () => void
  /** The modal's focusable controls in tab order, for trapping Tab. */
  focusables: () => Focusable[]
}

/** Where keydown listeners go: a window, or a stand-in in tests. */
export interface KeyTarget {
  addEventListener: (
    type: 'keydown',
    listener: (event: CropKeyEvent) => void,
    capture: boolean,
  ) => void
  removeEventListener: (
    type: 'keydown',
    listener: (event: CropKeyEvent) => void,
    capture: boolean,
  ) => void
}

function isButton(target: EventTarget | null): boolean {
  const element = target as { tagName?: string; getAttribute?: unknown } | null
  if (!element) return false
  if (element.tagName === 'BUTTON') return true
  return (
    typeof element.getAttribute === 'function' &&
    (element as Element).getAttribute('role') === 'button'
  )
}

/**
 * Handle the crop modal's keys before anything else on the page does.
 *
 * The modal opens on top of other dialogs, such as the mission editor, whose
 * Escape handler listens on the document. Listening on the window in the
 * capture phase runs first, and stopping the key there keeps it from the
 * dialog underneath: Escape cancels the crop instead of also closing (and
 * discarding) the mission. Tab is kept inside the modal the same way, since
 * the dialog underneath would otherwise move focus through its own controls.
 *
 * @returns a function that stops listening
 */
export function listenForCropKeys(
  target: KeyTarget,
  handlers: CropKeyHandlers,
): () => void {
  const onKeyDown = (event: CropKeyEvent) => {
    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        handlers.onCancel()
        return
      case 'Enter':
        event.stopPropagation()
        if (isButton(event.target)) return
        event.preventDefault()
        handlers.onConfirm()
        return
      case 'Tab': {
        event.preventDefault()
        event.stopPropagation()
        const items = handlers.focusables()
        if (items.length === 0) return
        const at = items.findIndex(item => item === (event.target as unknown))
        const next = event.shiftKey
          ? at <= 0
            ? items.length - 1
            : at - 1
          : (at + 1) % items.length
        items[next]!.focus()
        return
      }
    }
  }
  target.addEventListener('keydown', onKeyDown, true)
  return () => target.removeEventListener('keydown', onKeyDown, true)
}
