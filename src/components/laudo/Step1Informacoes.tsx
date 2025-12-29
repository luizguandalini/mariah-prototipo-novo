import { useState } from 'react'
import Button from '../ui/Button'

interface Step1Props {
  onNext: (data: any) => void
  initialData?: any
}

export default function Step1Informacoes({ onNext, initialData = {} }: Step1Props) {
  const [formData, setFormData] = useState({
    uso: initialData.uso || 'Residencial',
    tipo: initialData.tipo || 'Apartamento',
    unidade: initialData.unidade || '',
    tipoVistoria: initialData.tipoVistoria || 'Entrada',
    endereco: initialData.endereco || '',
    cep: initialData.cep || '',
    tamanho: initialData.tamanho || '',
    realizadaEm: initialData.realizadaEm || new Date().toISOString().split('T')[0],
    agua: initialData.agua || 'Selecione...',
    energia: initialData.energia || 'Selecione...',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext({ vistoriaInfo: formData })
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all">
      <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Informações da Vistoria</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Uso */}
          <div>
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
              Uso
            </label>
            <select
              value={formData.uso}
              onChange={(e) => handleChange('uso', e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all"
              required
            >
              <option>Residencial</option>
              <option>Comercial</option>
              <option>Misto</option>
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
              Tipo
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => handleChange('tipo', e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all"
              required
            >
              <option>Apartamento</option>
              <option>Casa</option>
              <option>Sobrado</option>
              <option>Kitnet</option>
              <option>Loft</option>
              <option>Cobertura</option>
            </select>
          </div>

          {/* Unidade */}
          <div>
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
              Unidade (opcional)
            </label>
            <input
              type="text"
              value={formData.unidade}
              onChange={(e) => handleChange('unidade', e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all"
              placeholder="Ex: 671, Apto 22"
            />
          </div>

          {/* Tipo de Vistoria */}
          <div>
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
              Tipo de Vistoria
            </label>
            <select
              value={formData.tipoVistoria}
              onChange={(e) => handleChange('tipoVistoria', e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all"
              required
            >
              <option>Entrada</option>
              <option>Saída</option>
              <option>Periódica</option>
            </select>
          </div>
        </div>

        {/* Endereço */}
        <div>
          <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
            Endereço Completo
          </label>
          <input
            type="text"
            value={formData.endereco}
            onChange={(e) => handleChange('endereco', e.target.value)}
            className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all"
            placeholder="Ex: Av. José Galante, 671 - Vila Andrade, São Paulo - SP"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CEP */}
          <div>
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
              CEP
            </label>
            <input
              type="text"
              value={formData.cep}
              onChange={(e) => handleChange('cep', e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all"
              placeholder="00000-000"
              required
            />
          </div>

          {/* Tamanho */}
          <div>
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
              Tamanho do Imóvel
            </label>
            <input
              type="text"
              value={formData.tamanho}
              onChange={(e) => handleChange('tamanho', e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all"
              placeholder="Ex: 200 m²"
              required
            />
          </div>

          {/* Realizada em */}
          <div>
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
              Realizada em
            </label>
            <input
              type="date"
              value={formData.realizadaEm}
              onChange={(e) => handleChange('realizadaEm', e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Água */}
          <div>
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
              Água
            </label>
            <select
              value={formData.agua}
              onChange={(e) => handleChange('agua', e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all"
            >
              <option>Selecione...</option>
              <option>Normal</option>
              <option>Cortada</option>
              <option>Com Vazamento</option>
            </select>
          </div>

          {/* Energia */}
          <div>
            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
              Energia
            </label>
            <select
              value={formData.energia}
              onChange={(e) => handleChange('energia', e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all"
            >
              <option>Selecione...</option>
              <option>Normal</option>
              <option>Cortada</option>
              <option>Com Problema</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end pt-6 border-t border-[var(--border-color)]">
          <Button type="submit" variant="primary" size="lg">
            Próximo: Ambientes →
          </Button>
        </div>
      </form>
    </div>
  )
}
