// src/middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is authenticated for protected routes
        const { pathname } = req.nextUrl;
        
        // Protect admin routes - require admin role
        if (pathname.startsWith('/admin')) {
          return token?.role === 'admin';
        }
        
        // Protect dashboard routes - require any authenticated user
        if (pathname.startsWith('/dashboard')) {
          return !!token;
        }
        
        // Allow all other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*'
  ]
};
