// src/app/admin/announcements/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { AnnouncementManager } from "@/components/admin/AnnouncementManager";

export default async function AdminAnnouncementsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <AdminLayout>
      <AnnouncementManager />
    </AdminLayout>
  );
}
