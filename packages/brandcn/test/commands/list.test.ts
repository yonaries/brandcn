import { describe, expect, it } from "vitest"

import { listCommand, parseListArgs } from "../../src/commands/list.js"
import { getVariantType } from "../../src/utils/fs.js"

describe("list command", () => {
  describe("metadata", () => {
    it("should have correct description", () => {
      expect(listCommand.description).toBe("List all available brand logos")
    })

    it("should have examples", () => {
      expect(listCommand.examples).toBeDefined()
      expect(listCommand.examples.length).toBeGreaterThan(0)
      expect(listCommand.examples).toContain("$ brandcn list")
      expect(listCommand.examples).toContain("$ brandcn list --search react")
      expect(listCommand.examples).toContain("$ brandcn list --variants")
    })

    it("should have usage", () => {
      expect(listCommand.usage).toBe(
        "brandcn list [--search <term>] [--variants]",
      )
    })

    it("should expose expected flags", () => {
      expect(listCommand.flags.search.char).toBe("s")
      expect(listCommand.flags.variants.char).toBe("v")
      expect(listCommand.flags.help.char).toBe("h")
    })
  })

  describe("argument parsing", () => {
    it("should parse --search and --variants", () => {
      const parsed = parseListArgs(["--search", "react", "-v"])

      expect(parsed.flags.search).toBe("react")
      expect(parsed.flags.variants).toBe(true)
      expect(parsed.help).toBe(false)
    })

    it("should parse --help", () => {
      const parsed = parseListArgs(["--help"])
      expect(parsed.help).toBe(true)
    })

    it("should throw for positional arguments", () => {
      expect(() => parseListArgs(["unexpected"])).toThrow()
    })
  })

  describe("variant type detection", () => {
    it("should detect dark variant", () => {
      expect(getVariantType("react_dark", "react")).toBe("dark")
    })

    it("should detect light variant", () => {
      expect(getVariantType("react_light", "react")).toBe("light")
    })

    it("should detect wordmark variant", () => {
      expect(getVariantType("react_wordmark", "react")).toBe("wordmark")
    })

    it("should detect icon variant", () => {
      expect(getVariantType("react_icon", "react")).toBe("icon")
    })

    it("should detect default variant", () => {
      expect(getVariantType("react", "react")).toBe("default")
    })

    it("should return null for unknown variant", () => {
      expect(getVariantType("react_unknown", "react")).toBe(null)
    })
  })
})
