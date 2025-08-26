"use client";

import Image from "next/image";
import { useLogoSettings } from "@/context/SettingsProvider";
import { useState } from "react";

export function LogoDisplay({ className = "h-12 w-auto" }: { className?: string }) {
  const { logoUrl } = useLogoSettings();
  const [imageError, setImageError] = useState(false);

  if (!logoUrl || imageError) return null;

  return (
    <Image 
      src={logoUrl} 
      alt="Logo" 
      width={48}
      height={48}
      className={className}
      onError={() => {
        setImageError(true);
      }}
      unoptimized
    />
  );
}