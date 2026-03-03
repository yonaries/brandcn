#!/usr/bin/env -S node --loader ts-node/esm --disable-warning=ExperimentalWarning

process.env.NODE_ENV = "development"

import { runCli } from "../src/cli.ts"

const exitCode = await runCli(process.argv.slice(2))
process.exitCode = exitCode
