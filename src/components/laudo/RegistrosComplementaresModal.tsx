import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Trash2, Loader2, Image as ImageIcon, AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";

import Button from "../ui/Button";
import { laudosService } from "../../services/laudos";

interface UploadedImage {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  legenda: string;
  imagemId?: string;
  errorMessage?: string;
}

interface RegistrosComplementaresModalProps {
  laudoId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MAX_IMAGES = 50;
const MAX_LEGENDA = 500;
const MAX_FILE_SIZE_MB = 15;

/**
 * Modal de "Registros complementares" (contestação).
 * - Aparece apenas para laudos concluídos (gated no pai).
 * - Pode ser enviado UMA ÚNICA VEZ por laudo (backend rejeita segunda chamada).
 * - Exige pelo menos UMA imagem, e CADA imagem precisa ter legenda.
 *   A legenda individual é renderizada no PDF junto da foto.
 */
export default function RegistrosComplementaresModal({
  laudoId,
  isOpen,
  onClose,
  onSuccess,
}: RegistrosComplementaresModalProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpa URLs de preview ao desmontar (evita memory leak)
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      setImages([]);
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Máximo de ${MAX_IMAGES} imagens nos registros complementares.`);
      return;
    }

    const newImages: UploadedImage[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.warning(`"${file.name}" excede ${MAX_FILE_SIZE_MB}MB e foi ignorado`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        toast.warning(`"${file.name}" não é uma imagem válida`);
        continue;
      }
      newImages.push({
        file,
        preview: URL.createObjectURL(file),
        status: "pending",
        legenda: "",
      });
    }

    setImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  };

  const updateLegenda = (index: number, value: string) => {
    setImages((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], legenda: value.slice(0, MAX_LEGENDA) };
      return copy;
    });
  };

  /**
   * Faz upload + confirm de CADA imagem (em paralelo onde dá) e devolve a
   * lista de IDs. Cada imagem precisa de legenda válida — sem isso, o
   * backend rejeita o confirm e retornamos erro aqui.
   *
   * IMPORTANTE: imagens complementares (registros complementares /
   * contestação) NÃO pertencem a nenhum ambiente e portanto NÃO devem
   * popular a página "AMBIENTES" do laudo. Por isso usamos exclusivamente
   * os endpoints `/contestacao/*` (tabela `contestacao_imagens`,
   * isolada). Nunca chamar `confirmWebUpload` aqui — isso escreveria em
   * `imagens_laudo` e criaria entradas fantasma de ambiente.
   */
  const uploadAllImages = useCallback(async (): Promise<string[]> => {
    const snapshots = images; // trava a lista atual

    // Pré-validação: legenda obrigatória em TODAS as imagens, ANTES de gastar
    // banda com upload.
    for (let i = 0; i < snapshots.length; i++) {
      const legenda = snapshots[i].legenda.trim();
      if (!legenda) {
        throw new Error(
          `A foto ${i + 1} está sem legenda. Preencha a legenda de todas as fotos antes de enviar.`,
        );
      }
    }

    const ids: string[] = new Array(snapshots.length).fill("");
    const errors: { idx: number; msg: string }[] = [];

    // Marca todas como uploading de uma vez (UX mais clara que uma por uma)
    setImages((prev) =>
      prev.map((img) =>
        img.status === "done" ? img : { ...img, status: "uploading" },
      ),
    );

    // Processa em paralelo — uploads independentes, mas se algum falhar
    // ainda seguimos tentando os outros para deixar o usuário ver todos os
    // erros de uma vez.
    await Promise.all(
      snapshots.map(async (img, i) => {
        if (img.status === "done" && img.imagemId) {
          ids[i] = img.imagemId;
          return;
        }

        const legenda = img.legenda.trim();
        try {
          const { uploadUrl, s3Key } = await laudosService.getContestacaoPresignedUrl(
            laudoId,
            img.file.name,
          );

          const uploadResp = await fetch(uploadUrl, {
            method: "PUT",
            body: img.file,
            headers: { "Content-Type": "image/jpeg" },
          });

          if (!uploadResp.ok) {
            throw new Error(`Falha no upload para o S3 (HTTP ${uploadResp.status})`);
          }

          const { id } = await laudosService.confirmContestacaoUpload(
            laudoId,
            s3Key,
            i,
            legenda,
          );

          ids[i] = id;
          setImages((prev) => {
            const c = [...prev];
            if (c[i]) {
              c[i] = { ...c[i], status: "done", imagemId: id };
            }
            return c;
          });
        } catch (err: any) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Erro no upload da imagem";
          errors.push({ idx: i, msg });
          setImages((prev) => {
            const c = [...prev];
            if (c[i]) {
              c[i] = { ...c[i], status: "error", errorMessage: msg };
            }
            return c;
          });
        }
      }),
    );

    if (errors.length > 0) {
      const idxs = errors.map((e) => e.idx + 1).join(", ");
      throw new Error(
        `Falha no upload das fotos ${idxs}. Remova-as ou corrija e tente novamente.`,
      );
    }

    return ids;
  }, [images, laudoId]);

  const handleSubmit = async () => {
    if (images.length === 0) {
      toast.error("Adicione pelo menos uma foto antes de enviar.");
      return;
    }

    const semLegenda = images.findIndex((img) => !img.legenda.trim());
    if (semLegenda >= 0) {
      toast.error(`A foto ${semLegenda + 1} está sem legenda. Preencha todas antes de enviar.`);
      return;
    }

    const hasErrors = images.some((img) => img.status === "error");
    if (hasErrors) {
      toast.error("Remova as imagens com erro antes de enviar.");
      return;
    }

    // `pending` é o estado INICIAL (recém-adicionada, ainda não tentou subir).
    // Só `uploading` bloqueia aqui — `pending` é exatamente o estado que o
    // usuário QUER enviar.
    const hasUploading = images.some((img) => img.status === "uploading");
    if (hasUploading) {
      toast.error("Aguarde o upload das fotos terminar.");
      return;
    }

    setSubmitting(true);
    try {
      await uploadAllImages();
      // Submit final: backend lê as imagens já confirmadas e trava a contestação.
      await laudosService.submitContestacao(laudoId);
      toast.success("Registros complementares enviados com sucesso!");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Erro ao enviar registros complementares";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Regra do botão: precisa de ≥1 imagem e todas com legenda preenchida.
  // `pending` é o estado INICIAL (recém-adicionada, ainda não tentou subir),
  // então NÃO bloqueia o envio — só `uploading` e `error` bloqueiam.
  const canSubmit =
    !submitting &&
    images.length > 0 &&
    images.every((img) => img.legenda.trim().length > 0) &&
    !images.some(
      (img) => img.status === "uploading" || img.status === "error",
    );

  // Motivo pelo qual o botão está desabilitado — usado como dica visual.
  const disabledReason = (() => {
    if (submitting) return "Enviando...";
    if (images.length === 0) return "Adicione pelo menos uma foto.";
    const semLegenda = images.some((img) => !img.legenda.trim());
    if (semLegenda) return "Preencha a legenda de todas as fotos.";
    if (images.some((img) => img.status === "uploading"))
      return "Aguarde o upload das fotos terminar.";
    if (images.some((img) => img.status === "error"))
      return "Remova as fotos com erro antes de enviar.";
    return null;
  })();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
        onClick={() => !submitting && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border-color)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 p-6 border-b border-[var(--border-color)]">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  Registros complementares
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Você poderá enviar estes registros apenas{" "}
                  <strong>uma única vez</strong>. Adicione fotos e preencha a
                  legenda de cada uma. O conteúdo será incluído no laudo em
                  PDF, antes das assinaturas.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              disabled={submitting}
              className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] disabled:opacity-50"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {/* Upload */}
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                Fotos <span className="text-red-500">*</span>
              </label>
              <div
                className="border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors group"
                onClick={() => !submitting && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={submitting}
                />
                <Upload className="w-10 h-10 mx-auto mb-2 text-[var(--text-secondary)] group-hover:text-primary group-hover:scale-110 transition-all" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Clique para selecionar fotos
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Até {MAX_IMAGES} imagens, {MAX_FILE_SIZE_MB}MB cada. A
                  legenda de cada uma é obrigatória.
                </p>
              </div>

              {images.length > 0 && (
                <div className="mt-4 space-y-3">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                    >
                      {/* Thumbnail */}
                      <div className="relative shrink-0 w-24 h-24 rounded-md overflow-hidden bg-[var(--bg-secondary)]">
                        <img
                          src={img.preview}
                          alt={`Imagem ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {img.status === "uploading" && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          </div>
                        )}
                        {img.status === "done" && (
                          <div className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </div>
                        )}
                        {img.status === "error" && (
                          <div
                            className="absolute top-1 left-1"
                            title={img.errorMessage}
                          >
                            <AlertCircle className="w-5 h-5 text-red-500 drop-shadow-lg" />
                          </div>
                        )}
                      </div>

                      {/* Legenda + controles */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <label
                            htmlFor={`legenda-${idx}`}
                            className="text-xs font-semibold text-[var(--text-primary)]"
                          >
                            Legenda da foto {idx + 1}{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            disabled={submitting || img.status === "uploading"}
                            className="text-xs text-red-500 hover:text-red-400 inline-flex items-center gap-1 disabled:opacity-50"
                            title="Remover imagem"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remover
                          </button>
                        </div>
                        <input
                          id={`legenda-${idx}`}
                          type="text"
                          value={img.legenda}
                          onChange={(e) => updateLegenda(idx, e.target.value)}
                          maxLength={MAX_LEGENDA}
                          disabled={submitting || img.status === "uploading"}
                          placeholder="Ex.: Trinco da porta do banheiro apresenta oxidação"
                          className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
                        />
                        <div className="flex justify-between mt-1 text-[10px] text-[var(--text-secondary)]">
                          <span>
                            {img.legenda.trim()
                              ? "Será exibida no PDF junto da imagem."
                              : "Obrigatória — não é possível enviar sem legenda."}
                          </span>
                          <span>{img.legenda.length}/{MAX_LEGENDA}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-6 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
            <div className="text-xs text-[var(--text-secondary)] hidden sm:block">
              {images.length > 0 && (
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" />
                  {images.length} {images.length === 1 ? "imagem" : "imagens"} —{" "}
                  {images.filter((i) => i.legenda.trim()).length}/{images.length} com legenda
                </span>
              )}
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                title={disabledReason ?? "Enviar registros complementares"}
                aria-label={disabledReason ?? "Enviar registros complementares"}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border-0 shadow-lg transition-all duration-200 ${
                  canSubmit
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-purple-500/30 cursor-pointer"
                    : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)] shadow-none cursor-not-allowed opacity-60"
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Enviar registros complementares
                  </>
                )}
              </button>
            </div>
            {disabledReason && !submitting && (
              <div className="w-full text-center text-xs text-[var(--text-secondary)] mt-2 sm:hidden">
                {disabledReason}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}