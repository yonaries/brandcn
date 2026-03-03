export type VariantType = "dark" | "default" | "icon" | "light" | "logo" | "wordmark"

export interface ProcessLogosOptions {
  dark?: boolean
  light?: boolean
  wordmark?: boolean
}

export interface LogoOperationResult {
  error?: string
  logoName: string
  reason?: string
  skipped?: boolean
  success: boolean
}
