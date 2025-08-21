# brandcn

Add high-quality brand logos to your project instantly — just like adding components with shadcn/ui.

[![npm version](https://img.shields.io/npm/v/brandcn.svg)](https://npmjs.org/package/brandcn)
[![Downloads](https://img.shields.io/npm/dm/brandcn.svg)](https://npmjs.org/package/brandcn)

## Quick Start

```bash
# Use without installing
npx brandcn add vercel nextjs react

pnpm dlx brandcn add vercel nextjs react
```

## Usage

### Add logos to your project

```bash
# Add single logo
brandcn add vercel

# Add multiple logos
brandcn add vercel nextjs tailwindcss

# Add specific variants
brandcn add github --dark
brandcn add stripe --wordmark
```

### Available flags

- `--dark` - Add only dark variant
- `--light` - Add only light variant
- `--wordmark` - Add only wordmark variant

## Examples

```bash
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

The library includes 350+ high-quality SVG logos for popular brands including:

- **Tech**: React, Vue, Angular, NextJS, TailwindCSS
- **Companies**: Google, Apple, Microsoft, Meta, Netflix
- **Services**: GitHub, Vercel, Netlify, AWS, Stripe
- **Tools**: Figma, VSCode, Docker, Kubernetes
- And many more!

## How it works

1. Logos are saved to `components/logos/` by default
2. If the directory doesn't exist, you'll be prompted to choose a custom path
3. Each logo is saved as an optimized SVG file
4. Existing files are automatically skipped

## License

MIT
