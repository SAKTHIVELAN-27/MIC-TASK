import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req as any;
  const isLoggedIn = !!session;
  const role = session?.user?.role;
  const path = nextUrl.pathname;

  // Public paths
  const publicPaths = ['/', '/login', '/register', '/check-in', '/events'];
  const isPublic = publicPaths.some((p) => path === p || path.startsWith(p + '/'));

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Role-based route protection
  if (isLoggedIn) {
    const organizerOnly = ['/dashboard', '/scanner', '/analytics', '/ai-insights'];
    const attendeeOnly = ['/my-events'];

    const isOrganizerRoute = organizerOnly.some((p) => path.startsWith(p));
    const isAttendeeRoute = attendeeOnly.some((p) => path.startsWith(p));

    if (isOrganizerRoute && role !== 'ORGANIZER') {
      return NextResponse.redirect(new URL('/my-events', nextUrl));
    }

    if (isAttendeeRoute && role === 'ORGANIZER') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }

    // Redirect logged-in users away from auth pages
    if (path === '/login' || path === '/register') {
      return NextResponse.redirect(new URL(role === 'ORGANIZER' ? '/dashboard' : '/my-events', nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
