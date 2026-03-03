import * as p from "@clack/prompts"
import ora, { type Ora } from "ora"

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
}

export function displayError(message: string): void {
  p.log.error(message)
}

export function displayUsage(): void {
  console.log("")
  p.log.info("📖 Usage:")
  p.log.step("  brandcn add <logo-name> [logo-names...]")
  console.log("")
  p.log.info("📝 Examples:")
  p.log.step("  brandcn add vercel")
  p.log.step("  brandcn add vercel neon react")
  p.log.step("  bunx brandcn@latest add nextjs tailwindcss")
  console.log("")
  p.log.info(
    "🔍 Logo names must contain only alphanumeric characters, hyphens, or underscores.",
  )
}
