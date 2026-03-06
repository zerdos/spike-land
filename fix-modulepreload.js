const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'src/spike-app/dist');
const assetsDir = path.join(distDir, 'assets');

function processFile(filePath) {
    if (fs.statSync(filePath).isDirectory()) {
        fs.readdirSync(filePath).forEach(file => processFile(path.join(filePath, file)));
    } else if (filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        const searchString = 'import"https://esm.spike.land/vite@7.3.1/modulepreload-polyfill";';
        if (content.includes(searchString)) {
            content = content.replace(searchString, '');
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed ${filePath}`);
        }
    } else if (filePath.endsWith('.html')) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/<link rel="modulepreload"[^>]+>/g, '');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed ${filePath}`);
    }
}

processFile(distDir);
console.log('Done fixing modulepreload');
