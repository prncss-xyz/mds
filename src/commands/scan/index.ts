import { spawn } from 'node:child_process'
import { stat } from 'node:fs/promises'

import { fileExists, iterateDir } from '../../files.ts'
import { fetchMeta } from './meta/index.ts'

export async function scan(
	dir: string,
	opts?: {
		force?: boolean
	},
) {
	if (!(await fileExists(dir))) {
		console.error(`Directory not found: ${dir}`)
		process.exit(1)
	}

	const stats = await stat(dir)
	if (!stats.isDirectory()) {
		console.error(`${dir} is not a directory`)
		process.exit(1)
	}

	const tasks: Promise<void>[] = []

	const processSource = async (source: string) => {
		const target = `${source}.s.md`
		if (!opts?.force && (await fileExists(target))) return

		const meta = await fetchMeta(source)
		const metadataArgs = Object.entries(meta).flatMap(([key, value]) => [
			'-M',
			`${key}=${String(value)}`,
		])

		await new Promise<void>((resolve, reject) => {
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
				if (code === 0) resolve()
				else reject(new Error(`pandoc exited with code ${code}`))
			})
		})
	}

	await iterateDir(dir, async (source) => {
		tasks.push(
			processSource(source).catch((e) => console.error(`pandoc error: ${e}`)),
		)
	})

	await Promise.all(tasks)

	const results = await Promise.allSettled(tasks)
	const failed = results.some((r) => r.status === 'rejected')

	process.exit(failed ? 1 : 0)
}
