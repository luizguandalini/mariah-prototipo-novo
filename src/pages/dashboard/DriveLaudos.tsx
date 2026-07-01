import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Folder,
  Loader2,
  ImageOff,
  List,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  laudosService,
  type Laudo,
  type DriveYear,
  type DriveMonth,
} from "../../services/laudos";

/**
 * Drive (DEV/ADMIN) — visão de nível superior de TODOS os laudos do sistema,
 * com UI 100% fiel ao Mariah Drive (estilo Google Drive). Dois modos de
 * navegação:
 *   - "Todos": laudos como pastas, do mais recente para o mais antigo, paginado.
 *   - "Por data": ano → mês → laudos daquele mês.
 *
 * Clicar em um laudo abre o Mariah Drive daquele laudo
 * (/dashboard/laudos/:id/drive), reaproveitando a tela de pastas de ambientes.
 *
 * Consome os endpoints do backend:
 *   - GET /drive/laudos?page&limit
 *   - GET /drive/years
 *   - GET /drive/years/:year/months
 *   - GET /drive/years/:year/months/:month/laudos?page&limit
 */

const LIMIT = 24;
const ORIGEM = "/admin/drive";
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

type Modo = "todos" | "data";

export default function DriveLaudos() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>("todos");

  // ===== Modo "Todos" (lista flat) =====
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [loadingLaudos, setLoadingLaudos] = useState(false);
  const [loadingMais, setLoadingMais] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [erroLaudos, setErroLaudos] = useState<string | null>(null);

  // ===== Modo "Por data" =====
  const [years, setYears] = useState<DriveYear[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [anoAberto, setAnoAberto] = useState<number | null>(null);
  const [months, setMonths] = useState<DriveMonth[]>([]);
  const [loadingMonths, setLoadingMonths] = useState(false);
  const [mesAberto, setMesAberto] = useState<number | null>(null);
  const [mesLaudos, setMesLaudos] = useState<Laudo[]>([]);
  const [loadingMes, setLoadingMes] = useState(false);
  const [loadingMaisMes, setLoadingMaisMes] = useState(false);
  const [mesPage, setMesPage] = useState(1);
  const [mesLastPage, setMesLastPage] = useState(1);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const abrirLaudo = (l: Laudo) =>
    navigate(`/dashboard/laudos/${l.id}/drive`, { state: { from: ORIGEM } });

  // ===== Fetch: lista flat =====
  const fetchLaudos = useCallback(async (p: number, append = false) => {
    try {
      if (append) setLoadingMais(true);
      else setLoadingLaudos(true);
      setErroLaudos(null);
      const res = await laudosService.getDriveLaudos(p, LIMIT);
      setLaudos((prev) => {
        if (!append) return res.data;
        const map = new Map(prev.map((l) => [l.id, l]));
        res.data.forEach((l) => map.set(l.id, l));
        return Array.from(map.values());
      });
      setPage(res.page);
      setLastPage(res.lastPage);
    } catch (err) {
      console.error(err);
      if (!append) setErroLaudos("Não foi possível carregar os laudos.");
      else toast.error("Não foi possível carregar mais laudos.");
    } finally {
      if (append) setLoadingMais(false);
      else setLoadingLaudos(false);
    }
  }, []);

  // ===== Fetch: anos =====
  const fetchYears = useCallback(async () => {
    try {
      setLoadingYears(true);
      const res = await laudosService.getDriveYears();
      setYears(res);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível carregar os anos.");
    } finally {
      setLoadingYears(false);
    }
  }, []);

  // ===== Fetch: meses de um ano =====
  const fetchMonths = useCallback(async (year: number) => {
    try {
      setLoadingMonths(true);
      const res = await laudosService.getDriveMonths(year);
      setMonths(res);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível carregar os meses.");
    } finally {
      setLoadingMonths(false);
    }
  }, []);

  // ===== Fetch: laudos de um mês =====
  const fetchMesLaudos = useCallback(
    async (year: number, month: number, p: number, append = false) => {
      try {
        if (append) setLoadingMaisMes(true);
        else setLoadingMes(true);
        const res = await laudosService.getDriveLaudosByMonth(
          year,
          month,
          p,
          LIMIT,
        );
        setMesLaudos((prev) => {
          if (!append) return res.data;
          const map = new Map(prev.map((l) => [l.id, l]));
          res.data.forEach((l) => map.set(l.id, l));
          return Array.from(map.values());
        });
        setMesPage(res.page);
        setMesLastPage(res.lastPage);
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível carregar os laudos do mês.");
      } finally {
        if (append) setLoadingMaisMes(false);
        else setLoadingMes(false);
      }
    },
    [],
  );

  // Carrega a lista flat ao entrar no modo "Todos" (uma vez).
  useEffect(() => {
    if (modo === "todos" && laudos.length === 0 && !loadingLaudos && !erroLaudos) {
      fetchLaudos(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo]);

  // Carrega os anos ao entrar no modo "Por data" (uma vez).
  useEffect(() => {
    if (modo === "data" && years.length === 0 && !loadingYears) {
      fetchYears();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo]);

  // Ao abrir um ano, carrega os meses.
  useEffect(() => {
    if (anoAberto !== null) {
      setMonths([]);
      fetchMonths(anoAberto);
    }
  }, [anoAberto, fetchMonths]);

  // Ao abrir um mês, carrega os laudos.
  useEffect(() => {
    if (anoAberto !== null && mesAberto !== null) {
      setMesLaudos([]);
      setMesPage(1);
      setMesLastPage(1);
      fetchMesLaudos(anoAberto, mesAberto, 1, false);
    }
  }, [anoAberto, mesAberto, fetchMesLaudos]);

  // ===== Paginação incremental =====
  const listaFlatVisivel = modo === "todos";
  const mesLaudosVisivel = modo === "data" && anoAberto !== null && mesAberto !== null;
  const hasMoreFlat = page < lastPage;
  const hasMoreMes = mesPage < mesLastPage;

  const handleLoadMore = useCallback(() => {
    if (listaFlatVisivel) {
      if (loadingLaudos || loadingMais || !hasMoreFlat) return;
      fetchLaudos(page + 1, true);
    } else if (mesLaudosVisivel && anoAberto !== null && mesAberto !== null) {
      if (loadingMes || loadingMaisMes || !hasMoreMes) return;
      fetchMesLaudos(anoAberto, mesAberto, mesPage + 1, true);
    }
  }, [
    listaFlatVisivel,
    mesLaudosVisivel,
    loadingLaudos,
    loadingMais,
    hasMoreFlat,
    page,
    fetchLaudos,
    loadingMes,
    loadingMaisMes,
    hasMoreMes,
    anoAberto,
    mesAberto,
    mesPage,
    fetchMesLaudos,
  ]);

  // Scroll infinito
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) handleLoadMore();
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  // ===== Navegação de breadcrumb / modo =====
  const irParaRaiz = () => {
    setAnoAberto(null);
    setMesAberto(null);
  };

  const trocarModo = (novo: Modo) => {
    setAnoAberto(null);
    setMesAberto(null);
    setModo(novo);
  };

  const podeVoltar = anoAberto !== null || mesAberto !== null;
  const voltar = () => {
    if (mesAberto !== null) setMesAberto(null);
    else if (anoAberto !== null) setAnoAberto(null);
    else navigate("/admin/laudos");
  };

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-7rem)] rounded-2xl bg-white text-[#1f1f1f] shadow-sm border border-[#e0e0e0] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[#e0e0e0]">
          <button
            onClick={voltar}
            className="p-2 rounded-full hover:bg-[#f1f3f4] text-[#5f6368] transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src="/google-drive.svg" alt="" className="w-6 h-6" />
          <span className="text-lg font-medium text-[#5f6368] select-none">
            Drive — Todos os Laudos
          </span>
        </div>

        {/* Alternador de modo */}
        <div className="flex items-center gap-2 px-6 pt-4">
          <ModoBotao
            ativo={modo === "todos"}
            onClick={() => trocarModo("todos")}
            icon={<List className="w-4 h-4" />}
            label="Todos"
          />
          <ModoBotao
            ativo={modo === "data"}
            onClick={() => trocarModo("data")}
            icon={<CalendarDays className="w-4 h-4" />}
            label="Por data"
          />
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 px-6 py-3 text-[#5f6368]">
          <button
            onClick={irParaRaiz}
            className={`text-xl font-normal hover:underline ${
              !podeVoltar ? "text-[#1f1f1f] font-medium" : ""
            }`}
          >
            Meu Drive
          </button>
          {modo === "data" && anoAberto !== null && (
            <>
              <ChevronRight className="w-5 h-5 mx-1 opacity-70" />
              <button
                onClick={() => setMesAberto(null)}
                className={`text-xl font-normal hover:underline ${
                  mesAberto === null ? "text-[#1f1f1f] font-medium" : ""
                }`}
              >
                {anoAberto}
              </button>
            </>
          )}
          {modo === "data" && anoAberto !== null && mesAberto !== null && (
            <>
              <ChevronRight className="w-5 h-5 mx-1 opacity-70" />
              <span className="text-xl font-medium text-[#1f1f1f]">
                {MESES[mesAberto - 1]}
              </span>
            </>
          )}
        </div>

        <div className="px-6 pb-10">
          {/* ===== MODO TODOS ===== */}
          {modo === "todos" && (
            <>
              {loadingLaudos ? (
                <CarregandoBloco />
              ) : erroLaudos ? (
                <div className="py-24 text-center text-red-500">{erroLaudos}</div>
              ) : laudos.length === 0 ? (
                <EmptyState
                  titulo="Nenhum laudo por aqui"
                  descricao="Ainda não há laudos no sistema."
                />
              ) : (
                <>
                  <p className="text-sm font-medium text-[#5f6368] mb-3">Laudos</p>
                  <GradePastas>
                    {laudos.map((l) => (
                      <LaudoCard key={l.id} laudo={l} onClick={() => abrirLaudo(l)} />
                    ))}
                  </GradePastas>
                  {hasMoreFlat && (
                    <div ref={loadMoreRef} className="flex justify-center py-8">
                      <BotaoCarregarMais loading={loadingMais} onClick={handleLoadMore} />
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ===== MODO POR DATA ===== */}
          {modo === "data" && (
            <>
              {/* Nível 1: anos */}
              {anoAberto === null && (
                <>
                  {loadingYears ? (
                    <CarregandoBloco />
                  ) : years.length === 0 ? (
                    <EmptyState
                      titulo="Nenhum ano com laudos"
                      descricao="Ainda não há laudos no sistema."
                    />
                  ) : (
                    <>
                      <p className="text-sm font-medium text-[#5f6368] mb-3">Anos</p>
                      <GradePastas>
                        {years.map((y) => (
                          <PastaCard
                            key={y.year}
                            titulo={String(y.year)}
                            sub={`${y.count} ${y.count === 1 ? "laudo" : "laudos"}`}
                            onClick={() => setAnoAberto(y.year)}
                          />
                        ))}
                      </GradePastas>
                    </>
                  )}
                </>
              )}

              {/* Nível 2: meses */}
              {anoAberto !== null && mesAberto === null && (
                <>
                  {loadingMonths ? (
                    <CarregandoBloco />
                  ) : months.length === 0 ? (
                    <EmptyState
                      titulo="Nenhum mês com laudos"
                      descricao={`Não há laudos em ${anoAberto}.`}
                    />
                  ) : (
                    <>
                      <p className="text-sm font-medium text-[#5f6368] mb-3">Meses</p>
                      <GradePastas>
                        {months.map((m) => (
                          <PastaCard
                            key={m.month}
                            titulo={MESES[m.month - 1]}
                            sub={`${m.count} ${m.count === 1 ? "laudo" : "laudos"}`}
                            onClick={() => setMesAberto(m.month)}
                          />
                        ))}
                      </GradePastas>
                    </>
                  )}
                </>
              )}

              {/* Nível 3: laudos do mês */}
              {anoAberto !== null && mesAberto !== null && (
                <>
                  {loadingMes ? (
                    <CarregandoBloco />
                  ) : mesLaudos.length === 0 ? (
                    <EmptyState
                      titulo="Nenhum laudo neste mês"
                      descricao={`Não há laudos em ${MESES[mesAberto - 1]} de ${anoAberto}.`}
                    />
                  ) : (
                    <>
                      <p className="text-sm font-medium text-[#5f6368] mb-3">Laudos</p>
                      <GradePastas>
                        {mesLaudos.map((l) => (
                          <LaudoCard
                            key={l.id}
                            laudo={l}
                            onClick={() => abrirLaudo(l)}
                          />
                        ))}
                      </GradePastas>
                      {hasMoreMes && (
                        <div ref={loadMoreRef} className="flex justify-center py-8">
                          <BotaoCarregarMais
                            loading={loadingMaisMes}
                            onClick={handleLoadMore}
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ===================== Subcomponentes =====================

function ModoBotao({
  ativo,
  onClick,
  icon,
  label,
}: {
  ativo: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        ativo
          ? "bg-[#c2e7ff] text-[#001d35]"
          : "border border-[#dadce0] text-[#1f1f1f] hover:bg-[#f1f3f4]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function GradePastas({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {children}
    </div>
  );
}

function PastaCard({
  titulo,
  sub,
  onClick,
}: {
  titulo: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#f0f4f9] hover:bg-[#e3e8ef] transition-colors text-left"
    >
      <Folder className="w-6 h-6 text-[#5f6368] shrink-0" fill="#5f6368" strokeWidth={0} />
      <span className="flex-1 min-w-0">
        <span className="block truncate text-sm font-medium text-[#1f1f1f]">
          {titulo}
        </span>
        <span className="block text-xs text-[#5f6368]">{sub}</span>
      </span>
    </button>
  );
}

function LaudoCard({ laudo, onClick }: { laudo: Laudo; onClick: () => void }) {
  const titulo =
    (laudo.rua && laudo.rua.trim()) ||
    (laudo.endereco && laudo.endereco.trim()) ||
    "Laudo sem endereço";
  const data = laudo.createdAt
    ? new Date(laudo.createdAt).toLocaleDateString("pt-BR")
    : "";
  const partes = [
    data,
    `${laudo.totalFotos ?? 0} ${(laudo.totalFotos ?? 0) === 1 ? "foto" : "fotos"}`,
  ];
  if (laudo.usuarioNome) partes.push(laudo.usuarioNome);

  return (
    <button
      onClick={onClick}
      title={titulo}
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#f0f4f9] hover:bg-[#e3e8ef] transition-colors text-left"
    >
      <Folder className="w-6 h-6 text-[#5f6368] shrink-0" fill="#5f6368" strokeWidth={0} />
      <span className="flex-1 min-w-0">
        <span className="block truncate text-sm font-medium text-[#1f1f1f]">
          {titulo}
        </span>
        <span className="block truncate text-xs text-[#5f6368]">
          {partes.join(" · ")}
        </span>
      </span>
    </button>
  );
}

function BotaoCarregarMais({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-5 py-2 rounded-full border border-[#dadce0] text-sm font-medium text-[#1f1f1f] hover:bg-[#f1f3f4] transition-colors disabled:opacity-60"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando...
        </span>
      ) : (
        "Carregar mais"
      )}
    </button>
  );
}

function CarregandoBloco() {
  return (
    <div className="flex items-center justify-center py-24 text-[#5f6368]">
      <Loader2 className="w-6 h-6 animate-spin mr-2" />
      Carregando...
    </div>
  );
}

function EmptyState({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ImageOff className="w-12 h-12 text-[#bdc1c6] mb-4" />
      <p className="text-base font-medium text-[#3c4043]">{titulo}</p>
      <p className="text-sm text-[#5f6368] mt-1">{descricao}</p>
    </div>
  );
}
