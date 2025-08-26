// src/app/updates/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserLayout } from "@/components/layouts/UserLayout";
import { UpdatesClient } from "@/components/updates/UpdatesClient";

export default async function UpdatesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <UserLayout>
      <UpdatesClient />
    </UserLayout>
  );
}
