export type VariantType = 'dark' | 'light' | 'wordmark'

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


