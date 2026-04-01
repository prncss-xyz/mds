import { spawn } from 'node:child_process'
import { extname } from 'node:path'

import { fileExists, processFiles } from '../../files.ts'
import { extensions } from './extensions.ts'
import { fetchMeta } from './meta/index.ts'

export async function scan(
	target: string | string[],
	opts?: {
		force?: boolean
	},
) {
	processFiles(target, async (source: string) => {
		const ext = extname(source)
		if (!extensions.includes(ext)) return
		const targetFile = `${source}.s.md`
		if (!opts?.force && (await fileExists(targetFile))) return

		const meta = await fetchMeta(source)
		const metadataArgs = Object.entries(meta).flatMap(([key, value]) => [
			'-M',
			`${key}=${String(value)}`,
		])

		await new Promise<void>((resolve, reject) => {
			const pandoc = spawn('pandoc', [
				source,
				'-t',
				'markdown',
				'-s',
				...metadataArgs,
				'--lua-filter=src/strip-html.lua',
				'-o',
				targetFile,
			])
			pandoc.on('close', (code) => {
				if (code === 0) resolve()
				else {
					console.error(`pandoc error: ${code}`)
					reject(new Error(`pandoc exited with code ${code}`))
				}
			})
		})
	})
}
