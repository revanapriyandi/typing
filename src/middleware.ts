import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const locales = ['en', 'id'];

export default function middleware(request: NextRequest) {
  // Extract country from Vercel header, fallback to 'US' (or let next-intl handle Accept-Language)
  const country = request.headers.get('x-vercel-ip-country') || 'US';
  
  // Custom logic: if Indonesia, ID; else EN
  const defaultLocale = country === 'ID' ? 'id' : 'en';

  // Create a new middleware instance forcing this dynamic default locale
  const i18n = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'always'
  });

  return i18n(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(id|en)/:path*']
};
