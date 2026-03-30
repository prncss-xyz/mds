import { access, readdir } from 'node:fs/promises'
import { join } from 'node:path'

async function iterateDir0(
	dir: string,
	onFile: (file: string) => Promise<void> | void,
): Promise<void> {
	const entries = await readdir(dir, { withFileTypes: true })
	for (const entry of entries) {
		if (entry.name.startsWith('.')) continue
		const fullPath = join(dir, entry.name)
		if (entry.isDirectory()) {
			await iterateDir0(fullPath, onFile)
			continue
		}
		await onFile(fullPath)
	}
}

export function iterateDir(
	dir: string,
	onFile: (file: string) => Promise<void> | void,
): Promise<void> {
	return iterateDir0(dir, async (file) => {
		await onFile(file)
	})
}

export async function fileExists(source: string) {
	try {
		await access(source)
		return true
	} catch {
		return false
	}
}
