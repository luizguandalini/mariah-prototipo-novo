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
  .valor-campo { text-transform: capitalize; }
  .campo-curto { width: 170px; flex-shrink: 0; min-height: 100%; }
  .campo-longo { flex: 1; min-height: 100%; }
  .div-metodologia { margin-top: 17px; }
  .div-metodologia > h1 { font-size: 14px; border-bottom: solid #c0c0c0 1px; margin: 0; padding-bottom: 2px; font-weight: 700; }
  .div-metodologia > p { font-weight: 400; font-size: 16px; text-align: justify; margin: 10px 0; line-height: 1.4; }
`;

// Função auxiliar para normalizar nomes de seções
const normalizeSectionName = (name: string): string => {
  return name.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
};

// Mapeamento de seção -> campo de dados
const SECTION_FIELD_MAP: Record<string, { dataKey: string; fields?: string[] }> = {
  [normalizeSectionName("Atestado da vistoria")]: { dataKey: "atestado" },
  [normalizeSectionName("Análises Hidráulicas")]: { dataKey: "analisesHidraulicas", fields: ["fluxo_agua", "vazamentos"] },
  [normalizeSectionName("Análises Elétricas")]: { dataKey: "analisesEletricas", fields: ["funcionamento", "disjuntores"] },
  [normalizeSectionName("Sistema de ar")]: { dataKey: "sistemaAr", fields: ["ar_condicionado", "aquecimento"] },
  [normalizeSectionName("Mecanismos de abertura")]: { dataKey: "mecanismosAbertura", fields: ["portas", "macanetas", "janelas"] },
  [normalizeSectionName("Revestimentos")]: { dataKey: "revestimentos", fields: ["tetos", "pisos", "bancadas"] },
  [normalizeSectionName("Mobilias")]: { dataKey: "mobilias", fields: ["fixa", "nao_fixa"] },
};

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
    ambientes: any[],
    detalhes: any, // Novo parâmetro com as seções e respostas
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
      } else if (hasCover && pagina === 2) {
        elementoParaCaptura = this.criarPaginaTermos(ambientes);
        await new Promise(resolve => setTimeout(resolve, 400));
      } else if (hasCover && pagina === totalPaginas) {
        // Nova condição: Se for Entrada, a última página é o Relatório
        elementoParaCaptura = this.criarPaginaRelatorio(laudo, detalhes);
        await new Promise(resolve => setTimeout(resolve, 400));
      } else {
        const backendPage = hasCover ? pagina - 2 : pagina;
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
              <p class="valor-campo">${(laudo.tipoUso || 'Industrial').toLowerCase()}</p>
            </div>
            <div class="formatacao-campos campo-longo">
              <strong>Endereço:</strong>
              <p>${laudo.endereco}</p>
            </div>
          </div>

          <div class="linha-campos">
            <div class="formatacao-campos campo-curto">
              <strong>Tipo:</strong>
              <p class="valor-campo">${(laudo.tipoImovel || laudo.tipo || '').toLowerCase()}</p>
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
              <p class="valor-campo">${(laudo.tipoVistoria || '').toLowerCase()}</p>
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

  private criarPaginaTermos(ambientes: any[]): HTMLElement {
    const itemsPerColumn = 18;
    const columns = [[], [], [], []] as any[][];
    
    ambientes.forEach((amb, index) => {
      const colIndex = Math.floor(index / itemsPerColumn);
      if (colIndex < 4) {
        columns[colIndex].push({ ...amb, originalIndex: index + 1 });
      }
    });

    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: -10000px;
      left: 0;
      width: 210mm;
      height: 297mm;
      box-sizing: border-box;
      background-color: #fff;
      padding: 20mm;
      font-family: "Roboto", Arial, sans-serif;
      color: black;
      overflow: hidden;
    `;

    container.innerHTML = `
      <style>
        .termos-gerais h2 { font-size: 14px; font-weight: 700; border-bottom: 1px solid #c0c0c0; padding-bottom: 4px; margin-bottom: 15px; text-transform: uppercase; }
        .termos-gerais p { font-size: 12px; text-align: justify; line-height: 1.5; margin-bottom: 15px; }
        .ambientes-section { margin-top: 30px; }
        .ambientes-section h2 { font-size: 14px; font-weight: 700; border-bottom: 1px solid #c0c0c0; padding-bottom: 4px; margin-bottom: 15px; text-transform: uppercase; }
        .ambientes-container { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 4px; }
        .ambiente-col { background-color: #d9d9d9; padding: 8px; min-height: 480px; display: flex; flex-direction: column; gap: 8px; }
        .ambiente-item { font-size: 11px; line-height: 1.2; word-wrap: break-word; }
      </style>
      
      <div style="height: 35px;"></div>

      <div class="termos-gerais">
        <h2>Termos Gerais</h2>
        <p>
          É obrigação do locatário o reparo imediato dos danos causados por si mesmo ou por
          terceiros durante a vigência do contrato de locação, cabendo ao locatário restituir o
          imóvel no mesmo estado em que o recebeu, de acordo com este laudo de vistoria,
          comprometendo-se com o zelo e promovendo a manutenção preventiva do mesmo e de
          seus equipamentos porventura existentes, em especial, equipamentos elétricos, quadros
          de distribuição de energia, instalações hidráulicas, elétricas, sistemas de ar, sistema de
          aquecimento em geral ou danos decorrentes do mau uso, tais como: danos ao
          encanamento provocados pelo descarte de objetos em ralos, em vasos sanitários,
          conservação dos móveis ou de bens de razão estrutural, como portas, janelas, esquadrias,
          pias, gabinetes, entre outros.
        </p>
        <p>
          O locatário será isento de responsabilidade quanto aos desgastes naturais decorrentes do
          uso normal e zeloso do imóvel, desde que tais condições sejam compatíveis com o
          período de locação e não decorram de negligência, mau uso ou ausência de manutenção
          regular. Eventuais danos que ultrapassem o desgaste esperado ou sejam causados por
          uso inadequado serão de responsabilidade do locatário, firmando compromisso do uso
          zeloso pelo período em que se der início a locação até a efetiva devolução das chaves.
        </p>
      </div>

      <div class="ambientes-section">
        <h2>Ambientes</h2>
        <div class="ambientes-container">
          ${columns.map(col => `
            <div class="ambiente-col">
              ${col.map(amb => `
                <div class="ambiente-item">
                  ${amb.originalIndex}. ${amb.ambiente.replace(/^\d+\s*-\s*/, '')}
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(container); // IMPORTANTE: Anexar ao body para ser renderizado pelo html2canvas
    return container;
  }

   private criarPaginaRelatorio(laudo: any, detalhes: any): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: -10000px;
      left: 0;
      width: 210mm;
      height: 297mm;
      box-sizing: border-box;
      background-color: #fff;
      padding: 20mm;
      font-family: "Roboto", Arial, sans-serif;
      color: black;
      overflow: hidden;
    `;

    // 1. Preparar lista de seções oficiais
    const sections: any[] = [...(detalhes?.availableSections || [])];

    // 2. Identificar e adicionar seções órfãs (Dados Legados/Extras)
    if (detalhes?.dadosExtra) {
       Object.entries(detalhes.dadosExtra).forEach(([key, value]) => {
          // Verifica se essa chave já existe nas seções oficiais (normalizando nomes)
          const isOfficial = sections.some((s: any) => normalizeSectionName(s.name) === normalizeSectionName(key));
          
          if (!isOfficial) {
             // Criar uma estrutura de seção compatível para renderização
             const questions = typeof value === 'object' && value !== null
                ? Object.keys(value).map(k => ({ id: k, questionText: k }))
                : [{ id: 'val', questionText: 'Descrição' }]; // Para strings simples

             sections.push({
                id: `extra-${key}`,
                name: key,
                questions: questions,
                isExtra: true
             });
          }
       });
    }

    const mid = Math.ceil(sections.length / 2);
    const col1 = sections.slice(0, mid);
    const col2 = sections.slice(mid);

    // Função auxiliar para renderizar item (precisa estar no escopo ou ser inline)
    const renderItem = (sectionName: any, questionText: any, questionId: any, index: any) => {
        const normalizedKey = normalizeSectionName(sectionName);
        const mapping = SECTION_FIELD_MAP[normalizedKey];
        
        let dataKey = mapping?.dataKey || normalizedKey;
        let fieldKey = mapping?.fields?.[index];

        let sectionData = detalhes[dataKey];
        
        // Fallback: tentar buscar em dadosExtra
        if (!sectionData && detalhes.dadosExtra) {
             sectionData = detalhes.dadosExtra[sectionName] || detalhes.dadosExtra[normalizedKey];
        }
        
        if (typeof sectionData === 'string' && sectionData.startsWith('{')) {
            try { sectionData = JSON.parse(sectionData); } catch {}
        }

        let value = '-';
        if (sectionData) {
            if (fieldKey && sectionData[fieldKey] !== undefined) {
               value = sectionData[fieldKey];
            } else if (typeof sectionData === 'string' && !fieldKey) {
               value = sectionData;
            } else if (sectionData[questionText] !== undefined) {
               value = sectionData[questionText];
            } else if (sectionData[questionId] !== undefined) {
               value = sectionData[questionId];
            }
        }

        if (value === null || value === undefined || value === '') value = '-';
        if (typeof value === 'object') value = JSON.stringify(value);

        return `
            <div class="item-row">
                <span class="item-label">${questionText}</span>
                <span class="item-valor">${value}</span>
            </div>
        `;
    };

    container.innerHTML = `
      <style>
         .relatorio-titulo { font-size: 14px; font-weight: 700; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 20px; text-transform: uppercase; }
         .relatorio-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
         .relatorio-coluna { display: flex; flex-direction: column; gap: 10px; }
         .categoria-box { background-color: #999; color: #fff; padding: 5px 10px; font-weight: 700; margin-bottom: 2px; font-size: 11px; text-transform: uppercase; }
         .item-row { display: flex; align-items: center; justify-content: space-between; background-color: #d9d9d9; padding: 5px 10px; margin-bottom: 2px; font-size: 11px; }
         .item-label { font-weight: 500; }
         .item-valor { font-weight: 700; text-transform: uppercase; }
      </style>
      
      <div style="height: 35px;"></div>

      <h2 class="relatorio-titulo">RELATÓRIO GERAL DE APONTAMENTO</h2>

      <div class="relatorio-grid">
        <div class="relatorio-coluna">
          ${col1.map((section: any) => `
              <div class="grupo">
                  <div class="categoria-box">${section.name}</div>
                  ${section.questions?.map((q: any, idx: number) => renderItem(section.name, q.questionText || '', q.id, idx)).join('')}
              </div>
          `).join('')}
        </div>

        <div class="relatorio-coluna">
            ${col2.map((section: any) => `
              <div class="grupo">
                  <div class="categoria-box">${section.name}</div>
                  ${section.questions?.map((q: any, idx: number) => renderItem(section.name, q.questionText || '', q.id, idx)).join('')}
              </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(container); 
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
