#!/usr/bin/env node

import { scan } from './commands/scan'

const [, , ...args] = process.argv

await scan(args)
