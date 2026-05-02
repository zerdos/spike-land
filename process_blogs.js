const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const res = path.resolve(dir, file);
    if (fs.statSync(res).isDirectory()) {
      getFiles(res, files);
    } else {
      if (res.endsWith('.md') || res.endsWith('.mdx')) {
        files.push(res);
      }
    }
  }
  return files;
}

const files = getFiles(path.join(process.cwd(), 'content/blog'));
const API_KEY = process.env.GEMINI_API_KEY;

async function fetchWithRetry(url, options, retries = 5) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.status === 429 || res.status >= 500) {
      console.log(`Rate limited or server error (${res.status}). Retrying...`);
      const delay = Math.pow(2, i) * 2000 + Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay));
      continue;
    }
    return res;
  }
  return fetch(url, options);
}

async function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const prompt = `You are an expert copywriter and editor. Your task is to process the following blog article according to these rules:
1. Identify all negative vibes, criticism, or anything negative. Delete them or turn them into positive praise. This is the main intent.
2. Add at least 3 hooks (Markdown links) to other relevant blogs OUTSIDE of spike.land. Make them relevant and cool, not devastating.
3. Ensure a hero image is included. If missing, provide an image generation prompt in the article and use it as the alt text for screen readers (e.g. \`![image generation prompt here](/images/hero-placeholder.png)\`).
4. If the original article has YAML frontmatter (between \`---\`), you MUST preserve it exactly as is, or update it carefully if needed.

Return ONLY the rewritten file content. Do not include markdown backticks around the whole file unless they are part of the content.

Original Content:
${content}
`;

  try {
    const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: "You are a helpful assistant that strictly follows instructions and outputs only the requested content." }] },
        generationConfig: { temperature: 0.7 }
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      let newContent = data.candidates[0].content.parts[0].text;
      if (newContent.startsWith('```markdown')) {
          newContent = newContent.replace(/^```markdown\n/, '').replace(/\n```$/, '');
      }
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✅ Processed: ${filePath}`);
    } else {
      console.log(`❌ Failed to generate content for: ${filePath}`, JSON.stringify(data));
    }
  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
  }
}

async function run() {
  const queue = [...files];
  const workers = 32; // The 32 background async agents
  let active = 0;

  console.log(`Processing ${queue.length} files with ${workers} async agents...`);

  await new Promise(resolve => {
    function next() {
      if (queue.length === 0 && active === 0) {
        resolve();
        return;
      }
      while (active < workers && queue.length > 0) {
        const file = queue.shift();
        active++;
        processFile(file).then(() => {
          active--;
          next();
        });
      }
    }
    next();
  });
  console.log("All done!");
}

run();
