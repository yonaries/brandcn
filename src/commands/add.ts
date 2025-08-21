import {Command, Flags} from '@oclif/core'

import {processLogos} from '../utils/fs.js'
import {displayError, displayInfo, displayResults, displaySummary, displayUsage, LogoSpinner} from '../utils/log.js'
import {validateLogoNamesWithDetails} from '../utils/validate.js'

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
    const validation = validateLogoNamesWithDetails(logoNames)

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

    // Start processing with spinner
    const spinner = new LogoSpinner(`Processing ${validation.validNames.length} logo(s)...`)
    spinner.start()

    try {
      // Process all logos
      const results = await processLogos(validation.validNames, flags)

      // Stop spinner
      spinner.stop()

      // Display results
      console.log('') // Add some spacing
      displayResults(results)

      // Display summary
      displaySummary(results)

      // Determine exit code based on results
      const hasFailures = results.some((r) => !r.success)
      const hasSuccesses = results.some((r) => r.success)

      if (hasFailures && !hasSuccesses) {
        // All operations failed
        this.exit(1)
      } else if (hasFailures && hasSuccesses) {
        // Some operations failed, but some succeeded
        displayInfo('Some operations completed with warnings or errors.')
      } else {
        // All operations succeeded - normal completion, no explicit exit needed
      }
    } catch (error) {
      spinner.fail('Operation failed')
      displayError(error instanceof Error ? error.message : 'An unexpected error occurred')
      this.exit(1)
    }
  }
}
