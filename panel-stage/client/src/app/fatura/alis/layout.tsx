'use client';

import { usePathname } from 'next/navigation';

export default function AlisFaturaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isPrintPage = pathname?.includes('/print');

    if (isPrintPage) {
        return <>{children}</>;
    }

    return <>{children}</>;
}
