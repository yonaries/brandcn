export type VariantType = "dark" | "default" | "icon" | "light" | "logo" | "wordmark"

export interface ProcessLogosOptions {
  dark?: boolean
  light?: boolean
  wordmark?: boolean
}

export interface LogoOperationResult {
  createdFiles?: string[]
  error?: string
  logoName: string
  reason?: string
  skipped?: boolean
  skippedFiles?: string[]
  success: boolean
}
