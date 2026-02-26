import { NextResponse } from 'next/server'

const requests = new Map()

export function middleware(req) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const windowMs = 60 * 1000
  const max = 60

  const entry = requests.get(ip) || { count: 0, start: now }
  if (now - entry.start > windowMs) {
    entry.count = 1; entry.start = now
  } else {
    entry.count++
  }
  requests.set(ip, entry)

  if (entry.count > max) {
    return new NextResponse('Too many requests', { status: 429 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/album/:path*']
}
