import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ProgressCallback {
  (percent: number): void;
}

const METODOLOGIA_TEXTS = [
  "Este documento tem como objetivo garantir às partes da locação o registro do estado de entrega do imóvel, integrando-se como anexo ao contrato formado. Ele concilia as obrigações contratuais e serve como referência para a aferição de eventuais alterações no imóvel ao longo do período de uso.",
  "O laudo de vistoria foi elaborado de maneira técnica por um especialista qualificado, que examinou critérios específicos para avaliar todos os aspectos relevantes, desde apontamentos estruturais aparentes até pequenos detalhes construtivos e acessórios presentes no imóvel. O objetivo foi registrar, de forma clara e objetiva, por meio de textos e imagens, qualquer apontamento ou irregularidade, garantindo uma abordagem sistemática, imparcial e organizada em ordem cronológica, com separação por ambientes e legendas contidas e numerações sequenciais.",
  "O documento inclui fotos de todas as paredes, pisos, tetos, portas, janelas e demais elementos que compõem o imóvel e suas instalações. As imagens foram capturadas com angulação precisa, permitindo análises previstas do estado de conservação atual do imóvel e verificações futuras. Fica reservado o direito, a qualquer tempo, das partes identificadas, por meio das imagens, qualquer ponto que não tenha sido especificado por escrito.",
  "Os registros identificados como irregularidades ou avarias estão destacados neste laudo sob a denominação \"APONTAMENTOS\" e podem ser facilmente localizados utilizando o recurso de busca por palavras.",
  "Este laudo não emprega termos subjetivos, como \"bom\", \"regular\" ou \"ótimo\" estado, nas análises. A descrição foi construída de forma objetiva, baseada exclusivamente em fatos observáveis, com o objetivo de evitar interpretações divergentes que possam surgir de perspectivas pessoais e garantir que as informações registradas sejam precisas e imparciais.",
  "Os elementos adicionais ao imóvel, como acessórios, eletrodomésticos, equipamentos de arcondicionado, dispositivos em geral, lustres ou luminárias, mobília não embutida, entre outros, serão identificados no laudo pela denominação \"ITEM\"."
];

// CSS idêntico ao usado no componente React
const COVER_PAGE_CSS = `
  @import url("https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap");
  * { box-sizing: border-box; }
  .div-laudo-de-vistoria { background-color: #d9d9d9; margin-bottom: 20px; margin-top: 35px; }
  .div-laudo-de-vistoria h1 { text-align: center; font-size: 25px; margin: 0; padding: 10px 0; font-weight: 700; }
  .div-informacoes-da-vistoria h2 { margin: 0px; font-size: 14px; border-bottom: solid #c0c0c0 1px; padding-bottom: 2px; font-weight: 700; }
  .campos { width: 100%; margin-top: 9px; display: flex; flex-direction: column; gap: 4px; }
  .linha-campos { display: flex; width: 100%; gap: 4px; align-items: stretch; }
  .formatacao-campos { display: flex; background-color: #d9d9d9; border: solid rgb(255, 255, 255) 1px; padding: 2px; align-items: baseline; }
  .formatacao-campos > strong { font-size: 12px; margin-left: 2px; white-space: nowrap; }
  .formatacao-campos > p { margin: 0px; font-size: 12px; margin-left: 3px; word-wrap: break-word; }
  .campo-curto { width: 170px; flex-shrink: 0; min-height: 100%; }
  .campo-longo { flex: 1; min-height: 100%; }
  .div-metodologia { margin-top: 17px; }
  .div-metodologia > h1 { font-size: 14px; border-bottom: solid #c0c0c0 1px; margin: 0; padding-bottom: 2px; font-weight: 700; }
  .div-metodologia > p { font-weight: 400; font-size: 16px; text-align: justify; margin: 10px 0; line-height: 1.4; }
`;

class PdfService {
  async gerarPdfPaginaUnica(elementoId: string, nomeArquivo: string = 'laudo-pagina.pdf'): Promise<void> {
    const elemento = document.getElementById(elementoId);
    if (!elemento) throw new Error('Elemento não encontrado');

    const canvas = await html2canvas(elemento, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1600, // Força largura desktop para evitar quebras
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(nomeArquivo);

    canvas.width = 0;
    canvas.height = 0;
  }

  async gerarPdfCompleto(
    laudoId: string,
    laudo: any,
    totalPaginas: number,
    getImagensPagina: (page: number) => Promise<any>,
    getUrlsBatch: (s3Keys: string[]) => Promise<Record<string, string>>,
    configuracoes: any,
    onProgress: ProgressCallback,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    let paginaAdicionada = false;

    const hasCover = laudo?.tipoVistoria?.toLowerCase().includes('entrada');

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      if (abortSignal?.aborted) {
        throw new Error('Geração cancelada');
      }

      await this.aguardarOciosidade();

      let elementoParaCaptura: HTMLElement;

      if (hasCover && pagina === 1) {
        elementoParaCaptura = await this.criarCapa(laudo, configuracoes);
        // Aumentei o delay para garantir carregamento da fonte
        await new Promise(resolve => setTimeout(resolve, 800));
      } else {
        const backendPage = hasCover ? pagina - 1 : pagina;
        const response = await getImagensPagina(backendPage);
        const imagens = response.data;
        const s3Keys = imagens.map((img: any) => img.s3Key);
        const urls = await getUrlsBatch(s3Keys);

        elementoParaCaptura = this.criarPaginaTemporaria(imagens, urls, configuracoes);
        await this.aguardarCarregamentoImagens(elementoParaCaptura);
      }

      const canvas = await html2canvas(elementoParaCaptura, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1600, // IMPORTANTE: Força renderização desktop
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.75);

      if (paginaAdicionada) {
        pdf.addPage();
      }
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      paginaAdicionada = true;

      document.body.removeChild(elementoParaCaptura);
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

  private async criarCapa(laudo: any, config: any): Promise<HTMLElement> {
    const container = document.createElement('div');
    // Adicionei box-sizing: border-box aqui explicitamente
    container.style.cssText = `
      position: fixed;
      top: -10000px;
      left: 0;
      width: 210mm;
      height: 297mm;
      box-sizing: border-box;
      background-color: #fff;
      border-top: 8px solid #6f2f9e;
      padding: 10mm 20mm 20mm 20mm;
      font-family: "Roboto", Arial, sans-serif;
      color: black;
      overflow: hidden;
    `;

    container.innerHTML = `
      <style>${COVER_PAGE_CSS}</style>
      
      <div style="height: 35px;"></div>
      
      <div class="div-laudo-de-vistoria">
        <h1>LAUDO DE VISTORIA</h1>
      </div>
      
      <div class="div-informacoes-da-vistoria">
        <h2>INFORMAÇÕES DA VISTORIA</h2>

        <div class="campos">
          <div class="linha-campos">
            <div class="formatacao-campos campo-curto">
              <strong>Uso:</strong>
              <p>${laudo.tipoUso || 'Industrial'}</p>
            </div>
            <div class="formatacao-campos campo-longo">
              <strong>Endereço:</strong>
              <p>${laudo.endereco}</p>
            </div>
          </div>

          <div class="linha-campos">
            <div class="formatacao-campos campo-curto">
              <strong>Tipo:</strong>
              <p>${laudo.tipoImovel || laudo.tipo}</p>
            </div>
            <div class="formatacao-campos campo-longo">
              <strong>CEP:</strong>
              <p>${laudo.cep}</p>
            </div>
          </div>

          <div class="linha-campos">
            <div class="formatacao-campos campo-curto">
              <strong>Unidade:</strong>
              <p>${laudo.numero || ''}</p>
            </div>
            <div class="formatacao-campos campo-longo">
              <strong>Tamanho do imóvel:</strong>
              <p>${laudo.tamanho || ''}</p>
            </div>
          </div>

          <div class="linha-campos">
            <div class="formatacao-campos campo-curto">
              <strong>Tipo de Vistoria:</strong>
              <p>${laudo.tipoVistoria}</p>
            </div>
            <div class="formatacao-campos campo-longo">
              <strong>Realizada em:</strong>
              <p></p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="div-metodologia">
        <h1>METODOLOGIA</h1>
        ${METODOLOGIA_TEXTS.map(text => `<p>${text}</p>`).join('')}
      </div>
    `;

    document.body.appendChild(container);

    const images = Array.from(container.querySelectorAll('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve; // Resolve anyway to avoid blocking
      });
    }));

    return container;
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
