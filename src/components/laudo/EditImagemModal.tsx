import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Tag,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { DamageMarkerOverlay } from "./DamageMarkerOverlay";
import type { DamageMarker } from "../../services/laudos";

/**
 * Modal compartilhado para edição inline de uma imagem do laudo.
 *
 * Comportamento:
 * - Mostra a imagem em tela cheia, com badge de tipo/categoria, e barra
 *   inferior com textarea editável da legenda + indicador de salvamento.
 * - Marker de avaria arrastável (`DamageMarkerOverlay`) sobreposto,
 *   com `showPlaceholderOnEmpty` para guiar o usuário quando não há
 *   marker salvo ainda.
 * - Caption persiste com debounce de 700ms (mesma cadência da galeria).
 * - Marker persiste IMEDIATAMENTE no `pointerup` (sem debounce —
 *   evita spam de PATCH por pixel durante drag).
 * - ESC / clique no backdrop / botão X fecham o modal; se houver
 *   mudança pendente na legenda, dispara flush antes de fechar.
 *
 * Navegação entre imagens (setas + Tab) é opcional via props —
 * presente apenas quando o pai passa `onPrev`/`onNext`. O preview
 * de PDF não passa (edita uma imagem por vez), a galeria passa.
 *
 * Bloqueio de navegação enquanto a legenda está "dirty"
 * (legenda !== legendaSalva): enquanto o usuário está digitando
 * ou o debounce está em vôo, a navegação é desabilitada — tanto
 * o botão visual quanto as teclas Tab/←/→. Feedback sutil: um
 * dot amarelo pulsante ao lado do label "Legenda" + tooltip
 * explicativo nas setas. O objetivo é didático: o usuário entende
 * que precisa esperar o salvamento automático antes de mexer em
 * outra imagem. Funciona uniformemente para galeria e preview
 * porque ambos consomem este mesmo componente.
 */

const LEGENDA_MAX = 200;
const LEGENDA_DEBOUNCE_MS = 700;

// Helpers locais (eram inline na galeria). Se forem usados em mais
// lugares no futuro, mover para um `utils/text.ts` compartilhado.
const decodeMojibake = (value?: string | null) => {
  const original = value || "";
  if (!original) return "";
  if (!/[ÃÂâð]/.test(original)) return original;
  try {
    return decodeURIComponent(escape(original));
  } catch {
    return original;
  }
};
const normalizeText = (value?: string | null) =>
  decodeMojibake(value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
const isTipoNaoIdentificado = (value?: string | null) => {
  const normalized = normalizeText(value);
  const compact = normalized.replace(/\s+/g, "");
  return !compact || compact === "naoidentificado";
};
const formatTipoLabel = (value?: string | null) =>
  isTipoNaoIdentificado(value)
    ? "Não identificado"
    : decodeMojibake(value) || "Não identificado";

export interface EditImagemItem {
  id: string;
  url: string;
  tipo?: string | null;
  categoria?: string;
  legenda?: string | null;
  damageMarker?: DamageMarker | null;
}

export interface EditImagemModalProps {
  open: boolean;
  imagem: EditImagemItem | null;
  onClose: () => void;
  /** Chamado IMEDIATAMENTE após o usuário terminar de arrastar/redimensionar o marker. */
  onMarkerChange: (imagemId: string, marker: DamageMarker | null) => void;
  /**
   * Chamado DEBOUNCED (700ms) com a nova legenda. O pai deve persistir
   * via PATCH /uploads/imagem/:id/legenda.
   */
  onLegendaChange: (imagemId: string, legenda: string) => void;
  /**
   * Flush opcional para salvar sincronamente uma legenda pendente ao
   * fechar o modal (mesma estratégia da galeria). Se omitido, edições
   * pendentes no debounce são descartadas no fechamento.
   */
  onLegendaFlush?: (imagemId: string, legenda: string) => void;
  /** Navegação entre imagens — quando ausente, sem setas/Tab. */
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export default function EditImagemModal({
  open,
  imagem,
  onClose,
  onMarkerChange,
  onLegendaChange,
  onLegendaFlush,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: EditImagemModalProps) {
  // === Caption local ===
  const [legenda, setLegenda] = useState("");
  const [legendaSalva, setLegendaSalva] = useState("");
  const [saving, setSaving] = useState(false);
  const [legendaErro, setLegendaErro] = useState(false);

  // === Image load spinner ===
  const [imageLoading, setImageLoading] = useState(true);

  // === Refs ===
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRequestIdRef = useRef(0);
  const saveVersaoRef = useRef(0);
  const currentIdRef = useRef<string | null>(null);

  const hasNav = typeof onPrev === "function" && typeof onNext === "function";

  // Reseta o estado interno ao trocar de imagem. Importante para a
  // galeria navegar entre fotos: nova legenda, novo imageLoading=true
  // (a img nova vai disparar onLoad quando renderizar).
  useEffect(() => {
    if (!open) return;
    const newId = imagem?.id ?? null;
    if (newId === currentIdRef.current) return; // mesma imagem, mantém estado
    currentIdRef.current = newId;
    setLegenda(imagem?.legenda || "");
    setLegendaSalva(imagem?.legenda || "");
    setLegendaErro(false);
    setSaving(false);
    setImageLoading(true);
  }, [open, imagem?.id]);

  // Quando a legenda da imagem atual muda no parent (após persistência
  // bem-sucedida), sincroniza `legendaSalva` para destravar o indicador
  // "Salvo". Não dispara na troca de imagem (já tratada acima).
  useEffect(() => {
    if (!open) return;
    const newLegenda = imagem?.legenda || "";
    if (newLegenda === legendaSalva) return;
    setLegendaSalva(newLegenda);
    setSaving(false);
    setLegendaErro(false);
  }, [imagem?.legenda]);

  // Flush de pending save ao fechar (best-effort, mesmo padrão da galeria).
  const flushLegenda = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const currentId = currentIdRef.current;
    if (!currentId) return;
    if (legenda === legendaSalva) return;
    if (onLegendaFlush) {
      onLegendaFlush(currentId, legenda);
    } else {
      // Sem flush handler, persiste direto via onLegendaChange.
      onLegendaChange(currentId, legenda);
    }
  }, [legenda, legendaSalva, onLegendaChange, onLegendaFlush]);

  const handleClose = useCallback(() => {
    flushLegenda();
    onClose();
  }, [flushLegenda, onClose]);

  // ESC fecha.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }
      if (!hasNav) return;
      // Bloqueia navegação enquanto a legenda está dirty (não
      // persistida): se o usuário navegar agora, a edição em vôo
      // seria perdida ao trocar de imagem. O feedback visual fica
      // por conta do dot amarelo + tooltip nas setas.
      const dirtyNow = legenda !== legendaSalva;
      if (dirtyNow) {
        if (
          e.key === "Tab" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight"
        ) {
          e.preventDefault();
          // Não emite toast (seria irritante a cada tecla). O dot
          // pulsante + cursor-not-allowed nas setas + tooltip
          // "Salve a legenda antes de navegar" comunicam o motivo.
          return;
        }
      }
      // Tab/Setas navegam APENAS quando o foco não está na textarea
      // (não bloqueia cursor dentro da legenda) E quando há nav hooks.
      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) onPrev?.();
        else onNext?.();
        return;
      }
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditingText = tag === "TEXTAREA" || tag === "INPUT";
      if (isEditingText) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrev?.();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNext?.();
      }
    },
    [handleClose, onPrev, onNext, hasNav, legenda, legendaSalva],
  );

  // Auto-focus no container ao abrir (para as teclas funcionarem
  // imediatamente, sem precisar clicar).
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => dialogRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  // Bloqueia scroll do body enquanto aberto.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Limpa timer pendente no unmount.
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Mudou o textarea: atualiza local + agenda save com debounce.
  const handleLegendaInput = useCallback(
    (value: string) => {
      const limited = value.slice(0, LEGENDA_MAX);
      setLegenda(limited);
      const currentId = currentIdRef.current;
      if (!currentId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        if (limited === legendaSalva) return;
        setSaving(true);
        setLegendaErro(false);
        onLegendaChange(currentId, limited);
        // O parent sinaliza sucesso/falha atualizando `imagem.legenda`
        // (após PATCH bem-sucedido) ou via prop de erro. Caso nada
        // mude em LEGENDA_DEBOUNCE_MS, fallback: assume salvo (a
        // galeria atualizava otimisticamente; aqui o pai também o faz).
      }, LEGENDA_DEBOUNCE_MS);
    },
    [legendaSalva, onLegendaChange],
  );

  if (!open || !imagem) return null;

  const isAvaria =
    (imagem.categoria || "").trim().toUpperCase() === "AVARIA";
  // `dirty` = a legenda local diverge da última persistida. É o
  // sinal usado pra travar a navegação e mostrar o feedback visual.
  const dirty = legenda !== legendaSalva;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Edição da imagem"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-[110] bg-black/95 flex flex-col text-white outline-none"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm">
          {imagem.tipo && !isTipoNaoIdentificado(imagem.tipo) && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-xs">
              <Tag className="w-3 h-3" />
              {formatTipoLabel(imagem.tipo)}
            </span>
          )}
          {isAvaria && (
            <span className="px-2.5 py-1 rounded-full bg-red-500/80 text-xs font-semibold">
              Avaria
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar (Esc)"
            title="Fechar (Esc)"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Imagem + setas de navegação (se houver) */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 px-2 sm:px-4">
        {hasNav && hasPrev && (
          <button
            type="button"
            onClick={onPrev}
            disabled={dirty}
            aria-label="Imagem anterior (←)"
            title={
              dirty
                ? "Salve a legenda antes de navegar"
                : "Imagem anterior (←)"
            }
            className={`absolute left-2 sm:left-4 z-10 p-2 sm:p-3 rounded-full bg-black/50 border border-white/20 transition-colors ${
              dirty
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-black/70 cursor-pointer"
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div className="relative flex items-center justify-center w-full h-full min-h-0">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Loader2 className="w-10 h-10 animate-spin text-white/70" />
            </div>
          )}
          <div className="relative max-w-[90vw] max-h-[80vh]">
            <motion.img
              ref={imgRef}
              key={imagem.id}
              src={imagem.url}
              alt={imagem.tipo || "Imagem do laudo"}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18 }}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
              className="max-w-[90vw] max-h-[80vh] object-contain select-none block rounded-lg"
              draggable={false}
            />
            <DamageMarkerOverlay
              imageRef={imgRef}
              marker={isAvaria ? imagem.damageMarker ?? null : null}
              onChange={(m) => onMarkerChange(imagem.id, m)}
              editing={
                isAvaria &&
                (!!imagem.damageMarker || isAvaria)
              }
              showPlaceholderOnEmpty
            />
          </div>
        </div>

        {hasNav && hasNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={dirty}
            aria-label="Próxima imagem (→ ou Tab)"
            title={
              dirty
                ? "Salve a legenda antes de navegar"
                : "Próxima imagem (→ ou Tab)"
            }
            className={`absolute right-2 sm:right-4 z-10 p-2 sm:p-3 rounded-full bg-black/50 border border-white/20 transition-colors ${
              dirty
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-black/70 cursor-pointer"
            }`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Caption editável + indicador de salvamento */}
      <div className="flex-shrink-0 px-4 sm:px-6 pb-5 pt-3 bg-gradient-to-t from-black/80 to-black/0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-white/70">
            <span className="font-medium flex items-center gap-1.5">
              Legenda
              {/*
                Dot amarelo pulsante: aparece SÓ quando a legenda
                tem alteração não persistida. Comunica de forma
                sutil e didática que o salvamento está pendente e
                por isso a navegação está bloqueada. Some assim
                que o debounce dispara e o parent confirma via
                `imagem.legenda` (legendaSalva === legenda).
              */}
              {dirty && (
                <span
                  className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                  title="Você tem alterações não salvas — aguarde o salvamento automático"
                  aria-label="Alterações pendentes"
                />
              )}
            </span>
            <div className="flex items-center gap-1.5">
              {saving && (
                <span className="inline-flex items-center gap-1 text-amber-300">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Salvando...
                </span>
              )}
              {!saving &&
                !legendaErro &&
                legenda === legendaSalva &&
                legenda.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <Check className="w-3 h-3" />
                    Salvo
                  </span>
                )}
              {legendaErro && (
                <span className="inline-flex items-center gap-1 text-red-300">
                  <AlertCircle className="w-3 h-3" />
                  Erro ao salvar
                </span>
              )}
              <span
                className={`tabular-nums ${legenda.length >= LEGENDA_MAX ? "text-red-300" : ""}`}
              >
                {legenda.length}/{LEGENDA_MAX}
              </span>
            </div>
          </div>
          <textarea
            value={legenda}
            onChange={(e) => handleLegendaInput(e.target.value)}
            maxLength={LEGENDA_MAX}
            rows={2}
            placeholder="Adicione uma legenda para esta imagem..."
            className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/15 focus:ring-2 focus:ring-white/40 border border-white/20 rounded-lg px-3 py-2 text-sm sm:text-base text-white placeholder-white/50 outline-none resize-none transition-colors"
          />
          {hasNav && (
            <div className="mt-1.5 text-[11px] text-white/50 hidden sm:flex items-center justify-center gap-3 flex-wrap">
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] font-mono">
                  ←
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] font-mono ml-1">
                  →
                </kbd>{" "}
                navegar
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] font-mono">
                  Tab
                </kbd>{" "}
                próxima
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] font-mono">
                  Esc
                </kbd>{" "}
                fechar
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
