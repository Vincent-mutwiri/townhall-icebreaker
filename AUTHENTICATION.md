# Authentication System

This application uses NextAuth.js with a custom credentials provider for secure authentication.

## Features

- **Secure Password Hashing**: Uses bcryptjs with salt rounds of 10
- **JWT-based Sessions**: Stateless authentication with secure JWT tokens
- **Input Validation**: Client and server-side validation for all auth forms
- **Protected Routes**: Middleware-based route protection
- **Role-based Access**: Support for user and admin roles
- **Session Management**: Persistent sessions with configurable expiration

## Environment Variables

Required environment variables for authentication:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32
MONGODB_URI=your-mongodb-connection-string
```

Generate a secure secret with:
```bash
openssl rand -base64 32
```

## API Endpoints

### Registration
- **POST** `/api/auth/register`
- Creates a new user with hashed password
- Validates email format, password length, and name requirements

### Authentication
- **POST** `/api/auth/signin`
- NextAuth.js handles authentication via credentials provider
- Returns JWT token on successful authentication

### Session Management
- **GET** `/api/auth/session`
- Returns current user session information
- **POST** `/api/auth/signout`
- Invalidates current session

## Usage

### Client-side Authentication

```tsx
import { useAuth } from '@/hooks/useAuth';
import { signIn, signOut } from 'next-auth/react';

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <button onClick={() => signIn()}>Sign In</button>;
  }

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### Server-side Authentication

```tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
```

## Protected Routes

The middleware automatically protects certain routes:

- `/dashboard/*` - Requires authentication
- `/admin/*` - Requires admin role

## User Model

```typescript
interface IUser {
  email: string;
  password: string; // Hashed with bcryptjs
  name: string;
  role: 'user' | 'admin';
  badges: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Security Features

1. **Password Hashing**: All passwords are hashed using bcryptjs with salt rounds of 10
2. **Input Validation**: Email format, password length, and name requirements
3. **CSRF Protection**: Built-in CSRF protection via NextAuth.js
4. **Secure Cookies**: HTTP-only, secure cookies for session management
5. **JWT Security**: Signed JWT tokens with configurable expiration
6. **Role-based Access**: Middleware enforces role-based route protection

## Testing

Test the authentication system:

1. **Registration**: Visit `/register` to create a new account
2. **Login**: Visit `/login` to authenticate
3. **Protected Route**: Visit `/dashboard` to test authentication requirement
4. **Admin Route**: Visit `/admin` to test admin role requirement

## Troubleshooting

### Common Issues

1. **NEXTAUTH_SECRET not set**: Ensure environment variable is configured
2. **MongoDB connection**: Verify MONGODB_URI is correct
3. **CSRF errors**: Ensure requests include proper CSRF tokens
4. **Session not persisting**: Check cookie settings and NEXTAUTH_URL

### Debug Mode

Enable NextAuth.js debug mode:

```env
NEXTAUTH_DEBUG=true
```

This will log detailed authentication information to the console.
