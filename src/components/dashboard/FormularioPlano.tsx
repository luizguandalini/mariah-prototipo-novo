import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import type { CreatePlanoDto, UpdatePlanoDto, Plano } from '../../types/planos';

interface FormularioPlanoProps {
  planoEdit?: Plano;
  onSubmit: (data: CreatePlanoDto) => Promise<void>;
  onCancel?: () => void;
}

export default function FormularioPlano({ planoEdit, onSubmit, onCancel }: FormularioPlanoProps) {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidadeImagens, setQuantidadeImagens] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (planoEdit) {
      setNome(planoEdit.nome);
      setPreco(planoEdit.preco?.toString() || '');
      setQuantidadeImagens(planoEdit.quantidadeImagens.toString());
      setAtivo(planoEdit.ativo);
    }
  }, [planoEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data: CreatePlanoDto = {
        nome,
        preco: preco ? parseFloat(preco) : undefined,
        quantidadeImagens: parseInt(quantidadeImagens),
        ativo,
      };

      await onSubmit(data);

      // Limpar formulário após sucesso (apenas no modo criação)
      if (!planoEdit) {
        setNome('');
        setPreco('');
        setQuantidadeImagens('');
        setAtivo(true);
      }
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Nome do Plano *
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            placeholder="Ex: Pacote Básico"
            className="w-full px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Valor em Reais
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            placeholder="Ex: 50.00"
            className="w-full px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Quantidade de Imagens *
          </label>
          <input
            type="number"
            min="1"
            value={quantidadeImagens}
            onChange={(e) => setQuantidadeImagens(e.target.value)}
            required
            placeholder="Ex: 10"
            className="w-full px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>

        <div className="flex items-center">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 text-primary bg-[var(--bg-primary)] border-[var(--border-color)] rounded focus:ring-primary focus:ring-2"
            />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Plano Ativo
            </span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : planoEdit ? 'Atualizar' : 'Criar Plano'}
        </Button>
      </div>
    </form>
  );
}
