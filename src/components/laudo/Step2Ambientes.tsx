import { useState, useEffect, useRef, useCallback } from 'react'
import Button from '../ui/Button'
import { ambientesService } from '../../services/ambientes'
import { toast } from 'sonner'
import { Search, Plus, Trash2, FolderOpen, Loader2, ChevronDown } from 'lucide-react'

interface AmbienteFolder {
  id: string
  tipoAmbiente: string
  nomeAmbiente: string
  ordem: number
}

interface Step2Props {
  onNext: (data: any) => void
  onBack: () => void
  initialData?: AmbienteFolder[]
  vistoriaInfo?: any
}

export default function Step2Ambientes({ onNext, onBack, initialData = [], vistoriaInfo = {} }: Step2Props) {
  const [ambientes, setAmbientes] = useState<AmbienteFolder[]>(
    initialData.length > 0 ? initialData : []
  )

  // Estados do seletor de tipo de ambiente
  const [showSelector, setShowSelector] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [tiposDisponiveis, setTiposDisponiveis] = useState<{ nome: string; tiposUso: string[]; tiposImovel: string[] }[]>([])
  const [loadingTipos, setLoadingTipos] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const LIMIT = 20

  // Estado para nomear o ambiente
  const [selectedTipo, setSelectedTipo] = useState<string>('')
  const [nomeAmbiente, setNomeAmbiente] = useState('')
  const [showNomeInput, setShowNomeInput] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Carregar tipos ao abrir seletor
  const loadTipos = useCallback(async (search: string, newOffset: number, append = false) => {
    try {
      setLoadingTipos(true)
      const result = await ambientesService.listarNomesPaginado(
        LIMIT,
        newOffset,
        search || undefined,
        vistoriaInfo?.tipoUso || undefined,
        vistoriaInfo?.tipoImovel || undefined,
      )
      if (append) {
        setTiposDisponiveis(prev => [...prev, ...result.data])
      } else {
        setTiposDisponiveis(result.data)
      }
      setHasMore(result.hasMore)
      setTotal(result.total)
      setOffset(newOffset)
    } catch (err) {
      console.error('Erro ao carregar tipos de ambiente:', err)
      toast.error('Erro ao carregar tipos de ambiente')
    } finally {
      setLoadingTipos(false)
    }
  }, [vistoriaInfo?.tipoUso, vistoriaInfo?.tipoImovel])

  // Abrir seletor
  const openSelector = () => {
    setShowSelector(true)
    setSearchTerm('')
    setOffset(0)
    loadTipos('', 0)
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  // Pesquisa com debounce
  useEffect(() => {
    if (!showSelector) return

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadTipos(searchTerm, 0)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [searchTerm, showSelector, loadTipos])

  // Scroll infinito
  const handleScroll = () => {
    if (!listRef.current || loadingTipos || !hasMore) return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadTipos(searchTerm, offset + LIMIT, true)
    }
  }

  // Selecionar tipo de ambiente
  const handleSelectTipo = (tipo: string) => {
    setSelectedTipo(tipo)
    setShowSelector(false)
    setShowNomeInput(true)

    // Sugerir nome padrão
    const count = ambientes.filter(a => a.tipoAmbiente === tipo).length + 1
    setNomeAmbiente(`${count} - ${tipo}`)
  }

  // Confirmar criação da pasta
  const handleConfirmAmbiente = () => {
    if (!nomeAmbiente.trim()) {
      toast.error('Informe um nome para o ambiente')
      return
    }

    // Verifica duplicidade
    const exists = ambientes.some(a => a.nomeAmbiente === nomeAmbiente.trim())
    if (exists) {
      toast.error('Já existe um ambiente com este nome')
      return
    }

    const newAmbiente: AmbienteFolder = {
      id: `amb-${Date.now()}`,
      tipoAmbiente: selectedTipo,
      nomeAmbiente: nomeAmbiente.trim(),
      ordem: ambientes.length,
    }

    setAmbientes(prev => [...prev, newAmbiente])
    setShowNomeInput(false)
    setSelectedTipo('')
    setNomeAmbiente('')
    toast.success(`Ambiente "${newAmbiente.nomeAmbiente}" criado!`)
  }

  const handleRemoveAmbiente = (id: string) => {
    setAmbientes(prev => prev.filter(a => a.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (ambientes.length === 0) {
      toast.error('Adicione pelo menos um ambiente')
      return
    }
    onNext({ ambientes })
  }

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all">
      <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Ambientes do Imóvel</h3>
      <p className="text-[var(--text-secondary)] mb-6">
        Adicione os ambientes (pastas) para organizar as fotos da vistoria.
        {vistoriaInfo?.tipoUso && (
          <span className="block text-xs mt-1 opacity-70">
            Mostrando ambientes para: <strong>{vistoriaInfo.tipoUso}</strong>
            {vistoriaInfo.tipoImovel && <> / <strong>{vistoriaInfo.tipoImovel}</strong></>}
          </span>
        )}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Botão Adicionar */}
        {!showSelector && !showNomeInput && (
          <Button
            type="button"
            variant="primary"
            onClick={openSelector}
            className="w-full py-4 text-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Ambiente
          </Button>
        )}

        {/* Seletor de Tipo de Ambiente */}
        {showSelector && (
          <div className="border-2 border-primary/30 rounded-lg overflow-hidden bg-[var(--bg-primary)] animate-in fade-in">
            <div className="p-3 border-b border-[var(--border-color)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all"
                  placeholder="Pesquisar tipo de ambiente..."
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-[var(--text-secondary)]">
                <span>{total} tipos encontrados</span>
                <button
                  type="button"
                  onClick={() => { setShowSelector(false); setSearchTerm('') }}
                  className="text-red-500 hover:text-red-400 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>

            <div
              ref={listRef}
              onScroll={handleScroll}
              className="max-h-72 overflow-y-auto"
            >
              {tiposDisponiveis.map((tipo) => (
                <button
                  key={tipo.nome}
                  type="button"
                  onClick={() => handleSelectTipo(tipo.nome)}
                  className="w-full text-left px-4 py-3 hover:bg-primary/10 border-b border-[var(--border-color)] last:border-b-0 transition-colors group"
                >
                  <span className="font-medium text-[var(--text-primary)] group-hover:text-primary">
                    🏠 {tipo.nome}
                  </span>
                </button>
              ))}

              {loadingTipos && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-[var(--text-secondary)]">Carregando...</span>
                </div>
              )}

              {!loadingTipos && tiposDisponiveis.length === 0 && (
                <div className="text-center py-8 text-[var(--text-secondary)]">
                  <p>Nenhum tipo de ambiente encontrado</p>
                  <p className="text-xs mt-1 opacity-70">Tente uma pesquisa diferente</p>
                </div>
              )}

              {hasMore && !loadingTipos && (
                <button
                  type="button"
                  onClick={() => loadTipos(searchTerm, offset + LIMIT, true)}
                  className="w-full py-3 text-sm text-primary hover:bg-primary/5 flex items-center justify-center gap-1"
                >
                  <ChevronDown className="w-4 h-4" />
                  Carregar mais
                </button>
              )}
            </div>
          </div>
        )}

        {/* Input para nomear o ambiente */}
        {showNomeInput && (
          <div className="border-2 border-primary/30 rounded-lg p-4 bg-[var(--bg-primary)] animate-in fade-in">
            <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-1">
              Tipo selecionado: <span className="text-primary">{selectedTipo}</span>
            </h4>
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 mt-3">
              Nome do Ambiente
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nomeAmbiente}
                onChange={(e) => setNomeAmbiente(e.target.value)}
                className="flex-1 px-4 py-3 bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all"
                placeholder={`Ex: 1 - ${selectedTipo}`}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleConfirmAmbiente())}
              />
              <Button type="button" variant="primary" onClick={handleConfirmAmbiente}>
                Confirmar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowNomeInput(false); setSelectedTipo('') }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de ambientes criados */}
        {ambientes.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Ambientes Criados ({ambientes.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ambientes.map((ambiente) => (
                <div
                  key={ambiente.id}
                  className="flex items-center justify-between px-4 py-3 bg-purple-500/10 border-2 border-purple-500/20 rounded-lg group hover:border-purple-500/40 transition-all"
                >
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">
                      📁 {ambiente.nomeAmbiente}
                    </span>
                    <span className="block text-xs text-[var(--text-secondary)] opacity-70">
                      Tipo: {ambiente.tipoAmbiente}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAmbiente(ambiente.id)}
                    className="text-red-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover ambiente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {ambientes.length === 0 && !showSelector && !showNomeInput && (
          <div className="text-center py-12 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-[var(--text-secondary)] opacity-40" />
            <p className="text-[var(--text-secondary)]">Nenhum ambiente adicionado ainda</p>
            <p className="text-sm text-[var(--text-secondary)] opacity-70 mt-1">
              Clique em "Adicionar Ambiente" para começar
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between pt-6 border-t border-[var(--border-color)]">
          <Button type="button" variant="outline" size="lg" onClick={onBack}>
            ← Voltar
          </Button>
          <Button type="submit" variant="primary" size="lg" disabled={ambientes.length === 0}>
            Próximo: Upload de Imagens →
          </Button>
        </div>
      </form>
    </div>
  )
}
