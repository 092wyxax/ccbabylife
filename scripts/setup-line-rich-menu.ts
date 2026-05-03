import { config } from 'dotenv'
config({ path: '.env.local' })

/**
 * One-time setup: create + activate a 4-button Rich Menu on your LINE OA.
 *
 * Run: pnpm tsx scripts/setup-line-rich-menu.ts
 *
 * Pre-requisite: a 2500x843 PNG/JPG at public/line-rich-menu.png.
 * If you don't have an image yet, the script will create the menu but skip
 * uploading the image — buttons will still work, just no graphic.
 *
 * Layout (2500x843, 4 cells, 625x843 each):
 *   [ 我的訂單 ] [ 月齡推薦 ] [ 選物 ] [ 客服 ]
 */

import fs from 'node:fs/promises'
import path from 'node:path'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nihon-select.tw'
const TOKEN = process.env.LINE_MESSAGING_ACCESS_TOKEN

if (!TOKEN) {
  console.error('LINE_MESSAGING_ACCESS_TOKEN not set in .env.local')
  process.exit(1)
}

const richMenuBody = {
  size: { width: 2500, height: 843 },
  selected: false,
  name: 'nihon-select-main',
  chatBarText: 'メニュー',
  areas: [
    {
      bounds: { x: 0, y: 0, width: 625, height: 843 },
      action: { type: 'uri' as const, label: '我的訂單', uri: `${SITE_URL}/account/orders` },
    },
    {
      bounds: { x: 625, y: 0, width: 625, height: 843 },
      action: { type: 'uri' as const, label: '月齡推薦', uri: `${SITE_URL}/recommend` },
    },
    {
      bounds: { x: 1250, y: 0, width: 625, height: 843 },
      action: { type: 'uri' as const, label: '選物', uri: `${SITE_URL}/shop` },
    },
    {
      bounds: { x: 1875, y: 0, width: 625, height: 843 },
      action: { type: 'message' as const, label: '客服', text: '我想問問題' },
    },
  ],
}

async function main() {
  // Step 1: create the menu definition
  console.log('Creating rich menu...')
  const createRes = await fetch('https://api.line.me/v2/bot/richmenu', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(richMenuBody),
  })
  if (!createRes.ok) {
    console.error('create failed:', createRes.status, await createRes.text())
    process.exit(1)
  }
  const { richMenuId } = (await createRes.json()) as { richMenuId: string }
  console.log(`  rich menu id: ${richMenuId}`)

  // Step 2: upload image (optional — skip if not present)
  const imagePath = path.join(process.cwd(), 'public', 'line-rich-menu.png')
  try {
    const buf = await fs.readFile(imagePath)
    console.log('Uploading image...')
    const uploadRes = await fetch(
      `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'image/png',
        },
        body: buf,
      }
    )
    if (!uploadRes.ok) {
      console.warn('  image upload failed:', await uploadRes.text())
    } else {
      console.log('  image uploaded')
    }
  } catch {
    console.log('  no public/line-rich-menu.png — skipping image upload')
  }

  // Step 3: set as default for all users
  console.log('Setting as default...')
  const defaultRes = await fetch(
    `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
    }
  )
  if (!defaultRes.ok) {
    console.error('  set default failed:', await defaultRes.text())
    process.exit(1)
  }

  console.log('Done. Existing followers will see the menu within minutes.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
