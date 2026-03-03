import fs from "fs-extra"
const { access, copy, ensureDir, readdir } = fs
import { constants } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import type {
  LogoOperationResult,
  ProcessLogosOptions,
  VariantType,
} from "../types/logos.js"

export function getLibraryPath(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  return path.resolve(currentDir, "../../library")
}

export function getTargetLogosPath(): string {
  // Try resolving from shadcn components.json
  const fromComponentsJson = getComponentsJsonOutputDir()
  if (fromComponentsJson) {
    return fromComponentsJson
  }

  // Fall back to current working directory
  return process.cwd()
}

async function logoExists(
  logoName: string,
  basePath: string,
): Promise<boolean> {
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
  const sourcePath = path.join(getLibraryPath(), `${logoName}.svg`)
  const destPath = path.join(getTargetLogosPath(), `${logoName}.svg`)

  try {
    await copy(sourcePath, destPath, { overwrite: false })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Logo "${logoName}.svg" not found in library`)
    }
    throw error
  }
}

export async function getAvailableLogos(): Promise<string[]> {
  try {
    const files = await readdir(getLibraryPath())
    return files
      .filter((file) => file.endsWith(".svg"))
      .map((file) => path.parse(file).name)
      .sort()
  } catch (error) {
    throw new Error(
      `Failed to read library directory: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    )
  }
}

export function findLogoVariants(
  brandName: string,
  availableLogos: string[],
): string[] {
  const normalizedBrand = brandName.toLowerCase()

  return availableLogos.filter((logo) => {
    const logoLower = logo.toLowerCase()

    return (
      logoLower === normalizedBrand ||
      logoLower.startsWith(`${normalizedBrand}_`) ||
      (logoLower.startsWith(`${normalizedBrand}-`) &&
        logoLower.slice(normalizedBrand.length + 1).includes("_"))
    )
  })
}

export function filterByVariants(
  logoNames: string[],
  options: ProcessLogosOptions,
): string[] {
  const { dark, light, wordmark } = options

  if (!dark && !light && !wordmark) return logoNames

  const variants = ["_dark", "_light", "_wordmark"]
  const requestedVariants = [
    dark && "_dark",
    light && "_light",
    wordmark && "_wordmark",
  ].filter(Boolean) as string[]

  return logoNames.filter((logoName) => {
    const lowerName = logoName.toLowerCase()

    // Include if matches any requested variant
    if (requestedVariants.some((variant) => lowerName.includes(variant))) {
      return true
    }

    // Include base logo only if it has no variant suffixes and no variants exist
    const hasVariantSuffix = variants.some((variant) =>
      lowerName.includes(variant),
    )
    if (hasVariantSuffix) return false

    const hasVariants = logoNames.some((otherLogo) => {
      const otherLower = otherLogo.toLowerCase()
      return (
        otherLower !== lowerName &&
        (otherLower.startsWith(`${lowerName}_`) ||
          (lowerName.includes("-") &&
            otherLower.startsWith(`${lowerName.split("_")[0]}_`)))
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
  await ensureTargetDirectory()

  for (const logoName of logoNames) {
    try {
      let logoVariants = findLogoVariants(logoName, availableLogos)

      if (logoVariants.length === 0) {
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
        if (await logoExistsInTarget(variant)) {
          results.push({
            logoName: variant,
            reason: "Logo already exists in logos directory",
            skipped: true,
            success: true,
          })
          continue
        }

        await copyLogoToTarget(variant)
        results.push({
          logoName: variant,
          success: true,
        })
      }
    } catch (error) {
      results.push({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        logoName,
        success: false,
      })
    }
  }

  return results
}

export function getVariantType(
  logoName: string,
  baseName: string,
): VariantType | null {
  const lowerName = logoName.toLowerCase()
  const lowerBase = baseName.toLowerCase()

  if (lowerName.includes("_dark")) return "dark"
  if (lowerName.includes("_light")) return "light"
  if (lowerName.includes("_wordmark")) return "wordmark"
  if (lowerName === lowerBase) return "default"

  // Check for other variant patterns
  if (lowerName.includes("_icon")) return "icon"
  if (lowerName.includes("_logo")) return "logo"

  return null
}

// components.json (shadcn) helpers
interface ComponentsJsonResult {
  aliases: { ui: string; [key: string]: unknown }
  filePath: string
}

function findComponentsJson(): ComponentsJsonResult | null {
  let currentDir = process.cwd()
  while (true) {
    const candidate = path.join(currentDir, "components.json")
    if (fs.pathExistsSync(candidate)) {
      try {
        const parsed = fs.readJSONSync(candidate)
        const uiAlias = parsed?.aliases?.ui
        if (typeof uiAlias === "string" && uiAlias.trim().length > 0) {
          return { aliases: parsed.aliases, filePath: candidate }
        }
      } catch {
        // Invalid JSON, skip
      }

      return null
    }

    const parent = path.dirname(currentDir)
    if (parent === currentDir) break
    currentDir = parent
  }

  return null
}

function resolveTsconfigAlias(
  alias: string,
  componentsJsonDir: string,
): null | string {
  // Try tsconfig.json, then jsconfig.json
  const configNames = ["tsconfig.json", "jsconfig.json"]
  let tsconfigPath: null | string = null

  for (const name of configNames) {
    const candidate = path.join(componentsJsonDir, name)
    if (fs.pathExistsSync(candidate)) {
      tsconfigPath = candidate
      break
    }
  }

  if (!tsconfigPath) return null

  try {
    const raw = fs.readFileSync(tsconfigPath, "utf-8")
    // Strip single-line and multi-line comments for JSON parsing
    const stripped = raw
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
    const tsconfig = JSON.parse(stripped)
    const paths: Record<string, string[]> | undefined =
      tsconfig?.compilerOptions?.paths
    const baseUrl: string = tsconfig?.compilerOptions?.baseUrl ?? "."

    if (paths) {
      for (const [pattern, targets] of Object.entries(paths)) {
        if (!pattern.endsWith("/*") || !targets || targets.length === 0)
          continue
        const prefix = pattern.slice(0, -1) // e.g. "@/" from "@/*"
        if (alias.startsWith(prefix)) {
          const target = targets[0]
          if (!target.endsWith("/*")) continue
          const targetPrefix = target.slice(0, -1) // e.g. "./src/" from "./src/*"
          const remainder = alias.slice(prefix.length) // e.g. "components/ui" from "@/components/ui"
          return path.resolve(
            componentsJsonDir,
            baseUrl,
            targetPrefix + remainder,
          )
        }
      }
    }

    // Fallback: try stripping @/ and resolving relative to project root
    if (alias.startsWith("@/")) {
      return path.resolve(componentsJsonDir, baseUrl, alias.slice(2))
    }

    return null
  } catch {
    return null
  }
}

function getComponentsJsonOutputDir(): null | string {
  try {
    const result = findComponentsJson()
    if (!result) return null

    const componentsJsonDir = path.dirname(result.filePath)
    const resolved = resolveTsconfigAlias(
      result.aliases.ui,
      componentsJsonDir,
    )
    if (!resolved) return null

    return path.join(resolved, "logos")
  } catch {
    return null
  }
}

