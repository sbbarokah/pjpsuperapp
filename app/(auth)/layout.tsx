// app/(auth)/layout.tsx
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Layout ini simpel, tanpa sidebar/header admin
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            {children}
        </div>
    );
}