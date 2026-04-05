const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const urls = [
    "http://localhost:3033/blog/the-contact-proof/",
    "http://localhost:3033/blog/the-two-boxes/",
    "http://localhost:3033/blog/the-prd-filter-old-chats-are-already-prds/",
    "http://localhost:3033/blog/the-vibe-coding-paradox/",
    "http://localhost:3033/blog/the-predictor-already-moved/",
  ];

  for (const url of urls) {
    console.log(`Checking ${url}...`);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const mediaStatus = await page.evaluate(async () => {
      const elements = Array.from(document.querySelectorAll("video, audio"));
      if (elements.length === 0) return { found: 0 };

      const results = await Promise.all(
        elements.map((el) => {
          return new Promise((resolve) => {
            if (el.readyState >= 1) {
              // HAVE_METADATA
              resolve({ src: el.currentSrc || el.src, ready: true });
            } else {
              el.addEventListener(
                "loadedmetadata",
                () => resolve({ src: el.currentSrc || el.src, ready: true }),
                { once: true },
              );
              el.addEventListener(
                "error",
                () => resolve({ src: el.currentSrc || el.src, ready: false, error: el.error }),
                { once: true },
              );

              // Timeout in case it hangs
              setTimeout(
                () => resolve({ src: el.currentSrc || el.src, ready: false, error: "timeout" }),
                3000,
              );
            }
          });
        }),
      );

      return { found: elements.length, results };
    });

    console.log(`Result for ${url}:`, JSON.stringify(mediaStatus, null, 2));
  }

  await browser.close();
  process.exit(0);
})();
