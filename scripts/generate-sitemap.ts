import { writeFileSync, mkdirSync } from 'node:fs'

const base = 'https://moritzbrantner.github.io/next-template'
const routes = [
  '/',
  '/en/',
  '/de/',
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${base}${route === '/' ? '/' : route}</loc>
    <changefreq>weekly</changefreq>
  </url>`,
  )
  .join('\n')}
</urlset>
`

mkdirSync('public', { recursive: true })
writeFileSync('public/sitemap.xml', xml)