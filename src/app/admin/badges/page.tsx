// src/app/admin/badges/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/database";
import { Badge } from "@/models/Badge";
import { BadgeManagement } from "@/components/admin/BadgeManagement";

async function getBadges() {
  await connectToDatabase();
  const badges = await Badge.find({}).sort({ category: 1, order: 1 });
  return JSON.parse(JSON.stringify(badges));
}

export default async function AdminBadgesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/dashboard');
  }

  const badges = await getBadges();

  return <BadgeManagement badges={badges} />;
}
