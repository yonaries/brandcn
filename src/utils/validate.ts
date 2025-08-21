import {z} from 'zod'

/**
 * Schema for validating logo names
 * Logo names must be alphanumeric and may contain hyphens or underscores
 */
export const logoNameSchema = z
  .string()
  .min(1, 'Logo name cannot be empty')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Logo name must contain only alphanumeric characters, hyphens, or underscores')

/**
 * Schema for validating an array of logo names
 */
export const logoNamesSchema = z.array(logoNameSchema).min(1, 'At least one logo name must be provided')

/**
 * Validates a single logo name
 * @param logoName - The logo name to validate
 * @returns Validation result with success/error information
 */
export function validateLogoName(logoName: string) {
  return logoNameSchema.safeParse(logoName)
}

/**
 * Validates multiple logo names
 * @param logoNames - Array of logo names to validate
 * @returns Validation result with success/error information
 */
export function validateLogoNames(logoNames: string[]) {
  return logoNamesSchema.safeParse(logoNames)
}

/**
 * Validates logo names and returns detailed error information
 * @param logoNames - Array of logo names to validate
 * @returns Object with valid names and validation errors
 */
export function validateLogoNamesWithDetails(logoNames: string[]) {
  const validNames: string[] = []
  const errors: Array<{error: string; name: string;}> = []

  for (const name of logoNames) {
    const result = validateLogoName(name)
    if (result.success) {
      validNames.push(result.data)
    } else {
      errors.push({
        error: result.error.issues[0]?.message || 'Invalid logo name',
        name,
      })
    }
  }

  return {
    errors,
    hasErrors: errors.length > 0,
    validNames,
  }
}
