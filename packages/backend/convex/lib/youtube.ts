/** YouTube links: the craft videos are YouTube tutorials. */

/**
 * The YouTube video id in a watch, short, embed or youtu.be link, or null
 * when the URL is not a YouTube video.
 */
export function youtubeVideoId(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
  const host = parsed.hostname.replace(/^(www\.|m\.)/, '')
  let id: string | null = null
  if (host === 'youtu.be') {
    id = parsed.pathname.slice(1).split('/')[0] ?? null
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (parsed.pathname === '/watch') id = parsed.searchParams.get('v')
    else {
      const match = parsed.pathname.match(/^\/(embed|shorts|live)\/([^/]+)/)
      id = match?.[2] ?? null
    }
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null
}

/** Embed URL without tracking cookies, for an iframe. */
export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`
}
