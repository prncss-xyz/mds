import { spawn } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { extname } from 'node:path'

import { fileExists, iterateFiles } from '../../files.ts'
import { extensions } from './extensions.ts'
import { fetchMeta } from './meta/index.ts'

export async function scan(
	target: string | string[],
	opts?: {
		force?: boolean
	},
) {
	const targets = Array.isArray(target) ? target : [target]

	for (const t of targets) {
		if (!(await fileExists(t))) {
			console.error(`File or directory not found: ${t}`)
			process.exit(1)
		}
	}

	const tasks: Promise<void>[] = []

	const processSource = async (source: string) => {
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
				else reject(new Error(`pandoc exited with code ${code}`))
			})
		})
	}

	await iterateFiles(targets, async (source) => {
		tasks.push(
			processSource(source).catch((e) => console.error(`pandoc error: ${e}`)),
		)
	})

	await Promise.all(tasks)

	const results = await Promise.allSettled(tasks)
	const failed = results.some((r) => r.status === 'rejected')

	process.exit(failed ? 1 : 0)
}
