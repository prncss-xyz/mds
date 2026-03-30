import { spawn } from 'node:child_process'
import { stat } from 'node:fs/promises'

import { fileExists, iterateDir } from '../../files.ts'
import { fetchMeta } from './meta/index.ts'

export async function scan(dir: string) {
	if (!(await fileExists(dir))) {
		console.error(`Directory not found: ${dir}`)
		process.exit(1)
	}

	const stats = await stat(dir)
	if (!stats.isDirectory()) {
		console.error(`${dir} is not a directory`)
		process.exit(1)
	}

	let errorCode = 0

	for await (const source of iterateDir(dir)) {
		const target = `${source}.s.md`
		if (await fileExists(target)) continue

		const meta = await fetchMeta(source)
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
	}

	process.exit(errorCode)
}
