// src/app/admin/users/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/database";
import { User } from "@/models/User";
import { UserManagement } from "@/components/admin/UserManagement";
import { AdminLayout } from "@/components/layouts/AdminLayout";

async function getUsers() {
  await connectToDatabase();
  const users = await User.find({})
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(100);
  return JSON.parse(JSON.stringify(users));
}

async function getUserStats() {
  await connectToDatabase();
  
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ 
    updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
  });
  const adminUsers = await User.countDocuments({ role: 'admin' });
  const teacherUsers = await User.countDocuments({ role: 'teacher' });
  
  return {
    total: totalUsers,
    active: activeUsers,
    admins: adminUsers,
    teachers: teacherUsers,
    students: totalUsers - adminUsers - teacherUsers
  };
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/dashboard');
  }

  const users = await getUsers();
  const stats = await getUserStats();

  return (
    <AdminLayout>
      <UserManagement users={users} stats={stats} />
    </AdminLayout>
  );
}
