#!/usr/bin/env node
import path from 'path'

import { processHtml } from './process/html.ts'

const [, , ...args] = process.argv

if (args.length === 0) {
	process.exit(0)
}

for (const source of args) {
	const ext = path.extname(source)

	const target = `${source}.s.md`
	switch (ext) {
		case '.html':
			processHtml(source, target)
			break
		default:
			console.error(`Unsupported format: ${ext}`)
	}
}
