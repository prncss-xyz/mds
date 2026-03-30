import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import { extname } from 'node:path'

import { processHtml } from './html.ts'

const processors = {
	'.html': processHtml,
}

function hasProcessor(ext: string): ext is keyof typeof processors {
	return ext in processors
}

export async function fetchMeta(
	path: string,
): Promise<Record<string, unknown>> {
	const ext = extname(path)
	const stats = await fs.stat(path)
	const checksum = await fetchChecksum(path)
	const meta = hasProcessor(ext) ? await processors[ext](path) : {}
	return {
		checksum,
		mtime: stats.mtimeMs,
		path,
		...meta,
	}
}

function fetchChecksum(filePath: string) {
	return new Promise((resolve, reject) => {
		const hash = createHash('md5')
		const stream = createReadStream(filePath)
		stream.on('error', (err) => {
			reject(err)
		})
		stream.on('data', (chunk) => {
			hash.update(chunk)
		})
		stream.on('end', () => {
			const checksum = hash.digest('base64')
			resolve(checksum)
		})
	})
}
