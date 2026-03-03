import { afterEach, describe, expect, it, vi } from "vitest"

import { runCli } from "../src/cli.js"

describe("cli runner", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should return 0 for --help", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined)

    const code = await runCli(["--help"])

    expect(code).toBe(0)
  })

  it("should return 0 for command help", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined)

    const code = await runCli(["help", "add"])

    expect(code).toBe(0)
  })

  it("should return 0 for --version", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined)

    const code = await runCli(["--version"])

    expect(code).toBe(0)
  })

  it("should return 1 for unknown command", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined)

    const code = await runCli(["unknown-command"])

    expect(code).toBe(1)
  })
})
