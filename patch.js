import fs from 'fs';

const file = 'c:/Users/Admin/Documents/projetos-dev/Mariah/codigo/mariah-prototipo-novo/src/pages/dashboard/GaleriaImagens.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add UploadingFile
content = content.replace(
  'const MAX_FILE_SIZE_MB = 15;\n\nexport default function GaleriaImagens() {',
  `const MAX_FILE_SIZE_MB = 15;\n\nexport interface UploadingFile {\n  id: string;\n  file: File;\n  previewUrl: string;\n  progress: number;\n  status: 'pending' | 'uploading' | 'done' | 'error';\n}\n\nexport default function GaleriaImagens() {`
);

// 2. Add UploadingFiles state and intersection observer
content = content.replace(
  `  // === Estado para imagens (do ambiente selecionado) ===
  const [imagens, setImagens] = useState<ImagemLaudo[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limit = 20;
  const [loadingImagens, setLoadingImagens] = useState(false);

  // === Estado para upload ===
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);`,
  `  // === Estado para imagens (do ambiente selecionado) ===
  const [imagens, setImagens] = useState<ImagemLaudo[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limit = 30; // alterado para 30 em infinite scroll
  const [loadingImagens, setLoadingImagens] = useState(false);

  // === Infinite Scroll Observer ===
  const loadingMoreRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastImageElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingImagens || loadingMoreRef.current) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && paginaAtual < totalPaginas && id && ambienteSelecionado) {
        fetchMoreImagens(paginaAtual + 1);
      }
    }, { rootMargin: '200px' });

    if (node) observerRef.current.observe(node);
  }, [loadingImagens, paginaAtual, totalPaginas, id, ambienteSelecionado]);

  // === Estado para upload ===
  const [uploading, setUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);`
);

// 3. Update fetch hooks and implement handleFileSelect
content = content.replace(
  `  // ========== CARREGAR IMAGENS DO AMBIENTE ==========
  const fetchImagensByAmbiente = async (page: number) => {
    if (!id || !ambienteSelecionado) return;
    try {
      setLoadingImagens(true);
      const res = await laudosService.getImagensByAmbiente(id, ambienteSelecionado.nomeAmbiente, page, limit);
      setImagens(res.data);
      setTotalPaginas(res.lastPage);
      setPaginaAtual(res.page);
    } catch (err: any) {
      console.error(err);
      toast.error("Não foi possível carregar as imagens.");
    } finally {
      setLoadingImagens(false);
    }
  };

  useEffect(() => {
    if (id && ambienteSelecionado) {
      fetchImagensByAmbiente(1);
    }
  }, [id, ambienteSelecionado]);

  // Carregar opções do select para edição rápida
  useEffect(() => {
    const fetchOpcoes = async () => {
      const tipo = ambienteSelecionado?.tipoAmbiente;
      if (tipo && !opcoesItensCache[tipo]) {
        try {
          const itensParentes = await ambientesService.getItensPorNomeEnv(tipo);
          if (itensParentes && Array.isArray(itensParentes)) {
            setOpcoesItensCache(prev => ({
              ...prev,
              [tipo]: itensParentes.map((i: any) => i.nome)
            }));
          }
        } catch (err) {
          console.error("Erro ao puxar opções de itens", err);
        }
      }
    };
    if (ambienteSelecionado) fetchOpcoes();
  }, [ambienteSelecionado]);

  const handleUpdateItem = async (imgId: string, novoItem: string) => {
    if (!novoItem) return;
    try {
      setLoadingItemChange(imgId);
      await laudosService.updateImagemMetadata(imgId, { tipo: novoItem });
      setImagens(prev => prev.map(img => img.id === imgId ? { ...img, tipo: novoItem } : img));
      toast.success("Item classificado com sucesso!");
    } catch (err) {
      toast.error("Erro ao atualizar o item da imagem.");
    } finally {
      setLoadingItemChange(null);
    }
  };

  // ========== UPLOAD DE IMAGENS ==========
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !id || !ambienteSelecionado) return;

    // Verificar créditos
    try {
      const limitCheck = await laudosService.checkUploadLimit(files.length);
      if (!limitCheck.canUpload) {
        toast.error(limitCheck.message || 'Limite de imagens esgotado');
        return;
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao verificar créditos');
      return;
    }

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.warning(\`"\${file.name}" excede \${MAX_FILE_SIZE_MB}MB e foi ignorado\`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        toast.warning(\`"\${file.name}" não é uma imagem válida\`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: validFiles.length });
    let uploaded = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        // 1. Presigned URL
        const { uploadUrl, s3Key } = await laudosService.getPresignedUrl(id, file.name);

        // 2. Upload para S3
        const uploadResp = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': 'image/jpeg' },
        });

        if (!uploadResp.ok) throw new Error('Falha no upload para S3');

        // 3. Confirmar no backend (SEM classificação IA - fica 'Não identificado')
        await laudosService.confirmWebUpload({
          laudoId: id,
          s3Key,
          ambiente: ambienteSelecionado.nomeAmbiente,
          tipoAmbiente: ambienteSelecionado.tipoAmbiente,
          tipo: 'Não identificado',
          categoria: 'VISTORIA',
          ordem: i,
        });

        uploaded++;
        setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
      } catch (err: any) {
        console.error(\`Erro ao upload imagem \${i}:\`, err);
        toast.error(\`Erro ao enviar "\${file.name}"\`);
      }
    }

    setUploading(false);
    // Limpar input
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (uploaded > 0) {
      toast.success(\`\${uploaded} imagens enviadas com sucesso!\`);
      // Recarregar imagens e ambientes
      fetchImagensByAmbiente(1);
      fetchAmbientes();
      if (refreshUser) refreshUser();
    }
  };`,
  `  // ========== CARREGAR IMAGENS DO AMBIENTE ==========
  const fetchImagensByAmbiente = async (page: number) => {
    if (!id || !ambienteSelecionado) return;
    try {
      setLoadingImagens(true);
      const res = await laudosService.getImagensByAmbiente(id, ambienteSelecionado.nomeAmbiente, page, limit);
      // Sempre recarrega na pag 1 ou insere no final se infinite scroll chamou
      if (page === 1) {
        setImagens(res.data);
      } else {
        setImagens(prev => {
          const newMap = new Map();
          [...prev, ...res.data].forEach(img => newMap.set(img.id, img));
          return Array.from(newMap.values());
        });
      }
      setTotalPaginas(res.lastPage);
      setPaginaAtual(res.page);
    } catch (err: any) {
      console.error(err);
      toast.error("Não foi possível carregar as imagens.");
    } finally {
      setLoadingImagens(false);
    }
  };

  // Definindo a fetchMoreImagens
  const fetchMoreImagens = async (page: number) => {
    if (!id || !ambienteSelecionado || loadingMoreRef.current) return;
    try {
      loadingMoreRef.current = true;
      const res = await laudosService.getImagensByAmbiente(id, ambienteSelecionado.nomeAmbiente, page, limit);
      setImagens(prev => {
        const newMap = new Map();
        [...prev, ...res.data].forEach((img: ImagemLaudo) => newMap.set(img.id, img));
        return Array.from(newMap.values());
      });
      setTotalPaginas(res.lastPage);
      setPaginaAtual(res.page);
    } catch (err: any) {
      toast.error("Erro ao carregar mais imagens.");
    } finally {
      loadingMoreRef.current = false;
    }
  };

  useEffect(() => {
    if (id && ambienteSelecionado) {
      fetchImagensByAmbiente(1);
    }
  }, [id, ambienteSelecionado]);

  // Carregar opções do select para edição rápida
  useEffect(() => {
    const fetchOpcoes = async () => {
      const tipo = ambienteSelecionado?.tipoAmbiente;
      if (tipo && !opcoesItensCache[tipo]) {
        try {
          const itensParentes = await ambientesService.getItensPorNomeEnv(tipo);
          if (itensParentes && Array.isArray(itensParentes)) {
            setOpcoesItensCache(prev => ({
              ...prev,
              [tipo]: itensParentes.map((i: any) => i.nome)
            }));
          }
        } catch (err) {
          console.error("Erro ao puxar opções de itens", err);
        }
      }
    };
    if (ambienteSelecionado) fetchOpcoes();
  }, [ambienteSelecionado]);

  const handleUpdateItem = async (imgId: string, novoItem: string) => {
    if (!novoItem) return;
    try {
      setLoadingItemChange(imgId);
      await laudosService.updateImagemMetadata(imgId, { tipo: novoItem });
      setImagens(prev => prev.map(img => img.id === imgId ? { ...img, tipo: novoItem } : img));
      toast.success("Item classificado com sucesso!");
    } catch (err) {
      toast.error("Erro ao atualizar o item da imagem.");
    } finally {
      setLoadingItemChange(null);
    }
  };

  // ========== UPLOAD CONCORRENTE E TRACKING ==========
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !id || !ambienteSelecionado) return;

    if (files.length > 100) {
      toast.error("Não é possível arrastar/selecionar mais que 100 imagens de uma vez. Por favor, fracione o envio.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Verificar créditos e limites com a API
    try {
      const limitCheck = await laudosService.checkUploadLimit(files.length);
      if (!limitCheck.canUpload) {
        toast.error(limitCheck.message || 'Limite de imagens esgotado');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao verificar os limites de envio local');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.warning(\`"\${file.name}" excede \${MAX_FILE_SIZE_MB}MB e foi ignorado.\`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        toast.warning(\`"\${file.name}" não é suportado.\`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Constrói os placeholders temporários com URL invisível e empurra no array
    const pendingUploads: UploadingFile[] = validFiles.map((file, i) => ({
      id: \`local_\${Date.now()}_\${i}\`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
    }));

    // Mostra pendentes logo de cara na UX
    setUploadingFiles(prev => [...pendingUploads, ...prev]);
    setUploading(true);
    setUploadProgress({ current: 0, total: pendingUploads.length });

    let successfullyUploaded = 0;
    const maxConcurrentUploads = 5;
    let currentIndex = 0;

    // Worker que pega e envia arquivos em sequência livre
    const processNextUpload = async (): Promise<void> => {
      // Usando uma arrow function que captura o estado atual para acessar a lista sem hooks de estado de componente
      if (currentIndex >= pendingUploads.length) return;
      
      const index = currentIndex++;
      const uploadItem = pendingUploads[index];

      setUploadingFiles(prev => prev.map(f => f.id === uploadItem.id ? { ...f, status: 'uploading' } : f));

      try {
        const { uploadUrl, s3Key } = await laudosService.getPresignedUrl(id, uploadItem.file.name);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl, true);
          xhr.setRequestHeader('Content-Type', 'image/jpeg');
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadingFiles(prev => prev.map(f => f.id === uploadItem.id ? { ...f, progress } : f));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(\`Erro HTTP: \${xhr.status}\`));
          };
          
          xhr.onerror = () => reject(new Error('S3 CORS/Conexão falhou'));
          xhr.send(uploadItem.file);
        });

        await laudosService.confirmWebUpload({
          laudoId: id,
          s3Key,
          ambiente: ambienteSelecionado.nomeAmbiente,
          tipoAmbiente: ambienteSelecionado.tipoAmbiente,
          tipo: 'Não identificado',
          categoria: 'VISTORIA',
          ordem: index,
        });

        successfullyUploaded++;
        setUploadProgress(prev => ({ ...prev, current: successfullyUploaded }));
        setUploadingFiles(prev => prev.map(f => f.id === uploadItem.id ? { ...f, status: 'done', progress: 100 } : f));
      } catch (err: any) {
        console.error(\`Falha upload [\${uploadItem.file.name}]:\`, err);
        setUploadingFiles(prev => prev.map(f => f.id === uploadItem.id ? { ...f, status: 'error', progress: 0 } : f));
      }

      await processNextUpload();
    };

    const workers = Array.from({ length: Math.min(maxConcurrentUploads, pendingUploads.length) }).map(() => processNextUpload());
    await Promise.all(workers);

    if (fileInputRef.current) fileInputRef.current.value = '';

    // Revoga memory de previews
    setUploadingFiles(prev => {
      prev.forEach(f => {
        if (f.status === 'done') URL.revokeObjectURL(f.previewUrl);
      });
      return prev.filter(f => f.status !== 'done');
    });

    if (successfullyUploaded > 0) {
      toast.success(\`\${successfullyUploaded} imagens carregadas com sucesso!\`);
      fetchImagensByAmbiente(1); // recarrega 1 de novo
      fetchAmbientes();
      if (refreshUser) refreshUser();
    }
    setUploading(false);
  };`
);


// 4. Update the Grid rendering (Replace mapping imagens directly to include uploadingFiles)
content = content.replace(
  `<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {imagens.map((img, index) => (`,
  `<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {/* Uploading Placeholders */}
                  {uploadingFiles.map((file, index) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm border border-blue-500/50"
                    >
                      <img
                        src={file.previewUrl}
                        alt="Uploading preview"
                        className="w-full h-full object-cover opacity-60"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/40">
                        {file.status === 'error' ? (
                          <>
                            <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                            <span className="text-white text-xs text-center font-bold">Erro no envio</span>
                          </>
                        ) : (
                          <>
                            <div className="w-full h-2 bg-gray-200/30 rounded-full mb-2 overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: \`\${file.progress}%\` }}></div>
                            </div>
                            <span className="text-white text-xs font-bold drop-shadow-md">{file.progress}% enviado</span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Imagens Salvas */}
                  {imagens.map((img, index) => (`
);

// 5. Update pagination (Remove buttons, add Ref to the last element of Imagens)
content = content.replace(
  `                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Paginação de Imagens */}
                {totalPaginas > 1 && (
                  <div className="flex justify-center mt-8 gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePageChangeImagens(paginaAtual - 1)} disabled={paginaAtual === 1}>
                      Anterior
                    </Button>
                    <span className="flex items-center px-4 text-sm text-[var(--text-secondary)]">
                      Página {paginaAtual} de {totalPaginas}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => handlePageChangeImagens(paginaAtual + 1)} disabled={paginaAtual === totalPaginas}>
                      Próxima
                    </Button>
                  </div>
                )}
              </>
            )}`,
  `                      </div>
                    </motion.div>
                  ))}
                  {/* Div Injetada para acender o Scroll Infinito */}
                  <div ref={lastImageElementRef} className="h-10 w-full col-span-full"></div>
                </div>

                {loadingMoreRef.current && (
                  <div className="flex justify-center mt-4 border-t-2 w-full pt-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2">Carregando próximas imagens...</span>
                  </div>
                )}
              </>
            )}`
);

fs.writeFileSync('c:/Users/Admin/Documents/projetos-dev/Mariah/codigo/mariah-prototipo-novo/src/pages/dashboard/GaleriaImagens.tsx', content);
console.log('File successfully updated with node script');
