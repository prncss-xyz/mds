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

export async function iterateFiles(
	targets: string[],
	onFile: (file: string) => Promise<void> | void,
): Promise<void> {
	for (const target of targets) {
		const stats = await stat(target)
		if (stats.isDirectory()) {
			await iterateDir(target, onFile)
		} else {
			await onFile(target)
		}
	}
}
export async function fileExists(source: string) {
	try {
		await access(source)
		return true
	} catch {
		return false
	}
}
