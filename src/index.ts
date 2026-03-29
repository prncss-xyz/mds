#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'

import { fetchMeta } from './process/index.ts'

const [, , ...args] = process.argv

if (args.length === 0) {
	console.error('Filepaths expected')
	process.exit(1)
}

let errorCode = 0

await Promise.all(
	args.map(async (source) => {
		try {
			await access(source)
		} catch {
			console.error(`File not found: ${source}`)
			errorCode = 1
			return
		}

		const meta = await fetchMeta(source)

		const target = `${source}.s.md`

		const metadataArgs = Object.entries(meta).flatMap(([key, value]) => [
			'-M',
			`${key}=${String(value)}`,
		])

		try {
			await new Promise((resolve, reject) => {
				const pandoc = spawn('pandoc', [
					source,
					...metadataArgs,
					'-t',
					'markdown',
					'-s',
					'--lua-filter=src/strip-html.lua',
					'-o',
					target,
				])
				pandoc.on('close', (code) => {
					if (code === 0) resolve(0)
					else reject(new Error(`pandoc exited with code ${code}`))
				})
			})
		} catch (e) {
			console.error(`pandoc error: ${e}`)
			errorCode = 1
		}
	}),
)

process.exit(errorCode)
