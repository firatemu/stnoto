'use client';

import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { usePathname } from 'next/navigation';

export default function ServisLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPrintPage = pathname?.includes('/print');

  if (isPrintPage) {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
}
