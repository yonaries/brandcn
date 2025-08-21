import pkg from 'fs-extra'
const {access, copy, ensureDir, readdir} = pkg
import {constants} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

// Global variable to store custom target directory
let customTargetDirectory: null | string = null

export function getLibraryPath(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  return path.resolve(currentDir, '../../library')
}

export function getTargetLogosPath(): string {
  if (customTargetDirectory) {
    return path.resolve(process.cwd(), customTargetDirectory)
  }

  return path.resolve(process.cwd(), 'components/logos')
}

export function setCustomTargetDirectory(directory: string): void {
  customTargetDirectory = directory
}

export async function targetDirectoryExists(): Promise<boolean> {
  try {
    await access(getTargetLogosPath(), constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function logoExists(logoName: string, basePath: string): Promise<boolean> {
  try {
    await access(path.join(basePath, `${logoName}.svg`), constants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function logoExistsInLibrary(logoName: string): Promise<boolean> {
  return logoExists(logoName, getLibraryPath())
}

export async function logoExistsInTarget(logoName: string): Promise<boolean> {
  return logoExists(logoName, getTargetLogosPath())
}

export async function ensureTargetDirectory(): Promise<void> {
  await ensureDir(getTargetLogosPath())
}

export async function copyLogoToTarget(logoName: string): Promise<void> {
  if (!(await logoExistsInLibrary(logoName))) {
    throw new Error(`Logo "${logoName}.svg" not found in library`)
  }

  await ensureTargetDirectory()

  const sourcePath = path.join(getLibraryPath(), `${logoName}.svg`)
  const destPath = path.join(getTargetLogosPath(), `${logoName}.svg`)

  await copy(sourcePath, destPath, {overwrite: false})
}

export async function getAvailableLogos(): Promise<string[]> {
  try {
    const files = await readdir(getLibraryPath())
    return files
      .filter((file) => file.endsWith('.svg'))
      .map((file) => file.replace('.svg', ''))
      .sort()
  } catch (error) {
    throw new Error(`Failed to read library directory: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export type VariantType = 'dark' | 'light' | 'wordmark'

export interface ProcessLogosOptions {
  dark?: boolean
  light?: boolean
  wordmark?: boolean
}

export function findLogoVariants(brandName: string, availableLogos: string[]): string[] {
  const normalizedBrand = brandName.toLowerCase()

  return availableLogos.filter((logo) => {
    const logoLower = logo.toLowerCase()

    return (
      logoLower === normalizedBrand ||
      logoLower.startsWith(normalizedBrand + '_') ||
      (logoLower.startsWith(normalizedBrand + '-') && logoLower.slice(normalizedBrand.length + 1).includes('_'))
    )
  })
}

export function filterByVariants(logoNames: string[], options: ProcessLogosOptions): string[] {
  const {dark, light, wordmark} = options

  if (!dark && !light && !wordmark) return logoNames

  const variants = ['_dark', '_light', '_wordmark']
  const requestedVariants = [dark && '_dark', light && '_light', wordmark && '_wordmark'].filter(Boolean) as string[]

  return logoNames.filter((logoName) => {
    const lowerName = logoName.toLowerCase()

    // Include if matches any requested variant
    if (requestedVariants.some((variant) => lowerName.includes(variant))) {
      return true
    }

    // Include base logo only if it has no variant suffixes and no variants exist
    const hasVariantSuffix = variants.some((variant) => lowerName.includes(variant))
    if (hasVariantSuffix) return false

    const hasVariants = logoNames.some((otherLogo) => {
      const otherLower = otherLogo.toLowerCase()
      return (
        otherLower !== lowerName &&
        (otherLower.startsWith(lowerName + '_') ||
          (lowerName.includes('-') && otherLower.startsWith(lowerName.split('_')[0] + '_')))
      )
    })

    return !hasVariants
  })
}

export interface LogoOperationResult {
  error?: string
  logoName: string
  reason?: string
  skipped?: boolean
  success: boolean
}

export async function processLogos(
  logoNames: string[],
  options: ProcessLogosOptions = {},
): Promise<LogoOperationResult[]> {
  const results: LogoOperationResult[] = []
  const availableLogos = await getAvailableLogos()

  for (const logoName of logoNames) {
    try {
      let logoVariants = findLogoVariants(logoName, availableLogos)

      if (logoVariants.length === 0) {
        // eslint-disable-next-line no-await-in-loop
        if (await logoExistsInLibrary(logoName)) {
          logoVariants = [logoName]
        } else {
          results.push({
            error: `Logo "${logoName}" not found in library`,
            logoName,
            success: false,
          })
          continue
        }
      }

      const filteredVariants = filterByVariants(logoVariants, options)

      if (filteredVariants.length === 0) {
        results.push({
          error: `No variants found for "${logoName}" matching the specified flags`,
          logoName,
          success: false,
        })
        continue
      }

      for (const variant of filteredVariants) {
        // eslint-disable-next-line no-await-in-loop
        if (await logoExistsInTarget(variant)) {
          results.push({
            logoName: variant,
            reason: 'Logo already exists in logos directory',
            skipped: true,
            success: true,
          })
          continue
        }

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
