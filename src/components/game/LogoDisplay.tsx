"use client";

import Image from "next/image";
import { useLogoSettings } from "@/context/SettingsProvider";

export function LogoDisplay({ className = "h-12 w-auto" }: { className?: string }) {
  const { logoUrl } = useLogoSettings();

  if (!logoUrl) return null;

  return (
    <Image 
      src={logoUrl} 
      alt="Logo" 
      width={48}
      height={48}
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}