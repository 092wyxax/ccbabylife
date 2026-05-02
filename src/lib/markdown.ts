import { marked } from 'marked'

marked.setOptions({
  breaks: true,
  gfm: true,
})

/**
 * Render markdown to HTML. Trusted source only — admin-authored posts.
 */
export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string
}
