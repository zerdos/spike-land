declare module 'loader-utils' {
	export function interpolateName(
		loaderContext: { resourcePath: string },
		name: string,
		options?: { content?: string | Buffer; context?: string }
	): string;

	export function stringifyRequest(
		loaderContext: { context?: string | null },
		resource: string
	): string;
}
