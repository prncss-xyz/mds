export async function processHtml(source: string, target: string) {
	console.log(`creating ${target} from ${source}`)
	await new Promise((resolve) => setTimeout(resolve, 0))
}
