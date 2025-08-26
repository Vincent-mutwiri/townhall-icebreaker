// src/components/landing/FeaturesSection.tsx
import { BookOpen, Gamepad2, Trophy, MessageSquare, Users, Shield, Zap, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: <BookOpen className="h-8 w-8 text-blue-500" />,
    title: 'Interactive Courses',
    description: 'Master new skills with engaging, self-paced modules designed by education experts and industry professionals.',
    badge: 'Popular',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  {
    icon: <Gamepad2 className="h-8 w-8 text-green-500" />,
    title: 'Live Educational Games',
    description: 'Challenge your knowledge and compete with peers in exciting real-time quizzes and interactive challenges.',
    badge: 'New',
    badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  {
    icon: <Trophy className="h-8 w-8 text-yellow-500" />,
    title: 'Competitive Leaderboards',
    description: 'Earn points, climb the ranks, and gain recognition for your achievements in a fair and balanced system.',
    badge: 'Featured',
    badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-purple-500" />,
    title: 'Community Updates',
    description: 'Connect with fellow learners, share insights, and stay updated with the latest news and discussions.',
    badge: 'Social',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },
  {
    icon: <Users className="h-8 w-8 text-indigo-500" />,
    title: 'Collaborative Learning',
    description: 'Join study groups, participate in team challenges, and learn together with motivated peers worldwide.',
    badge: 'Community',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
  },
  {
    icon: <Shield className="h-8 w-8 text-red-500" />,
    title: 'Safe Environment',
    description: 'Learn in a moderated, secure platform with comprehensive content review and community guidelines.',
    badge: 'Secure',
    badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  },
  {
    icon: <Zap className="h-8 w-8 text-orange-500" />,
    title: 'Instant Feedback',
    description: 'Get immediate results, detailed explanations, and personalized recommendations to accelerate your learning.',
    badge: 'Smart',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  },
  {
    icon: <Target className="h-8 w-8 text-pink-500" />,
    title: 'Goal Tracking',
    description: 'Set learning objectives, track your progress, and celebrate milestones with our comprehensive analytics.',
    badge: 'Analytics',
    badgeColor: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-white dark:bg-slate-900/50 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Excel in Learning
            </span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Our comprehensive platform combines the best of education technology with engaging social features 
            to create an unparalleled learning experience.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="text-center group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
            >
              <CardHeader className="pb-4">
                {/* Badge */}
                <div className="flex justify-center mb-4">
                  <Badge className={`${feature.badgeColor} text-xs font-medium px-2 py-1`}>
                    {feature.badge}
                  </Badge>
                </div>
                
                {/* Icon */}
                <div className="mx-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-4 w-fit group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  {feature.icon}
                </div>
                
                {/* Title */}
                <CardTitle className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Ready to transform your learning experience?
          </p>
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1 rounded-lg">
              <div className="bg-white dark:bg-slate-900 rounded-md px-6 py-2">
                <span className="text-slate-800 dark:text-slate-100 font-medium">
                  Join thousands of successful learners today
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
