import * as p from '@clack/prompts'
import { Command, Flags } from '@oclif/core'

import { getAvailableLogos, getVariantType } from '../utils/fs.js'
import { displayError } from '../utils/log.js'

export default class List extends Command {
  static override args = {}
  static override description = 'List all available brand logos'
  static override examples = [
    '$ brandcn list',
    '$ brandcn list --search react',
    '$ brandcn list --variants',
  ]
  static override flags = {
    search: Flags.string({
      char: 's',
      description: 'Search for logos containing the specified text',
    }),
    variants: Flags.boolean({
      char: 'v',
      description: 'Group logos by brand and show variants',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(List)

    try {
      const availableLogos = await getAvailableLogos()

      if (availableLogos.length === 0) {
        displayError('No logos found in library')
        this.exit(1)
      }

      let filteredLogos = availableLogos

      // Apply search filter if provided
      if (flags.search) {
        const searchTerm = flags.search.toLowerCase()
        filteredLogos = availableLogos.filter((logo) => logo.toLowerCase().includes(searchTerm))

        if (filteredLogos.length === 0) {
          p.intro('🔍 brandcn search')
          p.log.warning(`No logos found matching "${flags.search}"`)
          p.outro('Try a different search term or run `brandcn list` to see all available logos.')
          this.exit(0)
        }
      }

      if (flags.variants) {
        this.displayLogosGrouped(filteredLogos, flags.search)
      } else {
        this.displayLogosSimple(filteredLogos, flags.search)
      }
    } catch (error) {
      displayError(
        `Failed to load logos: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
      this.exit(1)
    }
  }

  private displayLogosGrouped(logos: string[], searchTerm?: string): void {
    const title = searchTerm
      ? `🔍 Found ${logos.length} logos matching "${searchTerm}" (grouped by brand)`
      : `📋 Available logos grouped by brand (${logos.length} total)`

    p.intro(title)

    // Group logos by brand (base name without variants)
    const groups = new Map<string, string[]>()

    for (const logo of logos) {
      // Extract base brand name (everything before first underscore)
      const baseName = logo.split('_')[0].split('-')[0]

      if (!groups.has(baseName)) {
        groups.set(baseName, [])
      }

      groups.get(baseName)?.push(logo)
    }

    // Sort groups by base name
    const sortedGroups = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))

    for (const [baseName, variants] of sortedGroups) {
      if (variants.length === 1) {
        console.log(`  📦 ${baseName}`)
      } else {
        console.log(`  📦 ${baseName} (${variants.length} variants)`)

        for (const variant of variants.sort()) {
          const variantType = getVariantType(variant, baseName)

          console.log(`    ├─ ${variant}${variantType ? ` (${variantType})` : ''}`)
        }
      }
    }

    console.log('') // Add spacing
    p.outro('💡 Use `brandcn add <logo-name>` to add a logo or variant to your project')
  }

  private displayLogosSimple(logos: string[], searchTerm?: string): void {
    const title = searchTerm
      ? `🔍 Found ${logos.length} logos matching "${searchTerm}"`
      : `📋 Available logos (${logos.length})`

    p.intro(title)

    // Display in columns for better readability
    const columns = 4
    const rows = Math.ceil(logos.length / columns)

    for (let row = 0; row < rows; row++) {
      const rowLogos = []

      for (let col = 0; col < columns; col++) {
        const index = row + col * rows

        if (index < logos.length) {
          rowLogos.push(logos[index].padEnd(20))
        }
      }

      if (rowLogos.length > 0) {
        console.log(`  ${rowLogos.join('')}`)
      }
    }

    console.log('') // Add spacing
    p.outro('💡 Use `brandcn add <logo-name>` to add a logo to your project')
  }
}
