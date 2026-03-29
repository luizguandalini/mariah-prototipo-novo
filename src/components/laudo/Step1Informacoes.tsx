import { useState, useEffect, useCallback } from 'react'
import Button from '../ui/Button'
import { viaCepService } from '../../services/viacep'
import { ambientesService } from '../../services/ambientes'
import { toast } from 'sonner'
import { Loader2, Search, MapPin } from 'lucide-react'

interface Step1Props {
  onNext: (data: any) => void
  initialData?: any
}

const TIPOS_VISTORIA = ['ENTRADA', 'SAIDA']
const TIPOS_USO = ['Residencial', 'Comercial', 'Industrial']

export default function Step1Informacoes({ onNext, initialData = {} }: Step1Props) {
  const [formData, setFormData] = useState({
    tipoVistoria: initialData.tipoVistoria || '',
    tipoUso: initialData.tipoUso || '',
    tipoImovel: initialData.tipoImovel || '',
    cep: initialData.cep || '',
    rua: initialData.rua || '',
    numero: initialData.numero || '',
    complemento: initialData.complemento || '',
    bairro: initialData.bairro || '',
    cidade: initialData.cidade || '',
    estado: initialData.estado || '',
    unidade: initialData.unidade || '',
    tamanho: initialData.tamanho || '',
    dataVistoria: initialData.dataVistoria || new Date().toISOString().split('T')[0],
  })

  const [tiposImovel, setTiposImovel] = useState<string[]>([])
  const [loadingTiposImovel, setLoadingTiposImovel] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [cepEncontrado, setCepEncontrado] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Carregar tipos de imóvel quando tipoUso mudar
  useEffect(() => {
    if (formData.tipoUso) {
      loadTiposImovel(formData.tipoUso)
    } else {
      setTiposImovel([])
      setFormData(prev => ({ ...prev, tipoImovel: '' }))
    }
  }, [formData.tipoUso])

  const loadTiposImovel = async (tipoUso: string) => {
    try {
      setLoadingTiposImovel(true)
      const result = await ambientesService.listarTiposImovelPorUso()
      const tipos = result[tipoUso] || []
      setTiposImovel(tipos)
      // Reset tipoImovel se o atual não está na nova lista
      if (formData.tipoImovel && !tipos.includes(formData.tipoImovel)) {
        setFormData(prev => ({ ...prev, tipoImovel: '' }))
      }
    } catch (err) {
      console.error('Erro ao carregar tipos de imóvel:', err)
      setTiposImovel([])
    } finally {
      setLoadingTiposImovel(false)
    }
  }

  const handleChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo ao alterar
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  // Busca de CEP
  const handleCepChange = (value: string) => {
    // Aplicar máscara
    const formatted = viaCepService.aplicarMascaraCEP(value.replace(/\D/g, ''))
    handleChange('cep', formatted)
    setCepEncontrado(false)

    // Auto-busca quando completar 8 dígitos
    const cepLimpo = viaCepService.formatarCEP(value)
    if (cepLimpo.length === 8) {
      buscarCep(cepLimpo)
    }
  }

  const buscarCep = async (cep?: string) => {
    const cepBusca = cep || viaCepService.formatarCEP(formData.cep)
    if (!viaCepService.validarCEP(cepBusca)) {
      toast.error('CEP inválido. Deve conter 8 dígitos.')
      return
    }

    try {
      setBuscandoCep(true)
      const endereco = await viaCepService.consultarCEP(cepBusca)
      setFormData(prev => ({
        ...prev,
        cep: endereco.cep,
        rua: endereco.rua || prev.rua,
        bairro: endereco.bairro || prev.bairro,
        cidade: endereco.cidade || prev.cidade,
        estado: endereco.estado || prev.estado,
        complemento: endereco.complemento || prev.complemento,
      }))
      setCepEncontrado(true)
      toast.success('Endereço encontrado!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao buscar CEP')
      setCepEncontrado(false)
    } finally {
      setBuscandoCep(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.tipoVistoria) newErrors.tipoVistoria = 'Selecione o tipo de vistoria'
    if (!formData.tipoUso) newErrors.tipoUso = 'Selecione o tipo de uso'
    if (!formData.tipoImovel) newErrors.tipoImovel = 'Selecione o tipo de imóvel'
    if (!formData.cep) newErrors.cep = 'Informe o CEP'
    if (!formData.rua) newErrors.rua = 'Informe a rua'
    if (!formData.numero) newErrors.numero = 'Informe o número'
    if (!formData.bairro) newErrors.bairro = 'Informe o bairro'
    if (!formData.cidade) newErrors.cidade = 'Informe a cidade'
    if (!formData.estado) newErrors.estado = 'Informe o estado'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    // Construir endereço formatado
    const endereco = [
      formData.rua,
      formData.numero,
      formData.complemento,
      formData.bairro,
      `${formData.cidade} - ${formData.estado}`,
      formData.cep,
    ].filter(Boolean).join(', ')

    onNext({
      vistoriaInfo: {
        ...formData,
        tipoVistoria: formData.tipoVistoria.toUpperCase(),
        endereco,
      }
    })
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-3 bg-[var(--bg-primary)] border-2 ${
      errors[field] ? 'border-red-500' : 'border-[var(--border-color)]'
    } text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all`

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all">
      <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Informações da Vistoria</h3>
      <p className="text-[var(--text-secondary)] text-sm mb-6">
        Preencha os dados do imóvel e endereço. Campos com <span className="text-red-500">*</span> são obrigatórios.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Classificação do Imóvel */}
        <div className="p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
          <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4 uppercase tracking-wider opacity-70">
            📋 Classificação
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tipo de Vistoria */}
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                Tipo de Vistoria <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipoVistoria}
                onChange={(e) => handleChange('tipoVistoria', e.target.value)}
                className={inputClass('tipoVistoria')}
                required
              >
                <option value="">Selecione...</option>
                {TIPOS_VISTORIA.map(t => (
                  <option key={t} value={t}>{t === 'ENTRADA' ? 'Entrada' : 'Saída'}</option>
                ))}
              </select>
              {errors.tipoVistoria && <p className="text-red-500 text-xs mt-1">{errors.tipoVistoria}</p>}
            </div>

            {/* Tipo de Uso */}
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                Tipo de Uso <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipoUso}
                onChange={(e) => handleChange('tipoUso', e.target.value)}
                className={inputClass('tipoUso')}
                required
              >
                <option value="">Selecione...</option>
                {TIPOS_USO.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.tipoUso && <p className="text-red-500 text-xs mt-1">{errors.tipoUso}</p>}
            </div>

            {/* Tipo de Imóvel */}
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                Tipo de Imóvel <span className="text-red-500">*</span>
                {loadingTiposImovel && <Loader2 className="inline w-3 h-3 ml-1 animate-spin" />}
              </label>
              <select
                value={formData.tipoImovel}
                onChange={(e) => handleChange('tipoImovel', e.target.value)}
                className={inputClass('tipoImovel')}
                required
                disabled={!formData.tipoUso || loadingTiposImovel}
              >
                <option value="">
                  {!formData.tipoUso 
                    ? 'Selecione o tipo de uso primeiro' 
                    : loadingTiposImovel 
                      ? 'Carregando...' 
                      : 'Selecione...'}
                </option>
                {tiposImovel.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.tipoImovel && <p className="text-red-500 text-xs mt-1">{errors.tipoImovel}</p>}
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
          <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4 uppercase tracking-wider opacity-70">
            <MapPin className="inline w-4 h-4 mr-1" /> Endereço
          </h4>

          {/* CEP com busca */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
              CEP <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.cep}
                onChange={(e) => handleCepChange(e.target.value)}
                className={`flex-1 ${inputClass('cep')}`}
                placeholder="00000-000"
                maxLength={9}
              />
              <Button
                type="button"
                variant="primary"
                onClick={() => buscarCep()}
                disabled={buscandoCep || !formData.cep}
                className="px-4"
              >
                {buscandoCep ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            {cepEncontrado && (
              <p className="text-green-500 text-xs mt-1">✅ CEP encontrado</p>
            )}
            {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rua */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                Rua <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.rua}
                onChange={(e) => handleChange('rua', e.target.value)}
                className={inputClass('rua')}
                placeholder="Ex: Av. José Galante"
              />
              {errors.rua && <p className="text-red-500 text-xs mt-1">{errors.rua}</p>}
            </div>

            {/* Número */}
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                Número <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => handleChange('numero', e.target.value)}
                className={inputClass('numero')}
                placeholder="Ex: 671"
              />
              {errors.numero && <p className="text-red-500 text-xs mt-1">{errors.numero}</p>}
            </div>

            {/* Complemento */}
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                Complemento
              </label>
              <input
                type="text"
                value={formData.complemento}
                onChange={(e) => handleChange('complemento', e.target.value)}
                className={inputClass('complemento')}
                placeholder="Ex: Apto 22, Bloco B"
              />
            </div>

            {/* Bairro */}
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                Bairro <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bairro}
                onChange={(e) => handleChange('bairro', e.target.value)}
                className={inputClass('bairro')}
                placeholder="Ex: Vila Andrade"
              />
              {errors.bairro && <p className="text-red-500 text-xs mt-1">{errors.bairro}</p>}
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                Cidade <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => handleChange('cidade', e.target.value)}
                className={inputClass('cidade')}
                placeholder="Ex: São Paulo"
              />
              {errors.cidade && <p className="text-red-500 text-xs mt-1">{errors.cidade}</p>}
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                Estado <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.estado}
                onChange={(e) => handleChange('estado', e.target.value.toUpperCase().slice(0, 2))}
                className={inputClass('estado')}
                placeholder="Ex: SP"
                maxLength={2}
              />
              {errors.estado && <p className="text-red-500 text-xs mt-1">{errors.estado}</p>}
            </div>

            {/* Unidade */}
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                Unidade
              </label>
              <input
                type="text"
                value={formData.unidade}
                onChange={(e) => handleChange('unidade', e.target.value)}
                className={inputClass('unidade')}
                placeholder="Ex: Apto 22"
              />
            </div>
          </div>
        </div>

        {/* Dados Extras */}
        <div className="p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
          <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4 uppercase tracking-wider opacity-70">
            📐 Informações Adicionais
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tamanho */}
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                Tamanho do Imóvel
              </label>
              <input
                type="text"
                value={formData.tamanho}
                onChange={(e) => handleChange('tamanho', e.target.value)}
                className={inputClass('tamanho')}
                placeholder="Ex: 200 m²"
              />
            </div>

            {/* Data da Vistoria */}
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                Data da Vistoria
              </label>
              <input
                type="date"
                value={formData.dataVistoria}
                onChange={(e) => handleChange('dataVistoria', e.target.value)}
                className={inputClass('dataVistoria')}
              />
            </div>
          </div>
        </div>

        {/* Botão */}
        <div className="flex justify-end pt-6 border-t border-[var(--border-color)]">
          <Button type="submit" variant="primary" size="lg">
            Próximo: Ambientes →
          </Button>
        </div>
      </form>
    </div>
  )
}
