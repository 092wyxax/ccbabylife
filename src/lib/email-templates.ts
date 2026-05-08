/**
 * Branded HTML email templates.
 *
 * Email clients (especially Gmail / Outlook) are hostile to SVG, web fonts,
 * and CSS variables. Templates here use:
 *   - inline styles only (no <style> tag — clients strip it)
 *   - table layouts (Outlook needs them)
 *   - hex colors hard-coded
 *   - system serif font stack as fallback for our display
 *   - the 「初」 stamp drawn as a pure CSS box, no SVG
 *
 * Drop-in usage:
 *   const html = renderBrandedEmail({
 *     preheader: '訂單付款成功',
 *     heading: '謝謝你！',
 *     intro: '我們已收到你的訂單⋯',
 *     ctaLabel: '查看訂單',
 *     ctaUrl: 'https://ccbabylife.com/track/...',
 *   })
 */

const COLORS = {
  cream: '#faf7f2',
  cream100: '#f5f1ea',
  ink: '#2d2a26',
  inkSoft: '#7a756f',
  line: '#e8e4dd',
  accent: '#e8896c',
  seal: '#b85a4a',
  sage: '#9ca893',
  blush: '#e7c4c0',
} as const

const FONT_DISPLAY =
  "'Shippori Mincho','Songti TC','Noto Serif TC',Georgia,serif"
const FONT_BODY =
  "'Noto Sans TC','PingFang TC','Helvetica Neue',Arial,sans-serif"

export type EmailMood = 'success' | 'shipping' | 'gift' | 'general'

interface RenderOpts {
  /** Inbox preview (hidden from body) */
  preheader?: string
  /** Main headline shown big */
  heading: string
  /** Eyebrow above heading (Japanese) */
  eyebrow?: string
  /** Mood selects illustration accent */
  mood?: EmailMood
  /** Plain-text body (multiline). Newlines become <br/> */
  intro: string
  /** Optional key/value details block (e.g. order number, total) */
  details?: Array<{ label: string; value: string }>
  /** Optional CTA */
  ctaLabel?: string
  ctaUrl?: string
  /** Optional second small line below CTA */
  ctaHint?: string
  /** Site URL, used for brand link */
  siteUrl?: string
}

const MOOD_BG: Record<EmailMood, string> = {
  success: COLORS.blush + '40', // 25% opacity hex
  shipping: COLORS.sage + '40',
  gift: COLORS.blush + '50',
  general: COLORS.cream100,
}

const MOOD_EMOJI: Record<EmailMood, string> = {
  success: '🎁',
  shipping: '📦',
  gift: '🎀',
  general: '✦',
}

export function renderBrandedEmail(opts: RenderOpts): string {
  const {
    preheader = '',
    heading,
    eyebrow,
    mood = 'general',
    intro,
    details,
    ctaLabel,
    ctaUrl,
    ctaHint,
    siteUrl = 'https://ccbabylife.com',
  } = opts

  const bodyHtml = intro
    .split('\n')
    .map((line) => `<p style="margin:0 0 12px;">${escapeHtml(line)}</p>`)
    .join('')

  const detailsHtml = details && details.length > 0
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0; border-collapse:collapse;">
${details
  .map(
    (d) => `<tr>
  <td style="padding:8px 0; border-bottom:1px solid ${COLORS.line}; font-family:${FONT_BODY}; font-size:13px; color:${COLORS.inkSoft};">${escapeHtml(d.label)}</td>
  <td style="padding:8px 0; border-bottom:1px solid ${COLORS.line}; font-family:${FONT_BODY}; font-size:13px; color:${COLORS.ink}; text-align:right;">${escapeHtml(d.value)}</td>
</tr>`
  )
  .join('\n')}
</table>`
    : ''

  const ctaHtml = ctaLabel && ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 0;">
<tr>
  <td style="border-radius:6px; background:${COLORS.ink};">
    <a href="${escapeAttr(ctaUrl)}"
       style="display:inline-block; padding:14px 28px; font-family:${FONT_BODY}; font-size:14px; color:${COLORS.cream}; text-decoration:none; letter-spacing:0.15em; border-radius:6px;">
      ${escapeHtml(ctaLabel)}
    </a>
  </td>
</tr>
</table>
${ctaHint ? `<p style="margin:14px 0 0; font-size:12px; color:${COLORS.inkSoft}; text-align:center;">${escapeHtml(ctaHint)}</p>` : ''}`
    : ''

  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0; padding:0; background:${COLORS.cream}; font-family:${FONT_BODY}; color:${COLORS.ink}; -webkit-font-smoothing:antialiased;">
<!-- Preheader (hidden but shown in inbox) -->
<div style="display:none; max-height:0; overflow:hidden;">${escapeHtml(preheader)}</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.cream};">
<tr><td align="center" style="padding:32px 16px;">

  <!-- Branded card -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px; width:100%; background:#ffffff; border:1px solid ${COLORS.line}; border-radius:12px; overflow:hidden;">

    <!-- Header: stamp + wordmark -->
    <tr>
      <td style="padding:32px 32px 0; text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
          <tr>
            <td style="background:${COLORS.seal}; color:${COLORS.cream}; font-family:${FONT_DISPLAY}; font-size:22px; font-weight:500; width:36px; height:36px; text-align:center; line-height:36px; border-radius:3px; transform:rotate(-3deg);">初</td>
            <td style="padding-left:12px; font-family:${FONT_DISPLAY}; font-size:20px; color:${COLORS.ink}; letter-spacing:0.05em;">熙熙初日</td>
          </tr>
        </table>
        <p style="margin:6px 0 0; font-family:${FONT_BODY}; font-size:10px; letter-spacing:0.3em; color:${COLORS.inkSoft};">日系選物店</p>
      </td>
    </tr>

    <!-- Mood illustration zone -->
    <tr>
      <td style="padding:24px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${MOOD_BG[mood]}; border-radius:8px;">
          <tr>
            <td align="center" style="padding:32px 16px; font-family:${FONT_DISPLAY}; font-size:48px; line-height:1;">${MOOD_EMOJI[mood]}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Heading -->
    <tr>
      <td style="padding:28px 32px 0; text-align:center;">
        ${eyebrow ? `<p style="margin:0 0 8px; font-family:${FONT_BODY}; font-size:11px; letter-spacing:0.3em; color:${COLORS.inkSoft};">${escapeHtml(eyebrow)}</p>` : ''}
        <h1 style="margin:0; font-family:${FONT_DISPLAY}; font-size:26px; font-weight:500; color:${COLORS.ink}; letter-spacing:0.02em;">${escapeHtml(heading)}</h1>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:24px 32px 0; font-family:${FONT_BODY}; font-size:14px; line-height:1.75; color:${COLORS.ink};">
        ${bodyHtml}
        ${detailsHtml}
        ${ctaHtml}
      </td>
    </tr>

    <!-- Divider + footer in card -->
    <tr>
      <td style="padding:32px;">
        <p style="margin:0; font-family:${FONT_BODY}; font-size:12px; line-height:1.7; color:${COLORS.inkSoft}; text-align:center;">
          有問題請直接私訊我們的 <a href="${escapeAttr(siteUrl)}" style="color:${COLORS.seal}; text-decoration:none;">LINE 客服</a>，工作時間 24 小時內回覆。
        </p>
      </td>
    </tr>
  </table>

  <!-- Outside-card footer (legal) -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px; width:100%; margin-top:16px;">
    <tr>
      <td align="center" style="padding:8px 16px; font-family:${FONT_BODY}; font-size:11px; color:${COLORS.inkSoft}; line-height:1.7;">
        © 熙熙初日 · 日系選物店 · 統編 60766849<br>
        <a href="${escapeAttr(siteUrl)}/privacy" style="color:${COLORS.inkSoft};">隱私權政策</a>
        　·
        <a href="${escapeAttr(siteUrl)}/terms" style="color:${COLORS.inkSoft};">服務條款</a>
      </td>
    </tr>
  </table>

</td></tr>
</table>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/&/g, '&amp;')
}

/* ─────────── Pre-baked common templates ─────────── */

export function orderConfirmationEmail(opts: {
  customerName: string
  orderNumber: string
  totalLabel: string
  trackUrl: string
}): string {
  return renderBrandedEmail({
    preheader: `訂單 ${opts.orderNumber} · ${opts.totalLabel}`,
    eyebrow: 'ありがとうございました',
    heading: '謝謝你的訂單',
    mood: 'success',
    intro: `${opts.customerName}，謝謝你！\n我們已經收到你的訂單，我會在 24 小時內確認、開始日本端採買。\n每階段（已下單 → 日本到貨 → 出貨 → 完成）都會即時 LINE 通知你。`,
    details: [
      { label: '訂單編號', value: opts.orderNumber },
      { label: '訂單金額', value: opts.totalLabel },
    ],
    ctaLabel: '查看訂單進度',
    ctaUrl: opts.trackUrl,
    ctaHint: '可隨時來這頁查最新狀態',
  })
}

export function couponGrantedEmail(opts: {
  customerName: string
  couponCode: string
  description: string
  expiresAt?: string
  redeemUrl: string
}): string {
  return renderBrandedEmail({
    preheader: `你收到一張新優惠券：${opts.couponCode}`,
    eyebrow: 'クーポンプレゼント',
    heading: '一張新優惠券送給你',
    mood: 'gift',
    intro: `${opts.customerName}，感謝你支持熙熙初日。\n以下這張優惠券已加入你的會員中心，下次結帳時自動套用。`,
    details: [
      { label: '優惠碼', value: opts.couponCode },
      { label: '優惠內容', value: opts.description },
      ...(opts.expiresAt ? [{ label: '有效期限', value: opts.expiresAt }] : []),
    ],
    ctaLabel: '一鍵套用 · 立即使用',
    ctaUrl: opts.redeemUrl,
  })
}

export function shippingNotificationEmail(opts: {
  customerName: string
  orderNumber: string
  trackingNumber?: string
  shippingProvider?: string
  trackUrl: string
}): string {
  return renderBrandedEmail({
    preheader: `訂單 ${opts.orderNumber} 已出貨`,
    eyebrow: '発送のお知らせ',
    heading: '你的訂單已出貨',
    mood: 'shipping',
    intro: `${opts.customerName}，你的商品已寄出囉！\n${opts.shippingProvider ? `物流公司：${opts.shippingProvider}` : ''}`,
    details: [
      { label: '訂單編號', value: opts.orderNumber },
      ...(opts.trackingNumber
        ? [{ label: '追蹤號碼', value: opts.trackingNumber }]
        : []),
    ],
    ctaLabel: '查看物流進度',
    ctaUrl: opts.trackUrl,
  })
}

export function restockEmail(opts: {
  productName: string
  productUrl: string
}): string {
  return renderBrandedEmail({
    preheader: `${opts.productName} 已重新到貨`,
    eyebrow: '入荷のお知らせ',
    heading: '商品到貨啦 🎉',
    mood: 'gift',
    intro: `好消息！你關注的「${opts.productName}」已經重新到貨。\n本週搶手的話可能很快又會缺，建議盡快下單。`,
    ctaLabel: '立即選購',
    ctaUrl: opts.productUrl,
  })
}
