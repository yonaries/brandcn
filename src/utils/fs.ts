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
export async function processLogos(logoNames: string[]): Promise<LogoOperationResult[]> {
  const results: LogoOperationResult[] = []

  for (const logoName of logoNames) {
    try {
      // Check if logo exists in library
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

      // Check if logo already exists in target
      // eslint-disable-next-line no-await-in-loop
      const existsInTarget = await logoExistsInTarget(logoName)
      if (existsInTarget) {
        results.push({
          logoName,
          reason: 'Logo already exists in logos directory',
          skipped: true,
          success: true,
        })
        continue
      }

      // Copy the logo
      // eslint-disable-next-line no-await-in-loop
      await copyLogoToTarget(logoName)
      results.push({
        logoName,
        success: true,
      })
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
