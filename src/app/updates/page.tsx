// src/app/updates/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { UpdatesClient } from "@/components/updates/UpdatesClient";

export default async function UpdatesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return <UpdatesClient />;
}
