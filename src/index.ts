#!/usr/bin/env node

import { scan } from './commands/scan/index.ts'

const [, , dir] = process.argv

await scan(dir ?? '.')
