import pkg from 'fs-extra'
const {access, copy, ensureDir, readdir} = pkg
import {constants} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

/**
 * Simulates network/file operation delay for realistic UX testing in development
 * Only adds delay when NODE_ENV is 'development' or when running via bin/dev.js
 * @param ms - Milliseconds to delay (default: random 100-300ms)
 */
async function simulateNetworkDelay(ms?: number): Promise<void> {
  // Check if we're in development mode
  const isDevelopment =
    process.env.NODE_ENV === 'development' ||
    process.argv[1]?.includes('bin/dev.js') ||
    process.env.BRANDCN_DEV === 'true'

  if (!isDevelopment) {
    return // No delay in production
  }

  const delay = ms ?? Math.floor(Math.random() * 200) + 100 // 100-300ms random
  await new Promise((resolve) => {
    setTimeout(resolve, delay)
  })
}

/**
 * Gets the absolute path to the library directory
 * @returns Absolute path to the library directory
 */
export function getLibraryPath(): string {
  // Get the directory of this current file
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  // Navigate up to the project root and then to library
  // In dev mode: src/utils -> ../../library
  // In built mode: dist/utils -> ../../library
  return path.resolve(currentDir, '../../library')
}

/**
 * Gets the absolute path to the target logos directory in user's project
 * @returns Absolute path to the logos directory
 */
export function getTargetLogosPath(): string {
  return path.resolve(process.cwd(), 'components/logos')
}

/**
 * Checks if a logo exists in the library
 * @param logoName - Name of the logo (without .svg extension)
 * @returns True if the logo exists, false otherwise
 */
export async function logoExistsInLibrary(logoName: string): Promise<boolean> {
  const libraryPath = getLibraryPath()
  const logoPath = path.join(libraryPath, `${logoName}.svg`)

  // Simulate network request to check if logo exists in remote library
  await simulateNetworkDelay()

  try {
    await access(logoPath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Checks if a logo already exists in the target directory
 * @param logoName - Name of the logo (without .svg extension)
 * @returns True if the logo exists in target, false otherwise
 */
export async function logoExistsInTarget(logoName: string): Promise<boolean> {
  const targetPath = getTargetLogosPath()
  const logoPath = path.join(targetPath, `${logoName}.svg`)

  try {
    await access(logoPath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Ensures the target logos directory exists
 * @returns Promise that resolves when directory is created or confirmed to exist
 */
export async function ensureTargetDirectory(): Promise<void> {
  const targetPath = getTargetLogosPath()
  await ensureDir(targetPath)
}

/**
 * Copies a logo from library to target directory
 * @param logoName - Name of the logo (without .svg extension)
 * @returns Promise that resolves when copy is complete
 * @throws Error if source file doesn't exist or copy fails
 */
export async function copyLogoToTarget(logoName: string): Promise<void> {
  const libraryPath = getLibraryPath()
  const targetPath = getTargetLogosPath()

  const sourcePath = path.join(libraryPath, `${logoName}.svg`)
  const destPath = path.join(targetPath, `${logoName}.svg`)

  // Verify source exists (this already includes network delay)
  const sourceExists = await logoExistsInLibrary(logoName)
  if (!sourceExists) {
    throw new Error(`Logo "${logoName}.svg" not found in library`)
  }

  // Ensure target directory exists
  await ensureTargetDirectory()

  // Simulate network download delay (downloading the actual logo file)
  await simulateNetworkDelay(200) // Slightly longer for file download

  // Copy the file
  await copy(sourcePath, destPath, {overwrite: false})
}

/**
 * Gets a list of all available logos in the library
 * @returns Array of logo names (without .svg extension)
 */
export async function getAvailableLogos(): Promise<string[]> {
  const libraryPath = getLibraryPath()

  try {
    const files = await readdir(libraryPath)
    return files
      .filter((file) => file.endsWith('.svg'))
      .map((file) => file.replace('.svg', ''))
      .sort()
  } catch (error) {
    throw new Error(`Failed to read library directory: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Available variant types for logos
 */
export type VariantType = 'dark' | 'light' | 'wordmark'

/**
 * Options for processing logos with variant filtering
 */
export interface ProcessLogosOptions {
  dark?: boolean
  light?: boolean
  wordmark?: boolean
}

/**
 * Finds all logo variants for a given brand name
 * @param brandName - The brand name to search for
 * @param availableLogos - Array of all available logo names
 * @returns Array of matching logo names with their variants
 */
export function findLogoVariants(brandName: string, availableLogos: string[]): string[] {
  const matches: string[] = []

  // Normalize brand name for comparison (lowercase, no special chars except hyphens and underscores)
  const normalizedBrand = brandName.toLowerCase()

  for (const logo of availableLogos) {
    const logoLower = logo.toLowerCase()

    // Direct match
    if (logoLower === normalizedBrand) {
      matches.push(logo)
      continue
    }

    // Check if logo starts with brand name followed by underscore (brand_variant)
    if (logoLower.startsWith(normalizedBrand + '_')) {
      matches.push(logo)
      continue
    }

    // Check if logo starts with brand name followed by hyphen then underscore (brand-name_variant)
    const brandWithHyphen = normalizedBrand + '-'
    if (logoLower.startsWith(brandWithHyphen)) {
      const remainingPart = logoLower.slice(brandWithHyphen.length)
      // Check if remaining part contains underscore (indicating variant)
      if (remainingPart.includes('_')) {
        matches.push(logo)
      }
    }
  }

  return matches
}

/**
 * Filters logo variants based on specified variant flags
 * @param logoNames - Array of logo names to filter
 * @param options - Variant filtering options
 * @returns Filtered array of logo names
 */
export function filterByVariants(logoNames: string[], options: ProcessLogosOptions): string[] {
  if (!options.dark && !options.light && !options.wordmark) {
    // No variant filters specified, return all logos
    return logoNames
  }

  const filtered: string[] = []

  for (const logoName of logoNames) {
    const lowerName = logoName.toLowerCase()

    // Check if logo matches any of the requested variants
    let matched = false

    if (options.dark && lowerName.includes('_dark')) {
      filtered.push(logoName)
      matched = true
    }

    if (options.light && lowerName.includes('_light')) {
      filtered.push(logoName)
      matched = true
    }

    if (options.wordmark && lowerName.includes('_wordmark')) {
      filtered.push(logoName)
      matched = true
    }

    // Only include base logo if no specific variants were found AND no variant suffixes exist
    if (!matched && !lowerName.includes('_dark') && !lowerName.includes('_light') && !lowerName.includes('_wordmark')) {
      // Check if there are any variants available for this brand
      const hasVariants = logoNames.some((otherLogo) => {
        const otherLower = otherLogo.toLowerCase()
        return (
          otherLower !== lowerName &&
          (otherLower.startsWith(lowerName + '_') ||
            (lowerName.includes('-') && otherLower.startsWith(lowerName.split('_')[0] + '_')))
        )
      })

      // Only include base logo if no variants available or if it's the fallback
      if (!hasVariants) {
        filtered.push(logoName)
      }
    }
  }

  return filtered
}

/**
 * Gets information about a logo operation result
 */
export interface LogoOperationResult {
  error?: string
  logoName: string
  reason?: string
  skipped?: boolean
  success: boolean
}

/**
 * Processes multiple logos, checking for existence and copying them
 * @param logoNames - Array of logo names to process
 * @returns Array of operation results
 */
export async function processLogos(
  logoNames: string[],
  options: ProcessLogosOptions = {},
): Promise<LogoOperationResult[]> {
  const results: LogoOperationResult[] = []

  // Get all available logos for brand matching
  const availableLogos = await getAvailableLogos()

  for (const logoName of logoNames) {
    try {
      // Find all variants for this brand name
      const logoVariants = findLogoVariants(logoName, availableLogos)

      if (logoVariants.length === 0) {
        // No variants found, try direct match
        // eslint-disable-next-line no-await-in-loop
        const existsInLibrary = await logoExistsInLibrary(logoName)
        if (!existsInLibrary) {
          results.push({
            error: `Logo "${logoName}" not found in library`,
            logoName,
            success: false,
          })
          continue
        }

        logoVariants.push(logoName)
      }

      // Filter variants based on options
      const filteredVariants = filterByVariants(logoVariants, options)

      if (filteredVariants.length === 0) {
        results.push({
          error: `No variants found for "${logoName}" matching the specified flags`,
          logoName,
          success: false,
        })
        continue
      }

      // Process each filtered variant
      for (const variant of filteredVariants) {
        // Check if logo already exists in target
        // eslint-disable-next-line no-await-in-loop
        const existsInTarget = await logoExistsInTarget(variant)
        if (existsInTarget) {
          results.push({
            logoName: variant,
            reason: 'Logo already exists in logos directory',
            skipped: true,
            success: true,
          })
          continue
        }

        // Copy the logo
        // eslint-disable-next-line no-await-in-loop
        await copyLogoToTarget(variant)
        results.push({
          logoName: variant,
          success: true,
        })
      }
    } catch (error) {
      results.push({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        logoName,
        success: false,
      })
    }
  }

  return results
}
