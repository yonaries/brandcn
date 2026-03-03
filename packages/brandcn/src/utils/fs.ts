import fs from "fs-extra"
const { access, copy, ensureDir, readdir, writeFile } = fs
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
  extension: "svg" | "tsx" = "svg",
): Promise<boolean> {
  try {
    await access(path.join(basePath, `${logoName}.${extension}`), constants.F_OK)
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

export async function logoComponentExistsInTarget(
  logoName: string,
): Promise<boolean> {
  return logoExists(logoName, getTargetLogosPath(), "tsx")
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
    if ("ENOENT" === (error as NodeJS.ErrnoException).code) {
      throw new Error(`Logo "${logoName}.svg" not found in library`)
    }
    throw error
  }
}

function toPascalCase(value: string): string {
  const pascal = value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")

  const safePascal = 0 < pascal.length ? pascal : "Logo"
  return /^[A-Za-z]/.test(safePascal) ? safePascal : `Logo${safePascal}`
}

function getComponentName(logoName: string): string {
  const baseName = toPascalCase(logoName)
  return baseName.endsWith("Logo") ? baseName : `${baseName}Logo`
}

function createLogoComponentSource(logoName: string): string {
  const componentName = getComponentName(logoName)

  return [
    'import type { ComponentProps } from "react"',
    "",
    `const src = new URL("./${logoName}.svg", import.meta.url).toString()`,
    "",
    `export type ${componentName}Props = Omit<ComponentProps<"img">, "src">`,
    "",
    `export function ${componentName}(props: ${componentName}Props) {`,
    `  return <img src={src} alt="${logoName}" {...props} />`,
    "}",
    "",
    `export default ${componentName}`,
    "",
  ].join("\n")
}

export async function createLogoComponentInTarget(
  logoName: string,
): Promise<void> {
  const destPath = path.join(getTargetLogosPath(), `${logoName}.tsx`)
  await writeFile(destPath, createLogoComponentSource(logoName), {
    flag: "wx",
  })
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

  if (!dark && !light && !wordmark) {
    return logoNames
  }

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
    if (hasVariantSuffix) {
      return false
    }

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

      if (0 === logoVariants.length) {
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

      if (0 === filteredVariants.length) {
        results.push({
          error: `No variants found for "${logoName}" matching the specified flags`,
          logoName,
          success: false,
        })
        continue
      }

      for (const variant of filteredVariants) {
        try {
          const createdFiles: string[] = []
          const skippedFiles: string[] = []

          if (await logoExistsInTarget(variant)) {
            skippedFiles.push(`${variant}.svg`)
          } else {
            await copyLogoToTarget(variant)
            createdFiles.push(`${variant}.svg`)
          }

          if (await logoComponentExistsInTarget(variant)) {
            skippedFiles.push(`${variant}.tsx`)
          } else {
            await createLogoComponentInTarget(variant)
            createdFiles.push(`${variant}.tsx`)
          }

          const isSkipped = 0 === createdFiles.length

          results.push({
            createdFiles: isSkipped ? undefined : createdFiles,
            logoName: variant,
            reason: isSkipped
              ? "Logo SVG and TSX component already exists in logos directory"
              : undefined,
            skipped: isSkipped,
            skippedFiles: 0 < skippedFiles.length ? skippedFiles : undefined,
            success: true,
          })
        } catch (error) {
          results.push({
            error:
              error instanceof Error ? error.message : "Unknown error occurred",
            logoName: variant,
            success: false,
          })
        }
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

  if (lowerName.includes("_dark")) {
    return "dark"
  }
  if (lowerName.includes("_light")) {
    return "light"
  }
  if (lowerName.includes("_wordmark")) {
    return "wordmark"
  }
  if (lowerName === lowerBase) {
    return "default"
  }

  // Check for other variant patterns
  if (lowerName.includes("_icon")) {
    return "icon"
  }
  if (lowerName.includes("_logo")) {
    return "logo"
  }

  return null
}

// components.json (shadcn) helpers
interface ComponentsJsonAliases {
  ui: string
  [key: string]: unknown
}

interface ComponentsJsonResult {
  aliases: ComponentsJsonAliases
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
        if ("string" === typeof uiAlias && 0 < uiAlias.trim().length) {
          return { aliases: parsed.aliases, filePath: candidate }
        }
      } catch {
        // Invalid JSON, skip
      }

      return null
    }

    const parent = path.dirname(currentDir)
    if (parent === currentDir) {
      break
    }
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

  if (!tsconfigPath) {
    return null
  }

  try {
    const raw = fs.readFileSync(tsconfigPath, "utf-8")
    // Strip single-line and multi-line comments for JSON parsing
    const stripped = raw
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
    const tsconfig = JSON.parse(stripped)
    const paths: { [key: string]: string[] } | undefined =
      tsconfig?.compilerOptions?.paths
    const baseUrl: string = tsconfig?.compilerOptions?.baseUrl ?? "."

    if (paths) {
      for (const [pattern, targets] of Object.entries(paths)) {
        if (!pattern.endsWith("/*") || !targets || 0 === targets.length) {
          continue
        }
        const prefix = pattern.slice(0, -1) // e.g. "@/" from "@/*"
        if (alias.startsWith(prefix)) {
          const target = targets[0]
          if (!target.endsWith("/*")) {
            continue
          }
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
    if (!result) {
      return null
    }

    const componentsJsonDir = path.dirname(result.filePath)
    const resolved = resolveTsconfigAlias(result.aliases.ui, componentsJsonDir)
    if (!resolved) {
      return null
    }

    return path.join(resolved, "logos")
  } catch {
    return null
  }
}
