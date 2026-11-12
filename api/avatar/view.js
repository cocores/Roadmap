import { get } from '@vercel/blob'

// Node.js runtime (the default) — @vercel/blob can't run on the Edge runtime.

// ⚠️ Authenticate the request before serving the blob — this app has no
// auth system yet, so any pathname passed here is currently readable by
// anyone who knows (or guesses) it.
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const pathname = searchParams.get('pathname')

  if (!pathname) {
    return Response.json({ error: 'Missing pathname' }, { status: 400 })
  }

  let result
  try {
    result = await get(pathname, { access: 'private' })
  } catch (err) {
    return Response.json({ error: err.message || 'Could not load avatar' }, { status: 500 })
  }
  if (result?.statusCode !== 200) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
