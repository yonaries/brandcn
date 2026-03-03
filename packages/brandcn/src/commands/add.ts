import { log, outro } from "@clack/prompts"
import { parseArgs } from "node:util"

import type {
  LogoOperationResult,
  ProcessLogosOptions,
} from "../types/logos.js"

import { processLogos } from "../utils/fs.js"
import { LogoSpinner, displayError, displayUsage } from "../utils/log.js"
import { color } from "../utils/style.js"
import { validateLogoNames } from "../utils/validate.js"

const addOptions = {
  dark: {
    short: "d",
    type: "boolean",
  },
  help: {
    short: "h",
    type: "boolean",
  },
  light: {
    short: "l",
    type: "boolean",
  },
  wordmark: {
    short: "w",
    type: "boolean",
  },
} as const

export const addCommand = {
  description: "Add brand logos to your project",
  examples: [
    "$ brandcn add vercel",
    "$ brandcn add vercel neon react",
    "$ brandcn add vercel --dark --light",
    "$ brandcn add github --wordmark",
    "$ bunx brandcn@latest add nextjs tailwindcss",
  ],
  flags: {
    dark: {
      char: "d",
      description: "Add only dark variant of the logo",
    },
    help: {
      char: "h",
      description: "Show help for the add command",
    },
    light: {
      char: "l",
      description: "Add only light variant of the logo",
    },
    wordmark: {
      char: "w",
      description: "Add only wordmark variant of the logo",
    },
  },
  name: "add",
  usage: "brandcn add <logo-name> [logo-names...] [options]",
} as const

export interface AddParsedArgs {
  flags: ProcessLogosOptions
  help: boolean
  logoNames: string[]
}

export const parseAddArgs = (args: string[]): AddParsedArgs => {
  const parsed = parseArgs({
    allowPositionals: true,
    args,
    options: addOptions,
    strict: true,
  })

  return {
    flags: {
      dark: Boolean(parsed.values.dark),
      light: Boolean(parsed.values.light),
      wordmark: Boolean(parsed.values.wordmark),
    },
    help: Boolean(parsed.values.help),
    logoNames: parsed.positionals,
  }
}

const displayResults = (results: LogoOperationResult[]): void => {
  log.message("")

  const successful = results.filter(
    (result) => result.success && !result.skipped,
  )
  const skipped = results.filter((result) => result.success && result.skipped)
  const failed = results.filter((result) => !result.success)

  if (0 < successful.length) {
    log.success(color.success("Added logos"))
    for (const result of successful) {
      const files =
        result.createdFiles?.join(", ") ??
        `${result.logoName}.svg, ${result.logoName}.tsx`
      log.step(`${color.success("added")} ${files}`)
    }
  }

  if (0 < skipped.length) {
    log.info(color.warning("Skipped (already exists)"))
    for (const result of skipped) {
      const files =
        result.skippedFiles?.join(", ") ??
        `${result.logoName}.svg, ${result.logoName}.tsx`
      log.step(`${color.warning("skipped")} ${files}`)
    }
  }

  if (0 < failed.length) {
    log.error(color.error("Failed"))
    for (const result of failed) {
      log.step(`${color.error("error")} ${result.logoName}: ${result.error}`)
    }
  }
}

export const runAddCommand = async (
  logoNames: string[],
  flags: ProcessLogosOptions,
): Promise<number> => {
  if (0 === logoNames.length) {
    displayError("No logo names provided")
    displayUsage()
    return 1
  }

  const validation = validateLogoNames(logoNames)

  if (validation.hasErrors) {
    displayError("Invalid logo names:")
    for (const error of validation.errors) {
      log.step(`${error.name}: ${error.error}`)
    }

    displayUsage()
    return 1
  }

  if (0 === validation.validNames.length) {
    displayError("No valid logo names provided")
    displayUsage()
    return 1
  }

  const spinner = new LogoSpinner(
    `Processing ${validation.validNames.length} logo(s)...`,
  )
  spinner.start()

  try {
    const results = await processLogos(validation.validNames, flags)

    spinner.stop()
    displayResults(results)

    const hasFailures = results.some((result) => !result.success)
    const hasSuccesses = results.some((result) => result.success)
    const successfulCount = results.filter(
      (result) => result.success && !result.skipped,
    ).length
    const skippedCount = results.filter(
      (result) => result.success && result.skipped,
    ).length

    if (hasFailures && !hasSuccesses) {
      outro(
        color.error("All operations failed. Please check the errors above."),
      )
      return 1
    }

    if (hasFailures && hasSuccesses) {
      const skippedMessage = 0 < skippedCount ? `, ${skippedCount} skipped` : ""
      outro(
        color.warning(
          `Completed with warnings. ${successfulCount} logos added${skippedMessage}.`,
        ),
      )
      return 0
    }

    if (0 < successfulCount) {
      const logoSuffix = 1 === successfulCount ? "" : "s"
      const skippedMessage =
        0 < skippedCount ? ` (${skippedCount} already existed)` : ""
      outro(
        color.success(
          `Successfully added ${successfulCount} logo${logoSuffix}${skippedMessage}.`,
        ),
      )
      return 0
    }

    outro(color.info("All logos were already present in your project."))
    return 0
  } catch (error) {
    spinner.fail("Operation failed")

    if (error instanceof Error) {
      outro(color.error(error.message))
      return 1
    }

    outro(color.error("An unexpected error occurred"))
    return 1
  }
}
