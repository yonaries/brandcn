import { intro, log, outro } from "@clack/prompts"
import { parseArgs } from "node:util"

import { getAvailableLogos, getVariantType } from "../utils/fs.js"
import { displayError } from "../utils/log.js"
import { color } from "../utils/style.js"

const listOptions = {
  help: {
    short: "h",
    type: "boolean",
  },
  search: {
    short: "s",
    type: "string",
  },
  variants: {
    short: "v",
    type: "boolean",
  },
} as const

export const listCommand = {
  description: "List all available brand logos",
  examples: [
    "$ brandcn list",
    "$ brandcn list --search react",
    "$ brandcn list --variants",
  ],
  flags: {
    help: {
      char: "h",
      description: "Show help for the list command",
    },
    search: {
      char: "s",
      description: "Search for logos containing the specified text",
    },
    variants: {
      char: "v",
      description: "Group logos by brand and show variants",
    },
  },
  name: "list",
  usage: "brandcn list [--search <term>] [--variants]",
} as const

export interface ListCommandFlags {
  search?: string
  variants?: boolean
}

export interface ListParsedArgs {
  flags: ListCommandFlags
  help: boolean
}

export const parseListArgs = (args: string[]): ListParsedArgs => {
  const parsed = parseArgs({
    allowPositionals: true,
    args,
    options: listOptions,
    strict: true,
  })

  if (0 < parsed.positionals.length) {
    throw new TypeError(
      `Unexpected positional arguments: ${parsed.positionals.join(", ")}`,
    )
  }

  return {
    flags: {
      search: parsed.values.search,
      variants: Boolean(parsed.values.variants),
    },
    help: Boolean(parsed.values.help),
  }
}

const displayLogosGrouped = (logos: string[], searchTerm?: string): void => {
  if (searchTerm) {
    intro(
      `${color.info("Found")} ${color.highlight(String(logos.length))} logos matching "${color.highlight(searchTerm)}" (grouped by brand)`,
    )
  } else {
    intro(
      `${color.info("Available logos grouped by brand")} (${color.highlight(String(logos.length))} total)`,
    )
  }

  const groups = new Map<string, string[]>()

  for (const logo of logos) {
    const baseName = logo.split("_")[0]

    if (!groups.has(baseName)) {
      groups.set(baseName, [])
    }

    groups.get(baseName)?.push(logo)
  }

  const sortedGroups = [...groups.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )

  for (const [baseName, variants] of sortedGroups) {
    if (1 === variants.length) {
      log.step(`${color.command(baseName)}`)
      continue
    }

    log.step(
      `${color.command(baseName)} (${color.highlight(String(variants.length))} variants)`,
    )

    for (const variant of variants.sort()) {
      const variantType = getVariantType(variant, baseName)
      const variantLabel = variantType ? `${variant} (${variantType})` : variant
      log.message(`    └─ ${variantLabel}`)
    }
  }

  outro(
    `${color.dim("Tip:")} Use ${color.command("brandcn add <logo-name>")} to add a logo or variant to your project`,
  )
}

const displayLogosSimple = (logos: string[], searchTerm?: string): void => {
  if (searchTerm) {
    intro(
      `${color.info("Found")} ${color.highlight(String(logos.length))} logos matching "${color.highlight(searchTerm)}"`,
    )
  } else {
    intro(
      `${color.info("Available logos")} (${color.highlight(String(logos.length))})`,
    )
  }

  const columns = 4
  const rows = Math.ceil(logos.length / columns)

  for (let row = 0; row < rows; row++) {
    const rowLogos: string[] = []

    for (let col = 0; col < columns; col++) {
      const index = row + col * rows

      if (index < logos.length) {
        rowLogos.push(logos[index].padEnd(20))
      }
    }

    if (0 < rowLogos.length) {
      log.message(rowLogos.join("  "))
    }
  }

  outro(
    `${color.dim("Tip:")} Use ${color.command("brandcn add <logo-name>")} to add a logo to your project`,
  )
}

export const runListCommand = async (
  flags: ListCommandFlags,
): Promise<number> => {
  try {
    const availableLogos = await getAvailableLogos()

    if (0 === availableLogos.length) {
      displayError("No logos found in library")
      return 1
    }

    let filteredLogos = availableLogos

    if (flags.search) {
      const searchTerm = flags.search.toLowerCase()
      filteredLogos = availableLogos.filter((logo) =>
        logo.toLowerCase().includes(searchTerm),
      )

      if (0 === filteredLogos.length) {
        intro(color.info("Search results"))
        log.warning(
          `${color.warning("No logos found matching")} "${color.highlight(flags.search)}"`,
        )
        outro(
          `Try a different search term or run ${color.command("brandcn list")} to see all available logos.`,
        )
        return 0
      }
    }

    if (flags.variants) {
      displayLogosGrouped(filteredLogos, flags.search)
      return 0
    }

    displayLogosSimple(filteredLogos, flags.search)
    return 0
  } catch (error) {
    if (error instanceof Error) {
      displayError(`Failed to load logos: ${error.message}`)
      return 1
    }

    displayError("Failed to load logos: Unknown error")
    return 1
  }
}
