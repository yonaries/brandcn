import fs from 'fs-extra'
const {access, copy, ensureDir, readdir} = fs
import {constants} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import type {LogoOperationResult, ProcessLogosOptions} from '../types/logos.js'

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

  // Try reading configured outputDir from package.json
  const configured = getConfiguredOutputDir()
  if (configured) {
    return configured
  }

  // Check if src folder exists first
  const defaultPath = getDefaultDirectoryPath()

  return path.resolve(process.cwd(), defaultPath)
}

export function setCustomTargetDirectory(directory: string): void {
  const normalized = directory?.toString().trim() || 'components/logos'
  customTargetDirectory = normalized
  persistConfiguredOutputDir(normalized)
}

export function getDefaultDirectoryPath(): string {
  // Check if src folder exists first
  const srcPath = path.resolve(process.cwd(), 'src')
  try {
    if (fs.pathExistsSync(srcPath) && fs.statSync(srcPath).isDirectory()) {
      return 'src/components/logos'
    }
  } catch {
    // If we can't access src folder, fall back to default
  }

  return 'components/logos'
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

export function getVariantType(logoName: string, baseName: string): null | string {
  const lowerName = logoName.toLowerCase()
  const lowerBase = baseName.toLowerCase()

  if (lowerName.includes('_dark')) return 'dark'
  if (lowerName.includes('_light')) return 'light'
  if (lowerName.includes('_wordmark')) return 'wordmark'
  if (lowerName === lowerBase) return 'default'

  // Check for other variant patterns
  if (lowerName.includes('_icon')) return 'icon'
  if (lowerName.includes('_logo')) return 'logo'

  return null
}

// Configuration helpers
function findNearestPackageJson(startDir: string = process.cwd()): null | string {
  let currentDir = startDir
  while (true) {
    const candidate = path.join(currentDir, 'package.json')
    if (fs.pathExistsSync(candidate)) return candidate
    const parent = path.dirname(currentDir)
    if (parent === currentDir) break
    currentDir = parent
  }

  return null
}

function readBrandcnOutputDirFrom(pkgPath: string): null | string {
  try {
    const pkg = fs.readJSONSync(pkgPath)
    const output = pkg?.brandcn?.outputDir
    if (typeof output === 'string' && output.trim().length > 0) {
      return path.resolve(path.dirname(pkgPath), output.trim())
    }

    return null
  } catch {
    return null
  }
}

function listWorkspacePackageJsonCandidates(): string[] {
  const roots = ['apps', 'packages']
  const results: string[] = []
  for (const root of roots) {
    const rootPath = path.resolve(process.cwd(), root)
    if (!fs.pathExistsSync(rootPath) || !fs.statSync(rootPath).isDirectory()) continue
    const entries = fs.readdirSync(rootPath)
    for (const entry of entries) {
      const pkgJson = path.join(rootPath, entry, 'package.json')
      if (fs.pathExistsSync(pkgJson)) results.push(pkgJson)
    }
  }
  
  return results
}

function getConfiguredOutputDir(): null | string {
  try {
    const nearest = findNearestPackageJson()
    const absFromNearest = nearest ? readBrandcnOutputDirFrom(nearest) : null
    if (absFromNearest) return absFromNearest

    const workspacePkgs = listWorkspacePackageJsonCandidates()
    const absCandidates = workspacePkgs
      .map((pkgPath) => readBrandcnOutputDirFrom(pkgPath))
      .filter(Boolean) as string[]
    if (absCandidates.length === 1) return absCandidates[0]

    return null
  } catch {
    return null
  }
}

interface PackageJsonLike {
  [key: string]: unknown
  brandcn?: {
    [key: string]: unknown
    outputDir?: string
  }
}

function persistConfiguredOutputDir(directory: string): void {
  try {
    const normalized = directory?.toString().trim() || 'components/logos'
    const absTarget = path.resolve(process.cwd(), normalized)
    const nearestFromTarget = findNearestPackageJson(path.dirname(absTarget))
    const nearestFromCwd = findNearestPackageJson()
    const pkgPath = nearestFromTarget || nearestFromCwd
    if (!pkgPath) return
    let pkg: PackageJsonLike = {}
    try {
      pkg = fs.readJSONSync(pkgPath)
    } catch {
      pkg = {}
    }

    const nextPkg = {
      ...pkg,
      brandcn: {
        ...pkg.brandcn,
        outputDir: normalized,
      },
    }

    fs.writeJSONSync(pkgPath, nextPkg, {spaces: 2})
  } catch {
    // Ignore persistence errors; CLI can still operate with in-memory value
  }
}
