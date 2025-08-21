import {z} from 'zod'

/**
 * Schema for validating logo names
 * Logo names must be alphanumeric and may contain hyphens or underscores
 */
export const logoNameSchema = z
  .string()
  .min(1, 'Logo name cannot be empty')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Logo name must contain only alphanumeric characters, hyphens, or underscores')

export function parseLogoName(logoName: string) {
  return logoNameSchema.safeParse(logoName)
}

export function validateLogoNames(logoNames: string[]) {
  const validNames: string[] = []
  const errors: Array<{error: string; name: string}> = []

  for (const name of logoNames) {
    const result = parseLogoName(name)
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
