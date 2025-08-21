import ora, {Ora} from 'ora'

import {LogoOperationResult} from './fs.js'

/**
 * Creates and manages a spinner for operations
 */
export class LogoSpinner {
  private spinner: Ora

  constructor(text: string) {
    this.spinner = ora(text)
  }

  /**
   * Marks the spinner as failed and stops it
   * @param text - Error message
   */
  fail(text?: string): void {
    this.spinner.fail(text)
  }

  /**
   * Marks the spinner as info and stops it
   * @param text - Info message
   */
  info(text?: string): void {
    this.spinner.info(text)
  }

  /**
   * Updates the spinner text
   * @param text - New text to display
   */
  setText(text: string): void {
    this.spinner.text = text
  }

  /**
   * Starts the spinner
   */
  start(): void {
    this.spinner.start()
  }

  /**
   * Stops the spinner without any symbol
   * @param text - Final text
   */
  stop(text?: string): void {
    this.spinner.stop()
    if (text) {
      console.log(text)
    }
  }

  /**
   * Marks the spinner as successful and stops it
   * @param text - Success message
   */
  succeed(text?: string): void {
    this.spinner.succeed(text)
  }

  /**
   * Marks the spinner as warning and stops it
   * @param text - Warning message
   */
  warn(text?: string): void {
    this.spinner.warn(text)
  }
}

/**
 * Displays results of logo operations with appropriate styling
 * @param results - Array of logo operation results
 */
export function displayResults(results: LogoOperationResult[]): void {
  for (const result of results) {
    if (result.success && !result.skipped) {
      console.log(`✅ Added logo: ${result.logoName}.svg`)
    } else if (result.success && result.skipped) {
      console.log(`⏭️  Skipped: ${result.logoName}.svg (${result.reason})`)
    } else {
      console.log(`❌ ${result.error}`)
    }
  }
}

/**
 * Displays a summary of the operation
 * @param results - Array of logo operation results
 */
export function displaySummary(results: LogoOperationResult[]): void {
  const successful = results.filter((r) => r.success && !r.skipped).length
  const skipped = results.filter((r) => r.success && r.skipped).length
  const failed = results.filter((r) => !r.success).length
  const total = results.length

  console.log('')
  console.log('📊 Summary:')
  console.log(`   Total: ${total}`)
  if (successful > 0) console.log(`   ✅ Added: ${successful}`)
  if (skipped > 0) console.log(`   ⏭️  Skipped: ${skipped}`)
  if (failed > 0) console.log(`   ❌ Failed: ${failed}`)
}

/**
 * Displays an error message with consistent formatting
 * @param message - Error message to display
 */
export function displayError(message: string): void {
  console.error(`❌ Error: ${message}`)
}

/**
 * Displays a warning message with consistent formatting
 * @param message - Warning message to display
 */
export function displayWarning(message: string): void {
  console.warn(`⚠️  Warning: ${message}`)
}

/**
 * Displays an info message with consistent formatting
 * @param message - Info message to display
 */
export function displayInfo(message: string): void {
  console.log(`ℹ️  ${message}`)
}

/**
 * Displays usage information for the add command
 */
export function displayUsage(): void {
  console.log('')
  console.log('📖 Usage:')
  console.log('  brandcn add <logo-name> [logo-names...]')
  console.log('')
  console.log('📝 Examples:')
  console.log('  brandcn add vercel')
  console.log('  brandcn add vercel neon react')
  console.log('  bunx brandcn@latest add nextjs tailwindcss')
  console.log('')
  console.log('🔍 Logo names must contain only alphanumeric characters, hyphens, or underscores.')
}
