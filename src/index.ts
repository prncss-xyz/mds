#!/usr/bin/env node

import { scan } from './commands/scan/index.ts'

const [, , ...files] = process.argv

await scan(files.length > 0 ? files : 'sample', { force: true })
