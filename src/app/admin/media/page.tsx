// src/app/admin/media/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { MediaManagementClient } from "@/components/admin/MediaManagementClient";

export default async function MediaManagementPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (user?.role !== 'admin') {
    redirect('/');
  }

  return (
    <AdminLayout>
      <MediaManagementClient />
    </AdminLayout>
  );
}
