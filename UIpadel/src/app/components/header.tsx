import { Search, Plus, LayoutGrid } from "lucide-react";
import { Logo } from "./logo";

type Vista = "home" | "publicar" | "mis";

export function Header({
  query,
  onQuery,
  onNav,
  vista,
}: {
  query: string;
  onQuery: (v: string) => void;
  onNav: (v: Vista) => void;
  vista: Vista;
}) {
  return (
    <header
      className="sticky top-0 z-30"
      style={{ background: "#FFFFFF", borderBottom: "1px solid #E6E4DF" }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-3 md:gap-5 md:px-6">
        <button onClick={() => onNav("home")} className="shrink-0">
          <Logo />
        </button>

        <div className="relative hidden flex-1 md:block" style={{ maxWidth: 460 }}>
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#6B7280" }}
          />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Buscar por marca o modelo…"
            className="w-full rounded-[14px] py-2.5 pl-10 pr-3 text-[14px] outline-none transition-colors"
            style={{ background: "#FAFAF8", border: "1px solid #E6E4DF", color: "#14171A" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#0F5132")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#E6E4DF")}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => onNav("mis")}
            className="hidden items-center gap-1.5 rounded-[14px] px-3 py-2 text-[14px] transition-colors sm:flex"
            style={{
              color: vista === "mis" ? "#0F5132" : "#6B7280",
              fontWeight: 600,
            }}
          >
            <LayoutGrid size={16} /> Mis paletas
          </button>
          <button
            onClick={() => onNav("publicar")}
            className="flex items-center gap-1.5 rounded-[14px] px-3.5 py-2 text-[14px] text-white transition-opacity hover:opacity-90"
            style={{ background: "#0F5132", fontWeight: 600 }}
          >
            <Plus size={16} /> <span className="hidden sm:inline">Publicar</span>
          </button>
          <button
            onClick={() => onNav("mis")}
            className="h-9 w-9 shrink-0 overflow-hidden rounded-full"
            style={{ border: "1px solid #E6E4DF" }}
          >
            <img
              src="https://i.pravatar.cc/80?img=12"
              alt="Perfil"
              className="h-full w-full object-cover"
            />
          </button>
        </div>
      </div>

      {/* Buscador mobile */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#6B7280" }}
          />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Buscar por marca o modelo…"
            className="w-full rounded-[14px] py-2.5 pl-10 pr-3 text-[14px] outline-none"
            style={{ background: "#FAFAF8", border: "1px solid #E6E4DF", color: "#14171A" }}
          />
        </div>
      </div>
    </header>
  );
}
