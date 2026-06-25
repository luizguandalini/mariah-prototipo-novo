import { useRef } from "react";

interface RodapeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  /** Label exibido acima do campo. */
  label?: string;
  /** Texto de ajuda exibido abaixo do campo. */
  helpText?: string;
  /** Quantidade de linhas do textarea. */
  rows?: number;
  /** Quando true, esconde a pré-visualização. */
  hidePreview?: boolean;
}

/**
 * Editor didático para o rodapé do laudo.
 *
 * Recursos visíveis:
 *  - Botão "↵ Quebrar linha" que insere uma quebra de linha (\n) na posição
 *    atual do cursor (didático para usuários que não sabem que Enter funciona).
 *  - Pré-visualização ao vivo de como o rodapé vai aparecer no PDF (com as
 *    quebras de linha respeitadas), centralizada como no rodapé real.
 *  - Contador de caracteres restantes.
 */
export default function RodapeEditor({
  value,
  onChange,
  placeholder = "Ex: Promove Vistorias | Edifício Empresarial D/Office - Rua Orense, 41, Sala 1108, Centro - Diadema\n11 4210-5412\nwww.promovesolucoes.com.br",
  maxLength = 500,
  className = "",
  label = "Rodapé do Laudo",
  helpText =
    'Texto exibido como rodapé em todas as páginas do PDF gerado. Use o botão "↵ Quebrar linha" ou tecle Enter para criar múltiplas linhas.',
  rows = 3,
  hidePreview = false,
}: RodapeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertLineBreak = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const newValue = value.substring(0, start) + "\n" + value.substring(end);
    onChange(newValue);
    // Restaura o foco e posiciona o cursor logo após o \n inserido.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + 1, start + 1);
    });
  };

  const lineCount = value ? value.split("\n").length : 0;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <label className="block text-sm font-bold text-[var(--text-secondary)]">
          {label}
        </label>
        <button
          type="button"
          onClick={insertLineBreak}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md border-2 border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-white hover:border-primary transition-colors"
          title="Insere uma quebra de linha (Enter) na posição atual do cursor"
        >
          <span className="text-base leading-none">↵</span>
          Quebrar linha
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all resize-y"
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
      />

      <div className="flex justify-between items-start mt-2 gap-4">
        <p className="text-xs text-[var(--text-secondary)] opacity-70 flex-1">
          {helpText}
        </p>
        <span
          className={`text-xs whitespace-nowrap ${
            value.length > maxLength - 50
              ? "text-amber-600 font-semibold"
              : "text-[var(--text-secondary)] opacity-70"
          }`}
        >
          {value.length}/{maxLength}
          {lineCount > 1 && (
            <span className="ml-2 opacity-70">• {lineCount} linhas</span>
          )}
        </span>
      </div>

      {/* Pré-visualização ao vivo: mostra como o rodapé vai aparecer no PDF. */}
      {!hidePreview && value && (
        <div className="mt-3">
          <div className="text-[10px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider opacity-70">
            👁 Pré-visualização do rodapé (como aparece no PDF)
          </div>
          <div
            className="px-4 py-3 bg-[var(--bg-primary)] border-2 border-dashed border-[var(--border-color)] rounded-lg"
            style={{
              fontFamily: '"Roboto", Arial, sans-serif',
              fontSize: "10px",
              color: "#555",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: "8mm",
              }}
            >
              <div
                style={{
                  flex: "1 1 auto",
                  textAlign: "center",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {value}
              </div>
              <div style={{ flex: "0 0 auto" }}>1</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}