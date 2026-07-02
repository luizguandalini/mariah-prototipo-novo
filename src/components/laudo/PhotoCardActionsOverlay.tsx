import { AlertCircle, Loader2, MoreVertical, Tag, Trash2 } from "lucide-react";

export interface PhotoCardActionsImage {
  id: string;
  categoria?: string | null;
}

interface PhotoCardActionsOverlayProps {
  img: PhotoCardActionsImage;
  /** True quando o dispositivo não suporta hover (touch-only). */
  isTouchOnly: boolean;
  /** True quando ESTA imagem está com o overlay aberto no modo touch. */
  showActionsOnMobile: boolean;
  /** True quando ALGUMA imagem está com overlay aberto no modo touch — esconde os hints "..." dos demais cards. */
  anyMobileActionsOpen: boolean;
  /** Abre/fecha o overlay desta imagem no modo touch. `null` fecha. */
  onMobileActionsChange: (id: string | null) => void;
  /** Recebe `(id, willMarcarAvaria)` — handler decide se marca ou desmarca. */
  onToggleAvaria: (id: string, willMarcarAvaria: boolean) => void;
  onMarcarItem: (id: string) => void;
  onDelete: (id: string) => void;
  /** IDs das imagens com mutation em andamento (mostram spinner). */
  loadingCategoriaChange?: string | null;
  loadingItemFlagChange?: string | null;
}

/**
 * Overlay com as ações rápidas da foto (Marcar/Desmarcar avaria,
 * Marcar como item, Excluir). Extraído para reuso entre GaleriaImagens
 * e o VisualizadorPdfLaudo — garante que ambos os contextos usem
 * exatamente o mesmo markup/UX para essas ações (mesma logica de
 * toast, mesmo guarda `stopPropagation`, mesmo comportamento touch).
 *
 * Posicionamento: o overlay e o botão "..." (touch) precisam estar
 * dentro de um container `position: relative` (o card da foto).
 * O overlay cobre toda a foto (`absolute inset-0`); o botão "..."
 * fica no canto inferior direito (`absolute bottom-2 right-2`).
 *
 * `data-image-actions-trigger={img.id}` é o gancho usado pelo
 * listener global de mousedown/touchstart no pai para ignorar
 * toques DENTRO do overlay — sem isso, tocar num botão faria o
 * overlay fechar antes do botão reagir.
 */
export default function PhotoCardActionsOverlay({
  img,
  isTouchOnly,
  showActionsOnMobile,
  anyMobileActionsOpen,
  onMobileActionsChange,
  onToggleAvaria,
  onMarcarItem,
  onDelete,
  loadingCategoriaChange,
  loadingItemFlagChange,
}: PhotoCardActionsOverlayProps) {
  const isAvaria = (img.categoria || "").trim().toUpperCase() === "AVARIA";

  return (
    <>
      {/*
        Hint "..." visível apenas em mobile (touch-only) quando este card
        NÃO está com o overlay aberto. some em desktop. some também
        quando QUALQUER overlay de ações mobile está aberto em outro
        card — assim não acumulamos vários hints na tela.
      */}
      {isTouchOnly && !showActionsOnMobile && !anyMobileActionsOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMobileActionsChange(img.id);
          }}
          aria-label="Mostrar ações da imagem"
          className="absolute bottom-2 right-2 z-20 p-1.5 rounded-full bg-black/55 hover:bg-black/70 border border-white/25 text-white shadow-md backdrop-blur-sm transition-colors"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      )}

      {/*
        Overlay de ações (avaria / item / excluir).

        - Desktop: aparece em hover (group-hover). O overlay é puramente
          para acesso rápido às ações.
        - Mobile (touch-only): controlado pelo state externo
          (showActionsOnMobile) — aberto pelo botão "..." (MoreVertical)
          no canto inferior direito. Tap na área que NÃO é botão borbulha
          para o card e abre o lightbox (o container não tem
          stopPropagation; só os botões individuais têm, para não
          disparar a ação duas vezes). `pointer-events-none` quando
          invisível evita cliques fantasmas em botões cobertos pelo
          overlay.
      */}
      <div
        data-image-actions-trigger={img.id}
        className={
          isTouchOnly
            ? `absolute inset-0 bg-black/70 transition-opacity duration-200 p-3 pt-10 flex flex-col justify-center content-center gap-3 text-white text-xs ${
                showActionsOnMobile
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`
            : "absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none transition-opacity duration-200 p-3 pt-10 flex flex-col justify-center content-center gap-3 text-white text-xs"
        }
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleAvaria(img.id, !isAvaria);
            // Em mobile, fecha o overlay após disparar a ação.
            if (isTouchOnly) onMobileActionsChange(null);
          }}
          disabled={loadingCategoriaChange === img.id}
          className={`w-full py-2 rounded flex items-center justify-center gap-2 transition-colors border ${
            isAvaria
              ? "bg-red-500/25 hover:bg-red-500/40 text-red-100 border-red-500/60"
              : "bg-amber-500/20 hover:bg-amber-500/35 text-amber-100 border-amber-500/50"
          } ${loadingCategoriaChange === img.id ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {loadingCategoriaChange === img.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{isAvaria ? "Desmarcar avaria" : "Marcar como avaria"}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarcarItem(img.id);
            if (isTouchOnly) onMobileActionsChange(null);
          }}
          disabled={loadingItemFlagChange === img.id}
          className={`w-full py-2 rounded flex items-center justify-center gap-2 transition-colors border bg-blue-500/20 hover:bg-blue-500/35 text-blue-100 border-blue-500/50 ${
            loadingItemFlagChange === img.id ? "opacity-70 cursor-not-allowed" : ""
          }`}
          title="Adiciona a palavra ITEM ao início da descrição"
        >
          {loadingItemFlagChange === img.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Tag className="w-4 h-4" />
          )}
          <span>Marcar como item</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(img.id);
            if (isTouchOnly) onMobileActionsChange(null);
          }}
          className="w-full mt-2 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/50 rounded flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Excluir</span>
        </button>
      </div>
    </>
  );
}