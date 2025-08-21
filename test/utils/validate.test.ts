import {describe, expect, it} from 'vitest'

import {validateLogoName, validateLogoNames, validateLogoNamesWithDetails} from '../../src/utils/validate.js'

describe('validate utilities', () => {
  describe('validateLogoName', () => {
    it('should accept valid logo names', () => {
      const validNames = ['vercel', 'next-js', 'react_native', 'Vue3', 'angular-2']

      for (const name of validNames) {
        const result = validateLogoName(name)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(name)
        }
      }
    })

    it('should reject invalid logo names', () => {
      const invalidNames = ['', 'logo@name', 'logo.name', 'logo name', 'logo+name', 'logo#name']

      for (const name of invalidNames) {
        const result = validateLogoName(name)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toBeDefined()
          expect(result.error.issues.length).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('validateLogoNames', () => {
    it('should accept arrays of valid logo names', () => {
      const validArrays = [['vercel'], ['vercel', 'next-js'], ['react', 'vue', 'angular']]

      for (const names of validArrays) {
        const result = validateLogoNames(names)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(names)
        }
      }
    })

    it('should reject empty arrays', () => {
      const result = validateLogoNames([])
      expect(result.success).toBe(false)
    })

    it('should reject arrays with invalid names', () => {
      const invalidArrays = [['vercel', 'invalid@name'], ['valid-name', ''], ['logo.name']]

      for (const names of invalidArrays) {
        const result = validateLogoNames(names)
        expect(result.success).toBe(false)
      }
    })
  })

  describe('validateLogoNamesWithDetails', () => {
    it('should return detailed validation results', () => {
      const mixedNames = ['vercel', 'invalid@name', 'valid-name', '']

      const result = validateLogoNamesWithDetails(mixedNames)

      expect(result.validNames).toEqual(['vercel', 'valid-name'])
      expect(result.errors).toHaveLength(2)
      expect(result.hasErrors).toBe(true)

      // Check error details
      const invalidNameError = result.errors.find((e) => e.name === 'invalid@name')
      expect(invalidNameError).toBeDefined()
      expect(invalidNameError?.error).toContain('alphanumeric characters')

      const emptyNameError = result.errors.find((e) => e.name === '')
      expect(emptyNameError).toBeDefined()
      expect(emptyNameError?.error).toContain('cannot be empty')
    })

    it('should handle all valid names', () => {
      const validNames = ['vercel', 'next-js', 'react']

      const result = validateLogoNamesWithDetails(validNames)

      expect(result.validNames).toEqual(validNames)
      expect(result.errors).toHaveLength(0)
      expect(result.hasErrors).toBe(false)
    })

    it('should handle all invalid names', () => {
      const invalidNames = ['invalid@name', 'logo.name', '']

      const result = validateLogoNamesWithDetails(invalidNames)

      expect(result.validNames).toHaveLength(0)
      expect(result.errors).toHaveLength(3)
      expect(result.hasErrors).toBe(true)
    })
  })
})
