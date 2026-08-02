import { Suspense } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Header } from "@/components/header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      {children}
    </AuthGuard>
  );
}
