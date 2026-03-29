#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'

import { processHtml } from './process/html.ts'

const [, , ...args] = process.argv

if (args.length === 0) {
	process.exit(0)
}

await Promise.all(
	args.map(async (source) => {
		try {
			await fs.access(source)
		} catch {
			console.error(`File not found: ${source}`)
			return
		}

		const ext = path.extname(source)

		const target = `${source}.s.md`
		switch (ext) {
			case '.html':
				await processHtml(source, target)
				break
			default:
				console.error(`Unsupported format: ${ext}`)
		}
	}),
)
