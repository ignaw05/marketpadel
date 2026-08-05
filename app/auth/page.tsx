import { AuthScreen } from "@/components/screens/auth-screen";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthScreen
      errorInicial={
        error === "link"
          ? "Ese link de confirmación no sirve o ya venció. Ingresá y te mandamos uno nuevo."
          : undefined
      }
    />
  );
}
