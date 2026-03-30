import { access, readdir } from 'node:fs/promises'
import { join } from 'node:path'

export async function* iterateDir(dir: string): AsyncGenerator<string> {
	const entries = await readdir(dir, { withFileTypes: true })
	for (const entry of entries) {
		if (entry.name.startsWith('.')) continue
		if (entry.isDirectory()) {
			for await (const file of iterateDir(join(dir, entry.name))) {
				yield file
			}
			continue
		}
		yield join(dir, entry.name)
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
