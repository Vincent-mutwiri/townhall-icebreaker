// src/components/landing/LandingPageClient.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { Header } from '@/components/layout/Header';
import { AnnouncementsSection } from '@/components/landing/AnnouncementsSection';
import { ReactNode } from 'react';

interface AnnouncementPost {
  _id: string;
  title: string;
  content: string;
  coverImage?: string;
  status: string;
  createdAt: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  formattedDate: string;
}

interface LandingPageClientProps {
  announcements: AnnouncementPost[];
  heroSection: ReactNode;
  featuresSection: ReactNode;
}

export function LandingPageClient({ announcements, heroSection, featuresSection }: LandingPageClientProps) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header />
        <main>
          <div className="container mx-auto px-4">
            {heroSection}
          </div>
          {featuresSection}
          <div className="container mx-auto px-4">
            <AnnouncementsSection posts={announcements} />
          </div>
          
          {/* Final Call To Action Section */}
          <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Start Your Learning Journey?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of learners who are already transforming their skills and achieving their goals.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
                <a
                  href="/register"
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-300 shadow-lg hover:shadow-xl"
                >
                  Get Started for Free
                </a>
                <a
                  href="/login"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-300"
                >
                  Sign In
                </a>
              </div>
            </div>
          </section>
        </main>
        
        {/* Footer */}
        <footer className="bg-slate-900 text-slate-300 py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-white font-semibold mb-4">Edtech Guardian Hub</h3>
                <p className="text-sm">
                  Empowering learners worldwide with interactive courses, engaging games, and a supportive community.
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Platform</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/courses" className="hover:text-white transition-colors">Courses</a></li>
                  <li><a href="/games" className="hover:text-white transition-colors">Games</a></li>
                  <li><a href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</a></li>
                  <li><a href="/updates" className="hover:text-white transition-colors">Community</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Community Guidelines</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Connect</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Newsletter</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm">
              <p>&copy; 2024 Edtech Guardian Hub. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </SessionProvider>
  );
}
