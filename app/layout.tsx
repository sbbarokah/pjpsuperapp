// app/layout.tsx
import type { Metadata } from 'next';
import { StoreProvider } from '@/store/provider'; // Impor provider
import './globals.css'; // Pastikan Tailwind diimpor di sini

export const metadata: Metadata = {
    title: 'Admin Dashboard',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <StoreProvider>{children}</StoreProvider>
            </body>
        </html>
    );
}