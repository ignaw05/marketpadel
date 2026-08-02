import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { AuthScreen } from "./components/auth-screen";
import { Header } from "./components/header";
import { HomeScreen } from "./components/home-screen";
import { DetailModal } from "./components/detail-modal";
import { PublishScreen } from "./components/publish-screen";
import { MyListings } from "./components/my-listings";
import { PALETAS, Paleta } from "./data";

type Vista = "home" | "publicar" | "mis";

export default function App() {
  const [autenticado, setAutenticado] = useState(false);
  const [vista, setVista] = useState<Vista>("home");
  const [query, setQuery] = useState("");
  const [seleccionada, setSeleccionada] = useState<Paleta | null>(null);
  const [loading, setLoading] = useState(true);

  // Carga simulada del grid al entrar
  useEffect(() => {
    if (autenticado) {
      setLoading(true);
      const t = setTimeout(() => setLoading(false), 700);
      return () => clearTimeout(t);
    }
  }, [autenticado]);

  if (!autenticado) {
    return <AuthScreen onEnter={() => setAutenticado(true)} />;
  }

  return (
    <div className="min-h-screen" style={{ background: "#FAFAF8", color: "#14171A" }}>
      <Header
        query={query}
        onQuery={setQuery}
        vista={vista}
        onNav={(v) => {
          setVista(v);
          window.scrollTo({ top: 0 });
        }}
      />

      {vista === "home" && (
        <HomeScreen paletas={PALETAS} query={query} loading={loading} onOpen={setSeleccionada} />
      )}

      {vista === "publicar" && (
        <PublishScreen
          onPublish={() => {
            toast.success("¡Paleta publicada! Ya está visible para todos.");
            setVista("mis");
            window.scrollTo({ top: 0 });
          }}
        />
      )}

      {vista === "mis" && <MyListings onPublicar={() => setVista("publicar")} />}

      <DetailModal paleta={seleccionada} onClose={() => setSeleccionada(null)} />

      <Toaster position="top-center" toastOptions={{ style: { borderRadius: "14px" } }} />
    </div>
  );
}
