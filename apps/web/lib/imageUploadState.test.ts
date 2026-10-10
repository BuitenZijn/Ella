import { describe, it, expect } from 'vitest'
import {
  imageWithoutUpload,
  isImageRemoved,
  nextRemovedValue,
} from './imageUploadState'

describe('what upload() resolves to without a new file', () => {
  it('resolves to null once the existing image was removed', () => {
    // It used to resolve to the old image, so it could never be removed.
    expect(imageWithoutUpload('old', 'old')).toBeNull()
  })

  it('resolves to the existing image when nothing changed', () => {
    expect(imageWithoutUpload('old', null)).toBe('old')
  })

  it('resolves to null when there never was an image', () => {
    expect(imageWithoutUpload(undefined, null)).toBeNull()
    expect(imageWithoutUpload(null, null)).toBeNull()
  })

  it('shows a new image the parent passes after a removal', () => {
    expect(isImageRemoved('old', 'new')).toBe(false)
    expect(imageWithoutUpload('new', 'old')).toBe('new')
  })
})

describe('removing and clearing', () => {
  it('removes the image the box was given', () => {
    const removed = nextRemovedValue(null, { type: 'remove', value: 'old' })
    expect(isImageRemoved(removed, 'old')).toBe(true)
    expect(imageWithoutUpload('old', removed)).toBeNull()
  })

  it('keeps a removal when only a picked file goes', () => {
    expect(nextRemovedValue('old', { type: 'remove', value: undefined })).toBe(
      'old',
    )
  })

  it('shows the image it was given again after clear()', () => {
    // A Cancel after a removal calls clear(); the box used to stay empty and
    // upload() kept resolving to null.
    const removed = nextRemovedValue(null, { type: 'remove', value: 'old' })
    const cleared = nextRemovedValue(removed, { type: 'clear' })
    expect(isImageRemoved(cleared, 'old')).toBe(false)
    expect(imageWithoutUpload('old', cleared)).toBe('old')
  })
})
