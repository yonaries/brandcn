import { describe, expect, it } from "vitest"

import { addCommand, parseAddArgs } from "../../src/commands/add.js"
import { validateLogoNames } from "../../src/utils/validate.js"

describe("add command", () => {
  describe("metadata", () => {
    it("should have correct description", () => {
      expect(addCommand.description).toBe("Add brand logos to your project")
    })

    it("should have examples", () => {
      expect(addCommand.examples).toBeDefined()
      expect(addCommand.examples.length).toBeGreaterThan(0)
      expect(addCommand.examples).toContain("$ brandcn add vercel")
    })

    it("should have usage", () => {
      expect(addCommand.usage).toBe(
        "brandcn add <logo-name> [logo-names...] [options]",
      )
    })

    it("should expose expected flags", () => {
      expect(addCommand.flags.dark.char).toBe("d")
      expect(addCommand.flags.light.char).toBe("l")
      expect(addCommand.flags.wordmark.char).toBe("w")
      expect(addCommand.flags.help.char).toBe("h")
    })
  })

  describe("argument parsing", () => {
    it("should parse logo names and flags", () => {
      const parsed = parseAddArgs(["vercel", "neon", "--dark", "-w"])

      expect(parsed.logoNames).toEqual(["vercel", "neon"])
      expect(parsed.flags.dark).toBe(true)
      expect(parsed.flags.wordmark).toBe(true)
      expect(parsed.flags.light).toBe(false)
      expect(parsed.help).toBe(false)
    })

    it("should parse --help", () => {
      const parsed = parseAddArgs(["--help"])
      expect(parsed.help).toBe(true)
      expect(parsed.logoNames).toEqual([])
    })

    it("should throw for unknown options", () => {
      expect(() => parseAddArgs(["--unknown"])).toThrow()
    })
  })

  describe("logo name validation integration", () => {
    it("should validate logo names correctly", () => {
      const validNames = ["vercel", "neon", "figma"]
      const result = validateLogoNames(validNames)

      expect(result.validNames).toEqual(validNames)
      expect(result.errors).toHaveLength(0)
      expect(result.hasErrors).toBe(false)
    })

    it("should handle mixed valid and invalid names", () => {
      const mixedNames = ["vercel", "invalid@name", "neon"]
      const result = validateLogoNames(mixedNames)

      expect(result.validNames).toEqual(["vercel", "neon"])
      expect(result.errors).toHaveLength(1)
      expect(result.hasErrors).toBe(true)
      expect(result.errors[0]?.name).toBe("invalid@name")
    })
  })
})
