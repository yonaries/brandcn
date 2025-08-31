import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  copyLogoToTarget,
  ensureTargetDirectory,
  filterByVariants,
  findLogoVariants,
  getAvailableLogos,
  getLibraryPath,
  getTargetLogosPath,
  logoExistsInLibrary,
  logoExistsInTarget,
  processLogos,
} from '../../src/utils/fs.js'

describe('fs utilities', () => {
  const testDir = path.resolve('./test-temp')
  const originalCwd = process.cwd()

  beforeEach(() => {
    // Clean up any existing test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { force: true, recursive: true })
    }

    // Create fresh test directory
    mkdirSync(testDir, { recursive: true })
    process.chdir(testDir)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    if (existsSync(testDir)) {
      rmSync(testDir, { force: true, recursive: true })
    }
  })

  describe('getLibraryPath', () => {
    it('should return a valid path to the library directory', () => {
      const libraryPath = getLibraryPath()
      expect(libraryPath).toBeDefined()
      expect(libraryPath).toContain('library')
      expect(path.isAbsolute(libraryPath)).toBe(true)
    })
  })

  describe('getTargetLogosPath', () => {
    it('should return path to logos directory in current working directory when no src folder exists', () => {
      const targetPath = getTargetLogosPath()
      expect(targetPath).toBe(path.resolve(process.cwd(), 'components/logos'))
    })

    it('should return path to logos directory in src folder when src folder exists', () => {
      // Create an src directory
      mkdirSync('./src', {recursive: true})

      const targetPath = getTargetLogosPath()
      expect(targetPath).toBe(path.resolve(process.cwd(), 'src/components/logos'))
    })
  })

  describe('logoExistsInLibrary', () => {
    it('should return true for existing logos', async () => {
      // Test with logos we know exist in the library
      const existingLogos = ['vercel', 'neon', 'figma']

      for (const logo of existingLogos) {
        // eslint-disable-next-line no-await-in-loop
        const exists = await logoExistsInLibrary(logo)
        expect(exists).toBe(true)
      }
    })

    it('should return false for non-existing logos', async () => {
      const nonExistingLogos = ['nonexistent-logo', 'fake-brand', 'does-not-exist']

      for (const logo of nonExistingLogos) {
        // eslint-disable-next-line no-await-in-loop
        const exists = await logoExistsInLibrary(logo)
        expect(exists).toBe(false)
      }
    })
  })

  describe('logoExistsInTarget', () => {
    it('should return false when logos directory does not exist', async () => {
      const exists = await logoExistsInTarget('vercel')
      expect(exists).toBe(false)
    })

    it('should return false when logo does not exist in target', async () => {
      mkdirSync('./components', { recursive: true })
      mkdirSync('./components/logos')
      const exists = await logoExistsInTarget('vercel')
      expect(exists).toBe(false)
    })

    it('should return true when logo exists in target', async () => {
      mkdirSync('./components', { recursive: true })
      mkdirSync('./components/logos')
      writeFileSync('./components/logos/vercel.svg', '<svg></svg>')

      const exists = await logoExistsInTarget('vercel')
      expect(exists).toBe(true)
    })
  })

  describe('ensureTargetDirectory', () => {
    it('should create logos directory if it does not exist', async () => {
      expect(existsSync('./components/logos')).toBe(false)

      await ensureTargetDirectory()

      expect(existsSync('./components/logos')).toBe(true)
    })

    it('should not fail if logos directory already exists', async () => {
      mkdirSync('./components', { recursive: true })
      mkdirSync('./components/logos')
      expect(existsSync('./components/logos')).toBe(true)

      await ensureTargetDirectory()

      expect(existsSync('./components/logos')).toBe(true)
    })
  })

  describe('getAvailableLogos', () => {
    it('should return an array of available logo names', async () => {
      const logos = await getAvailableLogos()

      expect(Array.isArray(logos)).toBe(true)
      expect(logos.length).toBeGreaterThan(0)

      // Check that some known logos are included
      expect(logos).toContain('vercel')
      expect(logos).toContain('neon')
      expect(logos).toContain('figma')

      // Check that all items are strings without .svg extension
      for (const logo of logos) {
        expect(typeof logo).toBe('string')
        expect(logo).not.toContain('.svg')
      }

      // Check that the array is sorted
      const sortedLogos = [...logos].sort()
      expect(logos).toEqual(sortedLogos)
    })
  })

  describe('copyLogoToTarget', () => {
    it('should copy an existing logo to target directory', async () => {
      await copyLogoToTarget('vercel')

      expect(existsSync('./components/logos')).toBe(true)
      expect(existsSync('./components/logos/vercel.svg')).toBe(true)
    })

    it('should throw error for non-existing logo', async () => {
      await expect(copyLogoToTarget('nonexistent-logo')).rejects.toThrow('not found in library')
    })
  })

  describe('findLogoVariants', () => {
    it('should find exact matches', () => {
      const availableLogos = ['vercel', 'neon', 'figma']
      const variants = findLogoVariants('vercel', availableLogos)
      expect(variants).toEqual(['vercel'])
    })

    it('should find variants with underscore (brand_variant)', () => {
      const availableLogos = ['github', 'github_dark', 'github_light', 'github_wordmark']
      const variants = findLogoVariants('github', availableLogos)
      expect(variants).toEqual(['github', 'github_dark', 'github_light', 'github_wordmark'])
    })

    it('should find variants with hyphen and underscore (brand-name_variant)', () => {
      const availableLogos = [
        'apple-music',
        'apple-music_icon',
        'apple-music_wordmark_dark',
        'apple-music_wordmark_light',
      ]
      const variants = findLogoVariants('apple-music', availableLogos)
      expect(variants).toEqual([
        'apple-music',
        'apple-music_icon',
        'apple-music_wordmark_dark',
        'apple-music_wordmark_light',
      ])
    })

    it('should handle case insensitive matching', () => {
      const availableLogos = ['GitHub', 'GitHub_dark', 'GitHub_light']
      const variants = findLogoVariants('github', availableLogos)
      expect(variants).toEqual(['GitHub', 'GitHub_dark', 'GitHub_light'])
    })

    it('should return empty array for non-matching brands', () => {
      const availableLogos = ['vercel', 'neon', 'figma']
      const variants = findLogoVariants('nonexistent', availableLogos)
      expect(variants).toEqual([])
    })
  })

  describe('filterByVariants', () => {
    it('should return all logos when no filters specified', () => {
      const logos = ['github', 'github_dark', 'github_light', 'github_wordmark']
      const filtered = filterByVariants(logos, {})
      expect(filtered).toEqual(logos)
    })

    it('should filter only dark variants', () => {
      const logos = ['github', 'github_dark', 'github_light', 'github_wordmark']
      const filtered = filterByVariants(logos, { dark: true })
      expect(filtered).toEqual(['github_dark'])
    })

    it('should filter only light variants', () => {
      const logos = ['github', 'github_dark', 'github_light', 'github_wordmark']
      const filtered = filterByVariants(logos, { light: true })
      expect(filtered).toEqual(['github_light'])
    })

    it('should filter only wordmark variants', () => {
      const logos = ['github', 'github_dark', 'github_light', 'github_wordmark']
      const filtered = filterByVariants(logos, { wordmark: true })
      expect(filtered).toEqual(['github_wordmark'])
    })

    it('should filter multiple variants', () => {
      const logos = ['github', 'github_dark', 'github_light', 'github_wordmark']
      const filtered = filterByVariants(logos, { dark: true, light: true })
      expect(filtered).toEqual(['github_dark', 'github_light'])
    })

    it('should include base logo when no variants match', () => {
      const logos = ['vercel', 'neon']
      const filtered = filterByVariants(logos, { dark: true })
      expect(filtered).toEqual(['vercel', 'neon'])
    })
  })

  describe('processLogos', () => {
    it('should process multiple valid logos', async () => {
      const results = await processLogos(['vercel', 'neon'])

      expect(results.length).toBeGreaterThanOrEqual(2)

      const vercelResults = results.filter((r) => r.logoName === 'vercel')
      expect(vercelResults.length).toBeGreaterThan(0)
      expect(vercelResults.every((r) => r.success)).toBe(true)

      // Check at least one file was created
      expect(existsSync('./components/logos')).toBe(true)
    })

    it('should handle non-existing logos gracefully', async () => {
      const results = await processLogos(['nonexistent-logo'])

      expect(results).toHaveLength(1)
      const result = results[0]
      expect(result?.success).toBe(false)
      expect(result?.error).toContain('not found in library')
    })

    it('should skip already existing logos', async () => {
      // First run
      await processLogos(['vercel'])

      // Second run (should skip)
      const results = await processLogos(['vercel'])

      const skippedResults = results.filter((r) => r.skipped)
      expect(skippedResults.length).toBeGreaterThan(0)
      expect(skippedResults.every((r) => r.success && r.reason?.includes('already exists'))).toBe(
        true,
      )
    })

    it('should filter variants based on options', async () => {
      // Test with a brand that has dark variants
      const results = await processLogos(['github'], { dark: true })

      expect(results.length).toBeGreaterThan(0)
      // All successful results should be dark variants or base logos
      const successfulResults = results.filter((r) => r.success && !r.skipped)
      for (const result of successfulResults) {
        expect(
          result.logoName.toLowerCase().includes('_dark') ||
            !result.logoName.toLowerCase().includes('_'),
        ).toBe(true)
      }
    })

    it('should handle brands with no matching variants', async () => {
      const results = await processLogos(['vercel'], { dark: true, light: true, wordmark: true })

      // Should either find variants or fall back to base logo
      expect(results.length).toBeGreaterThan(0)
      const hasSuccessful = results.some((r) => r.success)
      expect(hasSuccessful).toBe(true)
    })
  })
})
