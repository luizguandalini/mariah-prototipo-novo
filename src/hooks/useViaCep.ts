import { useState, useEffect, useCallback } from 'react';
import { viaCepService, type EnderecoViaCep } from '../services/viacep';

interface UseViaCepReturn {
  endereco: EnderecoViaCep | null;
  loading: boolean;
  error: string | null;
  consultarCEP: (cep: string) => void;
  limpar: () => void;
}

/**
 * Hook customizado para consulta de CEP com debounce
 * @param delay Tempo de debounce em ms (padrão: 500ms)
 */
export function useViaCep(delay: number = 500): UseViaCepReturn {
  const [cep, setCep] = useState<string>('');
  const [endereco, setEndereco] = useState<EnderecoViaCep | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce da consulta
  useEffect(() => {
    if (!cep || cep.length < 8) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      
      try {
        const resultado = await viaCepService.consultarCEP(cep);
        setEndereco(resultado);
      } catch (err: any) {
        setError(err.message || 'Erro ao consultar CEP');
        setEndereco(null);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [cep, delay]);

  const consultarCEP = useCallback((novoCep: string) => {
    const cepLimpo = viaCepService.formatarCEP(novoCep);
    setCep(cepLimpo);
  }, []);

  const limpar = useCallback(() => {
    setCep('');
    setEndereco(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    endereco,
    loading,
    error,
    consultarCEP,
    limpar,
  };
}
