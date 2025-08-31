#!/usr/bin/env -S node --loader ts-node/esm --disable-warning=ExperimentalWarning

// Set development environment for realistic network delay simulation
process.env.NODE_ENV = 'development'

import { execute } from '@oclif/core'

await execute({ development: true, dir: import.meta.url })
