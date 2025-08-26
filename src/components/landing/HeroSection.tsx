// src/components/landing/HeroSection.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Star, Users, BookOpen, Trophy } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative text-center py-20 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 -z-10" />
      
      {/* Floating elements for visual interest */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20 animate-pulse" />
      <div className="absolute top-40 right-20 w-16 h-16 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20 animate-pulse delay-1000" />
      <div className="absolute bottom-20 left-20 w-12 h-12 bg-green-200 dark:bg-green-800 rounded-full opacity-20 animate-pulse delay-2000" />
      
      <div className="relative z-10">
        {/* Trust indicators */}
        <div className="flex justify-center items-center gap-6 mb-8 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>10,000+ Learners</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>500+ Courses</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span>50,000+ Games Played</span>
          </div>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-6">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Edtech Guardian Hub
          </span>
        </h1>
        
        {/* Subheadline */}
        <p className="mt-6 text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Where learning meets adventure. Engage with interactive courses, compete in educational games, 
          and grow together with a vibrant community of passionate learners.
        </p>

        {/* Social proof */}
        <div className="flex justify-center items-center gap-2 mt-6 mb-8">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
            ))}
          </div>
          <span className="text-slate-600 dark:text-slate-400 ml-2">
            4.9/5 from 2,500+ reviews
          </span>
        </div>

        {/* Call to action buttons */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
          <Button asChild size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <Link href="/register" className="flex items-center gap-2">
              Get Started for Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          
          <Button asChild size="lg" variant="outline" className="text-lg px-8 py-4 border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300">
            <Link href="/login" className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Watch Demo
            </Link>
          </Button>
        </div>

        {/* Additional trust signal */}
        <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
          ✨ No credit card required • ✨ Free forever plan • ✨ Setup in 2 minutes
        </p>
      </div>
    </section>
  );
}
