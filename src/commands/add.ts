import * as p from '@clack/prompts'
import {Command, Flags} from '@oclif/core'

import {LogoOperationResult, processLogos, setCustomTargetDirectory, targetDirectoryExists} from '../utils/fs.js'
import {displayError, displayUsage, LogoSpinner} from '../utils/log.js'
import {validateLogoNames} from '../utils/validate.js'

export default class Add extends Command {
  static override args = {}
  static override description = 'Add brand logos to your project'
  static override examples = [
    '$ brandcn add vercel',
    '$ brandcn add vercel neon react',
    '$ brandcn add vercel --dark --light',
    '$ brandcn add github --wordmark',
    '$ bunx brandcn@latest add nextjs tailwindcss',
  ]
  static override flags = {
    dark: Flags.boolean({
      char: 'd',
      description: 'Add only dark variant of the logo',
    }),
    light: Flags.boolean({
      char: 'l',
      description: 'Add only light variant of the logo',
    }),
    wordmark: Flags.boolean({
      char: 'w',
      description: 'Add only wordmark variant of the logo',
    }),
  }
  static override strict = false

  public async run(): Promise<void> {
    const {argv, flags} = await this.parse(Add)
    const logoNames = argv as string[]

    // Handle case where no logo names are provided
    if (!logoNames || logoNames.length === 0) {
      displayError('No logo names provided')
      displayUsage()
      this.exit(1)
    }

    // Validate logo names using Zod
    const validation = validateLogoNames(logoNames)

    // Display validation errors if any
    if (validation.hasErrors) {
      displayError('Invalid logo names:')
      for (const error of validation.errors) {
        console.log(`  • ${error.name}: ${error.error}`)
      }

      console.log('')
      displayUsage()
      this.exit(1)
    }

    // If no valid names after validation, exit
    if (validation.validNames.length === 0) {
      displayError('No valid logo names provided')
      displayUsage()
      this.exit(1)
    }

    // Check if target directory exists and prompt for custom directory if needed
    const directoryExists = await targetDirectoryExists()
    if (!directoryExists) {
      p.intro('🎨 brandcn')

      const directory = await p.text({
        message: 'Would you like to specify a custom directory?',
        placeholder: 'components/logos',
      })

      if (p.isCancel(directory)) {
        p.cancel('Operation cancelled.')
        this.exit(0)
      }

      if (directory !== 'components/logos') {
        setCustomTargetDirectory(directory)
      }
    }

    // Start processing with spinner
    const spinner = new LogoSpinner(`Processing ${validation.validNames.length} logo(s)...`)
    spinner.start()

    try {
      // Process all logos
      const results = await processLogos(validation.validNames, flags)

      // Stop spinner
      spinner.stop()

      // Display results using clack's beautiful UI
      this.displayResultsWithClack(results)

      // Determine exit code based on results
      const hasFailures = results.some((r) => !r.success)
      const hasSuccesses = results.some((r) => r.success)
      const successfulCount = results.filter((r) => r.success && !r.skipped).length
      const skippedCount = results.filter((r) => r.success && r.skipped).length

      if (hasFailures && !hasSuccesses) {
        // All operations failed
        p.outro('❌ All operations failed. Please check the errors above.')
        this.exit(1)
      } else if (hasFailures && hasSuccesses) {
        // Some operations failed, but some succeeded
        p.outro(
          `⚠️  Completed with warnings. ${successfulCount} logos added${
            skippedCount > 0 ? `, ${skippedCount} skipped` : ''
          }.`,
        )
      } else {
        // All operations succeeded
        const message =
          successfulCount > 0
            ? `🎉 Successfully added ${successfulCount} logo${successfulCount === 1 ? '' : 's'}${
                skippedCount > 0 ? ` (${skippedCount} already existed)` : ''
              }!`
            : `✨ All logos were already present in your project.`
        p.outro(message)
      }
    } catch (error) {
      spinner.fail('Operation failed')
      p.outro(`❌ ${error instanceof Error ? error.message : 'An unexpected error occurred'}`)
      this.exit(1)
    }
  }

  private displayResultsWithClack(results: LogoOperationResult[]): void {
    console.log('') // Add spacing

    // Group results for better display
    const successful = results.filter((r) => r.success && !r.skipped)
    const skipped = results.filter((r) => r.success && r.skipped)
    const failed = results.filter((r) => !r.success)

    // Display successful additions
    if (successful.length > 0) {
      p.log.success('Added logos:')
      for (const result of successful) {
        p.log.step(`✨ ${result.logoName}.svg`)
      }
    }

    // Display skipped files
    if (skipped.length > 0) {
      p.log.info('Skipped (already exist):')
      for (const result of skipped) {
        p.log.step(`⏭️  ${result.logoName}.svg`)
      }
    }

    // Display failed operations
    if (failed.length > 0) {
      p.log.error('Failed:')
      for (const result of failed) {
        p.log.step(`❌ ${result.logoName}: ${result.error}`)
      }
    }
  }
}
