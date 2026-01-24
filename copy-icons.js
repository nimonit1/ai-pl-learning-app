const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\jun_-\\/.gemini\\/antigravity\\/brain\\/fd860012-297b-4a23-82fd-3ec8343289a7\\/app_icon_base_1769216722266.png';
// Wait, the path from tool was C:/Users/jun_-/.gemini/antigravity/brain/fd860012-297b-4a23-82fd-3ec8343289a7/app_icon_base_1769216722266.png
const srcCorrect = 'C:/Users/jun_-/.gemini/antigravity/brain/fd860012-297b-4a23-82fd-3ec8343289a7/app_icon_base_1769216722266.png';

const dest512 = 'd:\\ws\\App\\ai-pl-learning-app\\public\\icon-512.png';
const dest192 = 'd:\\ws\\App\\ai-pl-learning-app\\public\\icon-192.png';

try {
    fs.copyFileSync(srcCorrect, dest512);
    console.log('Copied to 512');
    fs.copyFileSync(dest512, dest192);
    console.log('Copied to 192');
} catch (err) {
    console.error(err);
    process.exit(1);
}
