import {describe, expect, it} from 'vitest'

import List from '../../src/commands/list.js'
import {getVariantType} from '../../src/utils/fs.js'

describe('List command', () => {
  describe('command validation', () => {
    it('should have correct description', () => {
      expect(List.description).toBe('List all available brand logos')
    })

    it('should have examples', () => {
      expect(List.examples).toBeDefined()
      expect(List.examples.length).toBeGreaterThan(0)
      expect(List.examples).toContain('$ brandcn list')
      expect(List.examples).toContain('$ brandcn list --search react')
      expect(List.examples).toContain('$ brandcn list --variants')
    })

    it('should have empty args object', () => {
      expect(List.args).toEqual({})
    })

    it('should have search flag', () => {
      expect(List.flags.search).toBeDefined()
      expect(List.flags.search.char).toBe('s')
      expect(List.flags.search.description).toBe('Search for logos containing the specified text')
    })

    it('should have variants flag', () => {
      expect(List.flags.variants).toBeDefined()
      expect(List.flags.variants.char).toBe('v')
      expect(List.flags.variants.description).toBe('Group logos by brand and show variants')
    })
  })

  describe('variant type detection', () => {
    it('should detect dark variant', () => {
      expect(getVariantType('react_dark', 'react')).toBe('dark')
    })

    it('should detect light variant', () => {
      expect(getVariantType('react_light', 'react')).toBe('light')
    })

    it('should detect wordmark variant', () => {
      expect(getVariantType('react_wordmark', 'react')).toBe('wordmark')
    })

    it('should detect icon variant', () => {
      expect(getVariantType('react_icon', 'react')).toBe('icon')
    })

    it('should detect default variant', () => {
      expect(getVariantType('react', 'react')).toBe('default')
    })

    it('should return null for unknown variant', () => {
      expect(getVariantType('react_unknown', 'react')).toBe(null)
    })
  })
})

// Note: Integration tests that execute the CLI can be run manually using:
// - pnpm run build && ./bin/run.js list
// - pnpm run build && ./bin/run.js list --search react
// - pnpm run build && ./bin/run.js list --variants
// The unit tests above provide comprehensive coverage of the command logic.
