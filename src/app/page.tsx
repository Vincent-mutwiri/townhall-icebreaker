// src/app/page.tsx
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { AnnouncementsSection } from '@/components/landing/AnnouncementsSection';
import { LandingPageClient } from '@/components/landing/LandingPageClient';

async function getAnnouncements() {
  try {
    // Use the full URL for server-side fetching
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/announcements`, {
      next: { revalidate: 60 }, // Re-fetch every 60 seconds
    });

    if (!res.ok) {
      console.warn('Failed to fetch announcements:', res.status, res.statusText);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("Failed to fetch announcements for landing page:", error);
    return [];
  }
}

export default async function LandingPage() {
  const announcements = await getAnnouncements();

  return (
    <LandingPageClient
      announcements={announcements}
      heroSection={<HeroSection />}
      featuresSection={<FeaturesSection />}
    />
  );
}