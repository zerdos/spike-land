/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { test, expect, type Page } from '@playwright/test';
import type { PackagerKind } from './playwright.config';

const URLS: Record<PackagerKind, string> = {
	amd: '/test/smoke/amd/index.html',
	webpack: '/test/smoke/webpack/index.html',
	esbuild: '/test/smoke/esbuild/index.html',
	vite: '/test/smoke/vite/dist/index.html',
	parcel: '/test/smoke/parcel/dist/index.html'
};

test.describe('Monaco Editor Smoke Tests', () => {
	test.beforeEach(async ({ page }, testInfo) => {
		const packager = testInfo.project.metadata.packager as PackagerKind;
		const url = URLS[packager];
		const response = await page.goto(url);
		expect(response?.status()).toBe(200);
	});

	test('`monacoAPI` is exposed as global', async ({ page }) => {
		const monacoType = await page.evaluate(() => typeof (window as any).monacoAPI);
		expect(monacoType).toBe('object');
	});

	test('should be able to create plaintext editor', async ({ page }) => {
		await createEditor(page, 'hello world', 'plaintext');

		// type a link in it
		await setEditorPosition(page, 1, 12);
		await triggerEditorCommand(page, 'type', { text: '\nhttps://www.microsoft.com' });

		// check that the link gets highlighted, which indicates that the web worker is healthy
		await page.waitForSelector('.detected-link');
	});

	test('css smoke test', async ({ page }) => {
		await createEditor(page, '.sel1 { background: red; }\n.sel2 {}', 'css');

		// check that a squiggle appears, which indicates that the language service is up and running
		await page.waitForSelector('.squiggly-warning');
	});

	test('html smoke test', async ({ page }) => {
		await createEditor(page, '<title>hi</title>', 'html');

		// trigger hover
		await focusEditor(page);
		await setEditorPosition(page, 1, 3);
		await page.keyboard.press('F1');
		await page.keyboard.type('Show Hover');
		await page.keyboard.press('Enter');

		// check that a hover explaining the `<title>` element appears, which indicates that the language service is up and running
		// Use a longer timeout to allow the web worker to start up
		await page.waitForSelector(
			`text=The title element represents the document's title or name`,
			{ timeout: 15000 }
		);
	});

	test('json smoke test', async ({ page }) => {
		await createEditor(page, '{}', 'json');

		// trigger suggestions
		await focusEditor(page);
		await setEditorPosition(page, 1, 2);
		await triggerEditorCommand(page, 'editor.action.triggerSuggest');

		// check that a suggestion item for `$schema` appears, which indicates that the language service is up and running
		// Use a longer timeout to allow the web worker to start up
		await page.waitForSelector(`text=$schema`, { timeout: 15000 });
	});

	test('typescript smoke test', async ({ page }) => {
		await createEditor(page, 'window.add', 'typescript');

		// check that a squiggle appears, which indicates that the language service is up and running
		await page.waitForSelector('.squiggly-error');

		// at this point we know that the web worker is healthy, so we can trigger suggestions

		// trigger suggestions
		await focusEditor(page);
		await setEditorPosition(page, 1, 11);
		await triggerEditorCommand(page, 'editor.action.triggerSuggest');

		// check that a suggestion item for `addEventListener` appears, which indicates that the language service is up and running
		await page.waitForSelector(`text=addEventListener`);

		// find the TypeScript worker — poll until a worker exposes the `ts` global (up to 10s)
		await page
			.waitForFunction(
				async () => {
					for (const worker of (window as any).__playwright_workers__ ?? []) {
						try {
							if (
								typeof (await worker.evaluate(() => (globalThis as any).ts)) !==
								'undefined'
							) {
								return true;
							}
						} catch {
							// worker not ready yet
						}
					}
					return false;
				},
				{ timeout: 10000 }
			)
			.catch(() => {
				// waitForFunction may not have access to workers; fall through to direct enumeration below
			});

		// Enumerate workers to find the TypeScript worker
		const workers = page.workers();
		const tsWorker = await findAsync(workers, async (worker) => {
			try {
				return await worker.evaluate(() => typeof (globalThis as any).ts !== 'undefined');
			} catch {
				return false;
			}
		});

		if (!tsWorker) {
			throw new Error('Could not find TypeScript worker');
		}

		// check that the TypeScript worker exposes the full `ts` as a global
		const tsType = await tsWorker.evaluate(
			() => typeof (globalThis as any).ts.optionDeclarations
		);
		expect(tsType).toBe('object');
	});
});

// Helper functions

async function createEditor(page: Page, text: string, language: string): Promise<void> {
	await page.evaluate(
		({ text, language }) => {
			(window as any).ed = (window as any).monacoAPI.editor.create(
				document.getElementById('editor-container'),
				{ value: text, language: language }
			);
		},
		{ text, language }
	);
}

async function setEditorPosition(page: Page, lineNumber: number, column: number): Promise<void> {
	await page.evaluate(
		({ lineNumber, column }) => {
			(window as any).ed.setPosition({ lineNumber, column });
		},
		{ lineNumber, column }
	);
}

async function triggerEditorCommand(page: Page, commandId: string, args?: any): Promise<void> {
	await page.evaluate(
		({ commandId, args }) => {
			(window as any).ed.trigger(null, commandId, args);
		},
		{ commandId, args }
	);
}

async function focusEditor(page: Page): Promise<void> {
	await page.evaluate(() => {
		(window as any).ed.focus();
	});
}

async function findAsync<T>(arr: T[], fn: (item: T) => Promise<boolean>): Promise<T | undefined> {
	const results = await Promise.all(arr.map(fn));
	return arr.find((_, i) => results[i]);
}
