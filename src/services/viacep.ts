/**
 * Serviço para consulta de CEP via API ViaCEP
 */

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface EnderecoViaCep {
  cep: string;
  rua: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

class ViaCepService {
  private readonly baseUrl = 'https://viacep.com.br/ws';

  /**
   * Formata CEP removendo caracteres não numéricos
   */
  formatarCEP(cep: string): string {
    return cep.replace(/\D/g, '');
  }

  /**
   * Adiciona máscara ao CEP (00000-000)
   */
  aplicarMascaraCEP(cep: string): string {
    const cepLimpo = this.formatarCEP(cep);
    if (cepLimpo.length !== 8) return cep;
    return `${cepLimpo.substring(0, 5)}-${cepLimpo.substring(5)}`;
  }

  /**
   * Valida se o CEP tem formato válido
   */
  validarCEP(cep: string): boolean {
    const cepLimpo = this.formatarCEP(cep);
    return /^\d{8}$/.test(cepLimpo);
  }

  /**
   * Consulta endereço pelo CEP
   */
  async consultarCEP(cep: string): Promise<EnderecoViaCep> {
    const cepLimpo = this.formatarCEP(cep);

    if (!this.validarCEP(cepLimpo)) {
      throw new Error('CEP inválido. Deve conter 8 dígitos.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/${cepLimpo}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro ao consultar CEP');
      }

      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      return {
        cep: this.aplicarMascaraCEP(data.cep),
        rua: data.logradouro,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
      };
    } catch (error: any) {
      if (error.message === 'CEP não encontrado') {
        throw error;
      }
      throw new Error('Erro ao consultar CEP. Verifique sua conexão.');
    }
  }
}

export const viaCepService = new ViaCepService();
