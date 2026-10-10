import { describe, it, expect, vi } from 'vitest'
import {
  listenForCropKeys,
  type CropKeyEvent,
  type KeyTarget,
} from './cropModalKeys'

/** A window stand-in that records how the listener was added. */
function fakeWindow() {
  const listeners: {
    listener: (event: CropKeyEvent) => void
    capture: boolean
  }[] = []
  const target: KeyTarget = {
    addEventListener: (_, listener, capture) =>
      listeners.push({ listener, capture }),
    removeEventListener: (_, listener) => {
      const i = listeners.findIndex(entry => entry.listener === listener)
      if (i >= 0) listeners.splice(i, 1)
    },
  }
  return { target, listeners }
}

function keyEvent(key: string, target: unknown = null, shiftKey = false) {
  return {
    key,
    shiftKey,
    target: target as EventTarget | null,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }
}

function setup() {
  const win = fakeWindow()
  const handlers = {
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    focusables: vi.fn(() => [] as { focus: () => void }[]),
  }
  const stop = listenForCropKeys(win.target, handlers)
  return { ...win, handlers, stop }
}

describe('listenForCropKeys', () => {
  it('handles keys in the capture phase, ahead of the dialog underneath', () => {
    // The mission editor's Escape handler listens on the document; only a
    // capture listener on the window runs before it.
    const { listeners } = setup()
    expect(listeners).toHaveLength(1)
    expect(listeners[0]!.capture).toBe(true)
  })

  it('cancels the crop on Escape and keeps the key from the dialog', () => {
    const { listeners, handlers } = setup()
    const event = keyEvent('Escape')
    listeners[0]!.listener(event)
    expect(handlers.onCancel).toHaveBeenCalledOnce()
    expect(event.stopPropagation).toHaveBeenCalled()
  })

  it('applies the crop on Enter, but lets a focused button act', () => {
    const { listeners, handlers } = setup()
    listeners[0]!.listener(keyEvent('Enter', { tagName: 'DIV' }))
    expect(handlers.onConfirm).toHaveBeenCalledOnce()

    const onButton = keyEvent('Enter', { tagName: 'BUTTON' })
    listeners[0]!.listener(onButton)
    expect(handlers.onConfirm).toHaveBeenCalledOnce()
    expect(onButton.preventDefault).not.toHaveBeenCalled()
  })

  it('keeps Tab inside the modal', () => {
    const { listeners, handlers } = setup()
    const first = { focus: vi.fn() }
    const last = { focus: vi.fn() }
    handlers.focusables.mockReturnValue([first, last])

    listeners[0]!.listener(keyEvent('Tab', last))
    expect(first.focus).toHaveBeenCalled()
    listeners[0]!.listener(keyEvent('Tab', first, true))
    expect(last.focus).toHaveBeenCalled()
  })

  it('stops listening when the modal closes', () => {
    const { listeners, stop } = setup()
    stop()
    expect(listeners).toHaveLength(0)
  })
})
