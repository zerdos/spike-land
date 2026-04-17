#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4321';
const OUT_DIR = resolve(process.cwd(), process.env.OUT_DIR ?? 'screenshots');

const VIEWPORTS = [
  { name: 'iphone-13-mini', width: 375, height: 812 },
  { name: 'ipad',           width: 810, height: 1080 },
  { name: 'desktop',        width: 1440, height: 900 },
  { name: '4k',             width: 3840, height: 2160 },
];

const ROUTES = (process.env.ROUTES ?? '/,/ai,/arena').split(',').map(r => r.trim());
const THEMES = (process.env.THEMES ?? 'light,dark').split(',').map(t => t.trim());

function slugify(path) {
  return path === '/' ? 'index' : path.replace(/^\//, '').replace(/\//g, '-');
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  const results = [];
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.width >= 3840 ? 1 : 2,
        colorScheme: theme === 'dark' ? 'dark' : 'light',
      });
      const page = await ctx.newPage();

      for (const route of ROUTES) {
        const url = new URL(route, BASE_URL).toString();
        const file = join(OUT_DIR, `${slugify(route)}__${vp.name}__${theme}.png`);
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
          if (theme === 'dark') {
            await page.evaluate(() => document.documentElement.classList.add('dark'));
          }
          await page.screenshot({ path: file, fullPage: true });
          results.push({ route, viewport: vp.name, theme, ok: true, file });
          console.log(`  ok  ${vp.name.padEnd(16)} ${theme.padEnd(5)} ${route}`);
        } catch (err) {
          results.push({ route, viewport: vp.name, theme, ok: false, error: String(err) });
          console.log(`  ERR ${vp.name.padEnd(16)} ${theme.padEnd(5)} ${route} — ${err.message}`);
        }
      }
      await ctx.close();
    }
  }

  await browser.close();

  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} screenshots captured → ${OUT_DIR}`);
  if (failed.length) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
