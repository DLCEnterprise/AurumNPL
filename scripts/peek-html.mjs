import { readFileSync } from 'fs'
const file = process.argv[2]
if (!file) { console.error('Usage: node peek-html.mjs <file>'); process.exit(1) }
const html = readFileSync(file, 'utf-8')
const body = html
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<noscript[\s\S]*?<\/noscript>/g, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z]+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim()
console.log(body.substring(0, 2000))
