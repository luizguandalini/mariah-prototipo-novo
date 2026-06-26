import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DamageMarker } from "../../services/laudos";

/**
 * Raio default do círculo quando o usuário acabou de marcar a foto
 * como AVARIA e ainda não arrastou o círculo. Em coords normalizadas
 * (fração do menor lado da imagem original — `min(naturalWidth, naturalHeight)`).
 */
const DEFAULT_RADIUS = 0.15;
const MIN_RADIUS = 0.05;
const MAX_RADIUS = 0.45;
const RESIZE_HANDLE_PX = 22;
const HANDLE_HIT_PX = 28;

const FALLBACK_MARKER: DamageMarker = {
  x: 0.5,
  y: 0.5,
  r: DEFAULT_RADIUS,
};

/**
 * Camada de overlay com o círculo vermelho de marcação de avaria.
 *
 * CONTRATO DE COORDENADAS:
 * - O marker é salvo/ler em coordenadas normalizadas da IMAGEM
 *   ORIGINAL: `x`, `y` ∈ [0,1] em relação a `naturalWidth`/`naturalHeight`;
 *   `r` ∈ [0,1] em relação a `min(naturalWidth, naturalHeight)`.
 * - Por que NÃO container-relativo: cada view (card 1:1, preview
 *   retangular, lightbox full-screen) usa `object-cover`/`object-contain`
 *   e recorta a imagem de jeito diferente. Se o marker fosse salvo em
 *   coords do container, a posição visual mudaria entre views
 *   (ver bug reportado: marker marcado no card aparecia em outro
 *   lugar na galeria/preview). Em coords da imagem original, o
 *   marker fica no MESMO pixel da foto em qualquer view.
 *
 * CONTRATO DE PERFORMANCE:
 * - Backend é chamado EXATAMENTE 1 VEZ por drag (no pointerup).
 *   Veja comentário no `handlePointerUp` para detalhes.
 */
export interface DamageMarkerOverlayProps {
  imageRef: React.RefObject<HTMLImageElement | null>;
  /** Marcador persistido no DB em coords de imagem (0..1). `null` = não renderizar. */
  marker: DamageMarker | null;
  /** Notifica o pai do novo marker após o drag/resize terminar. */
  onChange: (next: DamageMarker) => void;
  /**
   * Quando `true`, o overlay aparece mas não é arrastável/redimensionável.
   * Usado no preview do PDF (VisualizadorPdfLaudo).
   */
  disabled?: boolean;
}

type DragKind = "move" | "resize";

interface DragSession {
  kind: DragKind;
  startClientX: number;
  startClientY: number;
  startMarker: DamageMarker;
  pointerId: number;

  // === Snapshot do ambiente no momento do pointerdown ===
  // Dimensões naturais da imagem original (do `img.naturalWidth/Height`).
  naturalW: number;
  naturalH: number;
  // Dimensões do container em PIXELS LÓGICOS (offsetWidth/Height).
  // Imunes a transform do pai (group-hover:scale-105). Usadas para
  // calcular o scale de `object-cover` e os offsets de crop.
  logicalW: number;
  logicalH: number;
  // Dimensões DISPLAY da imagem dentro do container (pode ser maior
  // que o container se houver crop por object-cover).
  displayW: number;
  displayH: number;
  // Escala de transform visual do wrapper pai no momento do drag
  // (1 se não está em hover, ~1.05 quando hover-scale). Usada para
  // converter delta do cursor em pixels lógicos do container.
  hoverScale: number;
}

/**
 * Calcula a região da imagem renderizada dentro do container com
 * `object-fit: cover`. O aspect ratio do container pode diferir do
 * aspect ratio da imagem original — neste caso, a imagem é escalada
 * para cobrir e uma dimensão é cortada centralizada.
 */
function computeObjectCoverRegion(
  containerW: number,
  containerH: number,
  naturalW: number,
  naturalH: number,
) {
  const scale = Math.max(containerW / naturalW, containerH / naturalH);
  const displayW = naturalW * scale;
  const displayH = naturalH * scale;
  // offX/offY são ≥ 0 (a imagem é MAIOR que o container em pelo
  // menos uma dimensão — isso é exatamente o que object-cover faz).
  const offX = (displayW - containerW) / 2;
  const offY = (displayH - containerH) / 2;
  return { scale, displayW, displayH, offX, offY };
}

export const DamageMarkerOverlay: React.FC<DamageMarkerOverlayProps> = ({
  imageRef,
  marker,
  onChange,
  disabled,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // `localMarker` (state) — render. Atualizado a cada pointermove.
  const [localMarker, setLocalMarker] = useState<DamageMarker | null>(marker);

  // `localMarkerRef` (ref) — espelha o state para leitura síncrona
  // no `handlePointerUp` SEM passar por updater de useState
  // (anti-pattern que dispara múltiplos onChange em React 18 / Strict).
  const localMarkerRef = useRef<DamageMarker | null>(marker);

  const dragSessionRef = useRef<DragSession | null>(null);
  const handlersRef = useRef<{
    move: ((ev: PointerEvent) => void) | null;
    up: ((ev: PointerEvent) => void) | null;
  }>({ move: null, up: null });

  // onChange estável via ref — o pai recria a arrow function a cada
  // render, mas o handler sempre lê a versão mais recente daqui.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sincroniza localMarker quando marker externo muda (após save
  // remoto ou troca de imagem). Só sincroniza quando NÃO está em drag.
  useEffect(() => {
    if (!dragSessionRef.current) {
      localMarkerRef.current = marker;
      setLocalMarker(marker);
    }
  }, [marker]);

  // Cleanup no unmount.
  useEffect(() => {
    return () => {
      detachDragListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dimensões naturais da imagem original. Lidas do `<img>` em state
  // porque o evento `load` da imagem é assíncrono — sem state, o
  // overlay renderiza com `naturalWidth=0` na primeira passagem e
  // NUNCA re-renderiza (o React não sabe que a imagem carregou).
  // Resultado: marker nunca aparece no load inicial (F5) — só depois
  // de uma interação que force re-render (drag, troca de prop). Este
  // listener dispara setState no `load`/`error`, garantindo que o
  // overlay re-mensure e renderize o marker assim que a imagem fica
  // disponível.
  const [imgDims, setImgDims] = useState<{ w: number; h: number }>(() => {
    const el = imageRef.current;
    return {
      w: el?.naturalWidth ?? 0,
      h: el?.naturalHeight ?? 0,
    };
  });
  useEffect(() => {
    const el = imageRef.current;
    if (!el) return;
    // Imagem já carregada (cache do browser)? Captura imediatamente.
    if (el.complete && el.naturalWidth > 0) {
      setImgDims({ w: el.naturalWidth, h: el.naturalHeight });
      return;
    }
    const sync = () => {
      setImgDims({ w: el.naturalWidth, h: el.naturalHeight });
    };
    el.addEventListener("load", sync);
    el.addEventListener("error", sync);
    return () => {
      el.removeEventListener("load", sync);
      el.removeEventListener("error", sync);
    };
  }, [imageRef]);

  // Tamanho LÓGICO do container (offsetWidth/Height, ignora transforms
  // do pai como group-hover:scale-105). Usado para calcular o crop de
  // object-cover e a posição do marker.
  const [{ w: containerW, h: containerH }, setContainerSize] = useState({
    w: 0,
    h: 0,
  });
  useLayoutEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      setContainerSize({ w: el.offsetWidth, h: el.offsetHeight });
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Dimensões naturais da imagem original. Lidas de state (atualizado
  // no `load` do `<img>`).
  const naturalW = imgDims.w;
  const naturalH = imgDims.h;

  const canRender =
    naturalW > 0 && naturalH > 0 && containerW > 0 && containerH > 0;

  // Calcula região do object-cover. Só faz sentido se tudo > 0.
  const region = canRender
    ? computeObjectCoverRegion(containerW, containerH, naturalW, naturalH)
    : null;

  // Marker em pixels do container (CSS). Quando region=null, valores
  // são placeholders seguros (zero) — o marker visível é gated por
  // `canRender && localMarker`.
  const lm = localMarker;
  const cx =
    region != null && lm != null ? lm.x * region.displayW - region.offX : 0;
  const cy =
    region != null && lm != null ? lm.y * region.displayH - region.offY : 0;
  const minDisplayDim =
    region != null ? Math.min(region.displayW, region.displayH) : 0;
  const r = lm != null ? lm.r * minDisplayDim : 0;

  /**
   * Handler de pointermove. Atualiza APENAS ref + state local. NUNCA
   * chama `onChange` — drag pode disparar 60+ pointermove por segundo.
   */
  const handlePointerMove = useCallback((ev: PointerEvent) => {
    const session = dragSessionRef.current;
    if (!session || ev.pointerId !== session.pointerId) return;

    const dxScreen = ev.clientX - session.startClientX;
    const dyScreen = ev.clientY - session.startClientY;

    // Converte delta do cursor (screen pixels) para delta em pixels
    // LÓGICOS do container — divide pela escala de transform do
    // wrapper (1.0 normal, ~1.05 em hover). Capturada no pointerdown.
    const dxLogical = dxScreen / session.hoverScale;
    const dyLogical = dyScreen / session.hoverScale;

    // Converte delta lógico para delta normalizado na IMAGEM
    // ORIGINAL. O container e a imagem exibida compartilham o mesmo
    // sistema de coords (delta dentro do container = delta dentro
    // da imagem exibida); só o fator de escala displayW/displayH
    // entra para chegar em coords normalizadas da imagem original.
    const dxImageNorm = dxLogical / session.displayW;
    const dyImageNorm = dyLogical / session.displayH;

    const minNaturalDim = Math.min(session.naturalW, session.naturalH);

    let nextX = session.startMarker.x;
    let nextY = session.startMarker.y;
    let nextR = session.startMarker.r;

    if (session.kind === "move") {
      nextX += dxImageNorm;
      nextY += dyImageNorm;
    } else {
      // Resize: nova distância diagonal entre o centro e o novo
      // cursor (em pixels lógicos). A fórmula `sqrt((r+dx)² + (r+dy)²)`
      // cresce/diminui conforme o usuário arrasta a alça do canto
      // inferior-direito para longe/perto do centro.
      const rContainer =
        session.startMarker.r * Math.min(session.displayW, session.displayH);
      const newRContainer = Math.sqrt(
        (rContainer + dxLogical) ** 2 + (rContainer + dyLogical) ** 2,
      );
      nextR = newRContainer / Math.min(session.displayW, session.displayH);
    }

    // Clamp raio nos limites definidos.
    nextR = Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, nextR));

    // Clamp posição para o marker nunca sair dos limites da imagem.
    // O raio é fração de min(naturalW, naturalH); em pixels = r*minDim.
    // Margem mínima do centro até cada borda = r*minDim.
    const rPixels = nextR * minNaturalDim;
    const xMin = rPixels / session.naturalW;
    const xMax = 1 - xMin;
    const yMin = rPixels / session.naturalH;
    const yMax = 1 - yMin;
    nextX = Math.min(xMax, Math.max(xMin, nextX));
    nextY = Math.min(yMax, Math.max(yMin, nextY));

    const next: DamageMarker = { x: nextX, y: nextY, r: nextR };
    localMarkerRef.current = next;
    setLocalMarker(next);
  }, []);

  /**
   * Pointerup / pointercancel. EXATO 1 ponto onde onChange é disparado.
   *
   * Reentrancy guards:
   * 1. dragSessionRef.current = null IMEDIATAMENTE — qualquer pointerup
   *    subsequente sai cedo.
   * 2. detachDragListeners ANTES de chamar onChange — evita reentrada.
   * 3. Click sem movimento → 0 PATCH (equality check com startMarker).
   *
   * Lê valor final via REF (não via useState updater — updater pode
   * ser chamado múltiplas vezes em React 18 concurrent / Strict Mode
   * e geraria múltiplos onChange).
   */
  const handlePointerUp = useCallback((ev: PointerEvent) => {
    const session = dragSessionRef.current;
    if (!session || ev.pointerId !== session.pointerId) return;

    dragSessionRef.current = null;
    detachDragListeners();

    const final = localMarkerRef.current ?? session.startMarker;

    if (
      final.x !== session.startMarker.x ||
      final.y !== session.startMarker.y ||
      final.r !== session.startMarker.r
    ) {
      onChangeRef.current(final);
    }
  }, []);

  const detachDragListeners = useCallback(() => {
    const { move, up } = handlersRef.current;
    if (move)
      document.removeEventListener("pointermove", move, { capture: true } as any);
    if (up) {
      document.removeEventListener("pointerup", up, { capture: true } as any);
      document.removeEventListener("pointercancel", up, { capture: true } as any);
    }
    handlersRef.current = { move: null, up: null };
  }, []);

  const attachDragListeners = useCallback(() => {
    if (handlersRef.current.move) return;
    handlersRef.current.move = handlePointerMove;
    handlersRef.current.up = handlePointerUp;
    document.addEventListener("pointermove", handlePointerMove, {
      capture: true,
    });
    document.addEventListener("pointerup", handlePointerUp, { capture: true });
    document.addEventListener("pointercancel", handlePointerUp, {
      capture: true,
    });
  }, [handlePointerMove, handlePointerUp]);

  const beginDrag = useCallback(
    (kind: DragKind, e: React.PointerEvent) => {
      if (disabled) return;
      // Não inicia drag se a imagem não tem dimensões naturais ainda
      // (não carregada). Aguarda o próximo clique.
      if (!imageRef.current || imageRef.current.naturalWidth === 0) return;

      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent && typeof e.nativeEvent.stopPropagation === "function") {
        e.nativeEvent.stopPropagation();
      }
      if (
        e.nativeEvent &&
        typeof (e.nativeEvent as any).stopImmediatePropagation === "function"
      ) {
        (e.nativeEvent as any).stopImmediatePropagation();
      }

      const containerEl = containerRef.current;
      if (!containerEl) return;

      // LÓGICO (offsetWidth/Height): imune a transform do pai.
      const logicalW = containerEl.offsetWidth;
      const logicalH = containerEl.offsetHeight;
      if (logicalW <= 0 || logicalH <= 0) return;

      // VISUAL (getBoundingClientRect): inclui transform do pai.
      // Usado só pra calcular hoverScale.
      const visualRect = containerEl.getBoundingClientRect();
      const hoverScale = visualRect.width / logicalW;

      const naturalW = imageRef.current.naturalWidth;
      const naturalH = imageRef.current.naturalHeight;

      const region = computeObjectCoverRegion(
        logicalW,
        logicalH,
        naturalW,
        naturalH,
      );

      const start = localMarkerRef.current ?? FALLBACK_MARKER;

      dragSessionRef.current = {
        kind,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startMarker: start,
        pointerId: e.pointerId,
        naturalW,
        naturalH,
        logicalW,
        logicalH,
        displayW: region.displayW,
        displayH: region.displayH,
        hoverScale,
      };

      try {
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      } catch {
        /* sem suporte — capture-phase listeners cobrem */
      }

      attachDragListeners();
    },
    [attachDragListeners, disabled, imageRef],
  );

  // Estilos dos elementos visuais. Recalculados quando marker ou
  // região mudam.
  const circleStyle = useMemo<React.CSSProperties>(
    () => ({
      position: "absolute",
      left: cx - r,
      top: cy - r,
      width: r * 2,
      height: r * 2,
      border: "3px solid #ef4444",
      backgroundColor: "rgba(239, 68, 68, 0.25)",
      borderRadius: "50%",
      pointerEvents: disabled ? "none" : "auto",
      cursor: disabled ? "default" : "move",
      boxSizing: "border-box",
      touchAction: "none",
      userSelect: "none",
      WebkitUserSelect: "none",
    }),
    [cx, cy, r, disabled],
  );

  const handleStyle: React.CSSProperties = {
    position: "absolute",
    left: cx + r - RESIZE_HANDLE_PX / 2,
    top: cy + r - RESIZE_HANDLE_PX / 2,
    width: RESIZE_HANDLE_PX,
    height: RESIZE_HANDLE_PX,
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    border: "3px solid #ef4444",
    cursor: disabled ? "default" : "nwse-resize",
    pointerEvents: disabled ? "none" : "auto",
    boxSizing: "border-box",
    touchAction: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
    boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
  };

  const handleHitStyle: React.CSSProperties = {
    position: "absolute",
    left: cx + r - HANDLE_HIT_PX / 2,
    top: cy + r - HANDLE_HIT_PX / 2,
    width: HANDLE_HIT_PX,
    height: HANDLE_HIT_PX,
    cursor: disabled ? "default" : "nwse-resize",
    pointerEvents: disabled ? "none" : "auto",
    backgroundColor: "transparent",
    touchAction: "none",
  };

  // Render. Quando canRender é false (imagem ainda não carregou ou
  // container sem tamanho), só monta o container invisível para que o
  // ResizeObserver possa medir; o marker visual não aparece.
  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
      aria-hidden={!disabled}
      onClick={(e) => {
        if (!disabled) e.stopPropagation();
      }}
    >
      {canRender && localMarker && (
        <>
          <div
            style={circleStyle}
            onPointerDown={(e) => beginDrag("move", e)}
            title="Arraste para mover o círculo"
          />
          {!disabled && (
            <>
              <div
                style={handleHitStyle}
                onPointerDown={(e) => beginDrag("resize", e)}
                title="Arraste para redimensionar"
              />
              <div
                style={handleStyle}
                onPointerDown={(e) => beginDrag("resize", e)}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default DamageMarkerOverlay;
