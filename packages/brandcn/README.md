# brandcn

Add high-quality brand logos to your project instantly — just like adding components with shadcn/ui.

[![npm version](https://img.shields.io/npm/v/brandcn.svg)](https://npmjs.org/package/brandcn)
[![Downloads](https://img.shields.io/npm/dm/brandcn.svg)](https://npmjs.org/package/brandcn)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Quick Start

```bash
# Discover available logos
npx brandcn list

#npm
npx brandcn add vercel nextjs react

#pnpm
pnpm dlx brandcn add vercel nextjs react

#bun
bunx brandcn add vercel nextjs react
```

## Usage

### List available logos

```bash
# List all available logos
brandcn list

# Search for specific logos
brandcn list --search react

# Show logos grouped by brand with variants
brandcn list --variants

# Combine search with variants view
brandcn list --search react --variants
```

### Available flags

#### For `brandcn list`:

- `--search` / `-s` - Filter logos by name
- `--variants` / `-v` - Group logos by brand and show variants

#### For `brandcn add`:

- `--dark` / `-d` - Add only dark variant
- `--light` / `-l` - Add only light variant
- `--wordmark` / `-w` - Add only wordmark variant

## Examples

```bash
# Discover available logos
brandcn list

# Find React-related logos
brandcn list --search react

# See all variants for brands
brandcn list --variants

# Basic usage
brandcn add google

# Multiple brands
brandcn add apple microsoft google

# Dark variant only
brandcn add github --dark

# Wordmark version
brandcn add netflix --wordmark

# Use without installing
npx brandcn@latest add react vue angular
```

## Available Logos

The library includes 780+ high-quality SVG logos for popular brands including:

- **Tech**: React, Vue, Angular, NextJS, TailwindCSS
- **Companies**: Google, Apple, Microsoft, Meta, Netflix
- **Services**: GitHub, Vercel, Netlify, AWS, Stripe
- **Tools**: Figma, VSCode, Docker, Kubernetes
- And many more!

Use `brandcn list` to see all available logos, or `brandcn list --search <term>` to find specific brands.

## How it works

1. Logos are saved to `components/logos/` by default
2. If the directory doesn't exist, you'll be prompted to choose a custom path
3. Each logo is saved as an optimized SVG file
4. Existing files are automatically skipped

## Contributing

**Adding new logos:**

- Place SVG files in `library/` directory
- Use lowercase with hyphens for brand naming (e.g., `brand-name.svg`)
- For variants, use suffixes: `_dark`, `_light`, `_wordmark` (e.g., `brand-name_dark.svg`)
- Optimize SVGs and ensure they're high quality
- Create a PR with logo/brand-name

## License

This project is licensed under the [MIT License](LICENSE).
