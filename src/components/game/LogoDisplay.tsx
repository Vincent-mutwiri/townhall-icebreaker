"use client";

import { useLogoSettings } from "@/context/SettingsProvider";

export function LogoDisplay({ className = "h-12 w-auto" }: { className?: string }) {
  const { logoUrl } = useLogoSettings();

  if (!logoUrl) return null;

  return (
    <img 
      src={logoUrl} 
      alt="Logo" 
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}