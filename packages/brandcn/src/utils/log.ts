import { spinner as createSpinner, log } from "@clack/prompts"

import { color } from "./style.js"

export class LogoSpinner {
  private spinner = createSpinner()
  private text: string

  constructor(text: string) {
    this.text = text
  }

  /**
   * Marks the spinner as failed and stops it
   * @param text - Error message
   */
  fail(text?: string): void {
    this.spinner.stop(text ?? this.text, 1)
  }

  /**
   * Starts the spinner
   */
  start(): void {
    this.spinner.start(this.text)
  }

  /**
   * Stops the spinner without any symbol
   * @param text - Final text
   */
  stop(text?: string): void {
    this.spinner.stop(text ?? this.text)
  }
}

export function displayError(message: string): void {
  log.error(color.error(message))
}

export function displayUsage(): void {
  log.message("")
  log.info(color.info("Usage"))
  log.step("  brandcn add <logo-name> [logo-names...]")
  log.message("")
  log.info(color.info("Examples"))
  log.step("  brandcn add vercel")
  log.step("  brandcn add vercel neon react")
  log.step("  bunx brandcn@latest add nextjs tailwindcss")
  log.message("")
  log.info(
    "Logo names must contain only alphanumeric characters, hyphens, or underscores.",
  )
}
