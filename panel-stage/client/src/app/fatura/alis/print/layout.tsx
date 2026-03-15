'use client';

// Yazdırma sayfaları için menüsüz layout - sadece sayfa içeriğini render eder
export default function FaturaAlisPrintLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
