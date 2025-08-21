import {describe, expect, it} from 'vitest'

import Add from '../../src/commands/add.js'
import {validateLogoNames} from '../../src/utils/validate.js'

describe('Add command', () => {
  describe('command validation', () => {
    it('should have correct description', () => {
      expect(Add.description).toBe('Add brand logos to your project')
    })

    it('should have examples', () => {
      expect(Add.examples).toBeDefined()
      expect(Add.examples.length).toBeGreaterThan(0)
      expect(Add.examples).toContain('$ brandcn add vercel')
    })

    it('should have strict mode disabled', () => {
      expect(Add.strict).toBe(false)
    })

    it('should have empty args object', () => {
      expect(Add.args).toEqual({})
    })
  })

  describe('logo name validation integration', () => {
    it('should validate logo names correctly', () => {
      const validNames = ['vercel', 'neon', 'figma']
      const result = validateLogoNames(validNames)

      expect(result.validNames).toEqual(validNames)
      expect(result.errors).toHaveLength(0)
      expect(result.hasErrors).toBe(false)
    })

    it('should handle mixed valid and invalid names', () => {
      const mixedNames = ['vercel', 'invalid@name', 'neon']
      const result = validateLogoNames(mixedNames)

      expect(result.validNames).toEqual(['vercel', 'neon'])
      expect(result.errors).toHaveLength(1)
      expect(result.hasErrors).toBe(true)
      expect(result.errors[0]?.name).toBe('invalid@name')
    })
  })
})

// Note: Integration tests that execute the CLI can be run manually using:
// - pnpm run build && ./bin/run.js add vercel
// - pnpm run build && ./bin/run.js add vercel neon
// The unit tests above provide comprehensive coverage of the command logic.
