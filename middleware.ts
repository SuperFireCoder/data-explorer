import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {

  if (request.nextUrl.pathname.startsWith('/home')) {
    return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_UI_LIBRARY_HEADER_ECOCOMMONS_ROOT ?? '/', request.url))
  }
 
  if (request.nextUrl.pathname.startsWith('/workspace')) {
    return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_UI_LIBRARY_HEADER_ECOCOMMONS_WORKSPACE ?? '/', request.url))
  }

  if (request.nextUrl.pathname.startsWith('/analysis-hub')) {
    return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_UI_LIBRARY_HEADER_ECOCOMMONS_ANALYSIS_HUB ?? '/', request.url))
  }

}

export const config = {
  matcher: [
    '/home', 
    '/analysis-hub',
    '/workspace',
    ],
}
