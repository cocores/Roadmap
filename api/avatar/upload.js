import { put } from '@vercel/blob'

export const config = { runtime: 'edge' }

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_EXTENSION = /\.(jpe?g|png|webp)$/i

// NOTE: this endpoint has no auth — anyone who can reach it can upload a
// blob to this project's store. Fine for this prototype; add real auth
// (session check, rate limiting) before relying on it in production.
export default async function handler(request) {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')

  if (!filename) {
    return Response.json({ error: 'Missing filename' }, { status: 400 })
  }
  if (!ALLOWED_EXTENSION.test(filename)) {
    return Response.json({ error: 'Only JPEG, PNG, or WEBP images are allowed' }, { status: 400 })
  }

  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_SIZE) {
    return Response.json({ error: 'File too large (max 5MB)' }, { status: 413 })
  }

  const blob = await put(filename, request.body, {
    access: 'private',
    addRandomSuffix: true,
  })

  return Response.json(blob)
}
