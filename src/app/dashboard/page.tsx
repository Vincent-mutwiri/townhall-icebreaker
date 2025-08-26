// src/app/dashboard/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import connectToDatabase from '@/lib/database';
import { User } from '@/models/User';
import { Badge } from '@/models/Badge';
import { EnhancedDashboard } from '@/components/dashboard/EnhancedDashboard';

async function getUserData(userId: string) {
  await connectToDatabase();

  // Fetch user with populated badges
  const user = await User.findById(userId).populate('badges');

  if (!user) {
    throw new Error('User not found');
  }

  return JSON.parse(JSON.stringify(user));
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const userData = await getUserData(userId);

  return <EnhancedDashboard userData={userData} session={session} />;
}
