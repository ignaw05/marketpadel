import { AuthScreen } from "@/components/screens/auth-screen";
import { destinoSeguro } from "@/lib/validar";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <AuthScreen
      errorInicial={
        error === "link"
          ? "Ese link de confirmación no sirve o ya venció. Ingresá y te mandamos uno nuevo."
          : undefined
      }
      next={destinoSeguro(next)}
    />
  );
}
