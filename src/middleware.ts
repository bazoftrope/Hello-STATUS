import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register');
  const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth');
  const isPublicApi = request.nextUrl.pathname.startsWith('/api/register');
  const isApi = request.nextUrl.pathname.startsWith('/api');

  if (isApiAuth || isPublicApi) {
    return NextResponse.next();
  }

  if (isApi) {
    if (token) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }

  if (isAuthPage) {
    if (token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');

  if (isAdminPage && token.role !== 'manager') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|logo.svg).*)',
  ],
};
