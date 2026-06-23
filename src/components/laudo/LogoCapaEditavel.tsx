import { useRef, useState } from "react";

// A4 de referência em px @ 96dpi. As coordenadas/dimensões da logo são
// armazenadas neste sistema para que o preview e o PDF (backend) coincidam.
export const A4_REF_WIDTH = 794;
export const A4_REF_HEIGHT = 1123;

// Defaults — DEVEM ser idênticos ao backend (LOGO_CAPA_DEFAULT em pdf.service.ts).
export const LOGO_CAPA_DEFAULT = {
  largura: 130,
  x: 588,
  y: 8,
};

const MIN_LARGURA = 30;
// A capa tem borda superior de 8px (dentro do box-sizing border-box), então a
// área útil vertical para posicionamento absoluto é a altura A4 menos a borda.
const BORDER_TOP = 8;
const PAGE_W = A4_REF_WIDTH;
const PAGE_H = A4_REF_HEIGHT - BORDER_TOP;

export interface LogoCapaValue {
  mostrar: boolean;
  x: number | null;
  y: number | null;
  largura: number | null;
  altura: number | null;
}

interface Props {
  /** URL da foto de perfil/logo. Se ausente, mostra um aviso. */
  src?: string | null;
  value: LogoCapaValue;
  onChange: (patch: Partial<LogoCapaValue>) => void;
  /** No preview = true (arrastável). No PDF real isso não é usado. */
  editable?: boolean;
}

type Corner = "nw" | "ne" | "sw" | "se";

export default function LogoCapaEditavel({
  src,
  value,
  onChange,
  editable = true,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);

  const effX = value.x ?? LOGO_CAPA_DEFAULT.x;
  const effY = value.y ?? LOGO_CAPA_DEFAULT.y;
  const effLargura = value.largura ?? LOGO_CAPA_DEFAULT.largura;
  // Se altura ainda não foi definida, deixamos "auto" (proporção natural da imagem).
  const alturaCss = value.altura != null ? `${value.altura}px` : "auto";

  // Sem foto: aviso discreto no lugar da logo.
  if (!src) {
    if (!editable) return null;
    return (
      <div
        style={{
          position: "absolute",
          left: LOGO_CAPA_DEFAULT.x,
          top: LOGO_CAPA_DEFAULT.y,
          width: LOGO_CAPA_DEFAULT.largura,
          height: 60,
          border: "1px dashed #c0c0c0",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontSize: 8,
          color: "#9ca3af",
          padding: 4,
          zIndex: 5,
          userSelect: "none",
        }}
        title="Adicione uma foto de perfil em Meu Perfil para exibi-la aqui"
      >
        Adicione uma foto de perfil para exibir a logo aqui
      </div>
    );
  }

  // Logo oculta: botão para reexibir.
  if (value.mostrar === false) {
    if (!editable) return null;
    return (
      <button
        type="button"
        onClick={() => onChange({ mostrar: true })}
        style={{
          position: "absolute",
          left: LOGO_CAPA_DEFAULT.x,
          top: LOGO_CAPA_DEFAULT.y,
          fontSize: 9,
          color: "#4338ca",
          background: "#eef2ff",
          border: "1px dashed #818cf8",
          borderRadius: 4,
          padding: "4px 8px",
          cursor: "pointer",
          zIndex: 5,
        }}
      >
        + Mostrar logo
      </button>
    );
  }

  // ---- Gestos (mover / redimensionar) ----
  const getScale = () => {
    const box = boxRef.current;
    if (!box || !box.offsetWidth) return 1;
    return box.getBoundingClientRect().width / box.offsetWidth;
  };

  const startMove = (e: React.PointerEvent) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    const box = boxRef.current;
    if (!box) return;

    const scale = getScale();
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = effX;
    const startY = effY;
    const w = box.offsetWidth;
    const h = box.offsetHeight;
    setDragging(true);

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startClientX) / scale;
      const dy = (ev.clientY - startClientY) / scale;
      // Mantém a logo sempre dentro dos limites da página (não pode sair do PDF).
      const x = Math.min(Math.max(0, startX + dx), Math.max(0, PAGE_W - w));
      const y = Math.min(Math.max(0, startY + dy), Math.max(0, PAGE_H - h));
      onChange({ x, y });
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const startResize = (corner: Corner) => (e: React.PointerEvent) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    const box = boxRef.current;
    if (!box) return;

    const scale = getScale();
    const startClientX = e.clientX;
    const startLargura = box.offsetWidth;
    const startAltura = box.offsetHeight;
    const ratio = startAltura / startLargura; // mantém proporção travada
    const startX = effX;
    const startY = effY;
    setDragging(true);

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startClientX) / scale;
      // Direção do crescimento horizontal por canto
      const cresce = corner === "se" || corner === "ne" ? dx : -dx;

      // Largura máxima que mantém a caixa inteira dentro da página, considerando
      // qual canto está ancorado (o oposto fica fixo) e a proporção travada.
      let maxLargura: number;
      if (corner === "se") {
        maxLargura = Math.min(PAGE_W - startX, (PAGE_H - startY) / ratio);
      } else if (corner === "sw") {
        maxLargura = Math.min(startX + startLargura, (PAGE_H - startY) / ratio);
      } else if (corner === "ne") {
        maxLargura = Math.min(PAGE_W - startX, (startY + startAltura) / ratio);
      } else {
        // nw
        maxLargura = Math.min(
          startX + startLargura,
          (startY + startAltura) / ratio
        );
      }

      let largura = startLargura + cresce;
      largura = Math.max(MIN_LARGURA, Math.min(largura, maxLargura));
      const altura = largura * ratio;

      let x = startX;
      let y = startY;
      // Ancoragem: o canto oposto fica fixo
      if (corner === "nw" || corner === "sw") {
        x = startX + (startLargura - largura);
      }
      if (corner === "nw" || corner === "ne") {
        y = startY + (startAltura - altura);
      }
      // Segurança extra contra arredondamentos
      x = Math.max(0, Math.min(x, PAGE_W - largura));
      y = Math.max(0, Math.min(y, PAGE_H - altura));
      onChange({ x, y, largura, altura });
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleStyle = (corner: Corner): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute",
      width: 10,
      height: 10,
      background: "#6f2f9e",
      border: "1px solid #fff",
      borderRadius: 2,
      zIndex: 7,
    };
    const off = -5;
    if (corner === "nw")
      return { ...base, left: off, top: off, cursor: "nwse-resize" };
    if (corner === "ne")
      return { ...base, right: off, top: off, cursor: "nesw-resize" };
    if (corner === "sw")
      return { ...base, left: off, bottom: off, cursor: "nesw-resize" };
    return { ...base, right: off, bottom: off, cursor: "nwse-resize" };
  };

  const mostrarControles = editable && (hover || dragging);

  return (
    <div
      ref={boxRef}
      onPointerDown={startMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "absolute",
        left: effX,
        top: effY,
        width: effLargura,
        height: alturaCss,
        zIndex: 5,
        cursor: editable ? (dragging ? "grabbing" : "grab") : "default",
        outline: mostrarControles ? "1px dashed #6f2f9e" : "1px solid transparent",
        outlineOffset: 2,
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <img
        src={src}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          pointerEvents: "none",
        }}
        alt="Logo da capa"
      />

      {mostrarControles && (
        <>
          {(["nw", "ne", "sw", "se"] as Corner[]).map((c) => (
            <div
              key={c}
              onPointerDown={startResize(c)}
              style={handleStyle(c)}
            />
          ))}
          {/* Botão ocultar */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onChange({ mostrar: false });
            }}
            title="Ocultar logo"
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#dc2626",
              color: "#fff",
              border: "1px solid #fff",
              fontSize: 11,
              lineHeight: "16px",
              textAlign: "center",
              cursor: "pointer",
              padding: 0,
              zIndex: 8,
            }}
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}
