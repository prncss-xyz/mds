import { access, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

async function iterateDir(
	dir: string,
	onFile: (file: string) => Promise<void> | void,
): Promise<void> {
	const entries = await readdir(dir, { withFileTypes: true })
	for (const entry of entries) {
		if (entry.name.startsWith('.')) continue
		const fullPath = join(dir, entry.name)
		if (entry.isDirectory()) {
			await iterateDir(fullPath, onFile)
			continue
		}
		await onFile(fullPath)
	}
}

export async function processFiles(
	targets: string | string[],
	onFile: (file: string) => Promise<void> | void,
) {
	const tasks: Promise<void>[] = []
	// Collect tasks while iterating
	const wrappedOnFile = async (file: string) => {
		const result = onFile(file)
		if (result instanceof Promise) {
			tasks.push(result)
		}
	}

	const targets0 = Array.isArray(targets) ? targets : [targets]
	for (const target of targets0) {
		const stats = await stat(target)
		if (!(await fileExists(target))) {
			console.error(`File or directory not found: ${target}`)
		}
		if (stats.isDirectory()) {
			await iterateDir(target, wrappedOnFile)
		} else {
			await wrappedOnFile(target)
		}
	}

	const res = await Promise.allSettled(tasks)
	if (res.every((v) => v.status === 'fulfilled')) process.exit(0)
	else process.exit(1)
}

export async function fileExists(source: string) {
	try {
		await access(source)
		return true
	} catch {
		return false
	}
}
