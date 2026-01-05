import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ProgressCallback {
  (percent: number): void;
}

class PdfService {
  /**
   * Gera PDF de uma única página
   */
  async gerarPdfPaginaUnica(elementoId: string, nomeArquivo: string = 'laudo-pagina.pdf'): Promise<void> {
    const elemento = document.getElementById(elementoId);
    if (!elemento) throw new Error('Elemento não encontrado');

    const canvas = await html2canvas(elemento, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(nomeArquivo);

    // Limpar memória
    canvas.width = 0;
    canvas.height = 0;
  }

  /**
   * Gera PDF completo com múltiplas páginas de forma otimizada
   */
  async gerarPdfCompleto(
    laudoId: string,
    totalPaginas: number,
    getImagensPagina: (page: number) => Promise<any>,
    getUrlsBatch: (s3Keys: string[]) => Promise<Record<string, string>>,
    configuracoes: any,
    onProgress: ProgressCallback,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    let paginaAdicionada = false;

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      if (abortSignal?.aborted) {
        throw new Error('Geração cancelada');
      }

      // Aguardar navegador ficar ocioso
      await this.aguardarOciosidade();

      // Buscar dados da página
      const response = await getImagensPagina(pagina);
      const imagens = response.data;
      
      const s3Keys = imagens.map((img: any) => img.s3Key);
      const urls = await getUrlsBatch(s3Keys);

      // Criar página temporária
      const paginaEl = this.criarPaginaTemporaria(imagens, urls, configuracoes);
      
      // Aguardar imagens carregarem
      await this.aguardarCarregamentoImagens(paginaEl);

      // Capturar como canvas
      const canvas = await html2canvas(paginaEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.75);

      // Adicionar ao PDF
      if (paginaAdicionada) {
        pdf.addPage();
      }
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      paginaAdicionada = true;

      // Limpar
      document.body.removeChild(paginaEl);
      canvas.width = 0;
      canvas.height = 0;

      onProgress((pagina / totalPaginas) * 100);
    }

    pdf.save(`laudo-completo-${laudoId}.pdf`);
  }

  private aguardarOciosidade(): Promise<void> {
    return new Promise(resolve => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => resolve(), { timeout: 2000 });
      } else {
        setTimeout(resolve, 100);
      }
    });
  }

  private criarPaginaTemporaria(
    imagens: any[],
    urls: Record<string, string>,
    config: any
  ): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: -10000px;
      width: 210mm;
      background: white;
      padding: ${config.margemPagina || 20}px;
    `;
    
    const espacH = config.espacamentoHorizontal || 10;
    const espacV = config.espacamentoVertical || 15;

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: ${espacV}px ${espacH}px;">
        ${imagens.map(img => {
          const ambienteSemNumero = (img.ambiente || 'AMBIENTE').replace(/^\d+\s*-\s*/, '');
          return `
          <div>
            <div style="border: 1px solid #999; margin-bottom: 4px;">
              <img 
                src="${urls[img.s3Key]}" 
                crossorigin="anonymous"
                style="width: 100%; height: 200px; object-fit: cover; display: block;"
              />
            </div>
            <div style="font-weight: bold; font-size: 10px; text-transform: uppercase; line-height: 1.2; text-align: left;">
              ${ambienteSemNumero}
            </div>
            <div style="font-size: 9px; line-height: 1.4; text-align: left;">
              <strong>${img.numeroAmbiente} (${img.numeroImagemNoAmbiente})</strong> ${img.legenda || 'sem legenda'}
            </div>
          </div>
        `;}).join('')}
      </div>
    `;
    
    document.body.appendChild(container);
    return container;
  }

  private aguardarCarregamentoImagens(container: HTMLElement): Promise<void> {
    const imagens = Array.from(container.querySelectorAll('img'));
    return Promise.all(
      imagens.map(img => new Promise<void>((resolve, reject) => {
        if ((img as HTMLImageElement).complete) return resolve();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Falha ao carregar imagem'));
        setTimeout(() => reject(new Error('Timeout')), 15000);
      }))
    ).then(() => {});
  }
}

export const pdfService = new PdfService();
