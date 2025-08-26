'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isLoading 
            ? "opacity-0 transform translate-y-2" 
            : "opacity-100 transform translate-y-0"
        )}
      >
        {displayChildren}
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className, lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-gray-200 rounded animate-pulse",
            i === 0 && "w-3/4",
            i === 1 && "w-full",
            i === 2 && "w-1/2"
          )}
        />
      ))}
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ progress, className, showPercentage = false }: ProgressBarProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

interface StatusIndicatorProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  className?: string;
}

export function StatusIndicator({ status, message, className }: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          icon: (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          )
        };
      case 'success':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'error':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: null
        };
    }
  };

  const config = getStatusConfig();

  if (status === 'idle' && !message) return null;

  return (
    <div className={cn(
      "flex items-center space-x-2 px-3 py-2 rounded-lg",
      config.bgColor,
      className
    )}>
      {config.icon && (
        <span className={config.color}>
          {config.icon}
        </span>
      )}
      {message && (
        <span className={cn("text-sm font-medium", config.color)}>
          {message}
        </span>
      )}
    </div>
  );
}

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, duration = 1000, className }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setDisplayValue(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {displayValue.toLocaleString()}
    </span>
  );
}

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        "transition-all duration-500 ease-out",
        isVisible 
          ? "opacity-100 transform translate-y-0" 
          : "opacity-0 transform translate-y-4",
        className
      )}
    >
      {children}
    </div>
  );
}
