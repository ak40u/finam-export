import fs from 'fs'
import path from 'path'

// Vite will handle index.html, we just need to copy preload script
// Copy preload script to dist root for asar packaging
const preloadSrc = path.resolve(process.cwd(), 'src/main/preload.cjs')
const preloadDest = path.resolve(process.cwd(), 'dist/preload.cjs')
if (fs.existsSync(preloadSrc)) {
  fs.copyFileSync(preloadSrc, preloadDest)
  console.log('copied preload.cjs')
}
