/**
 * RELATÓRIO PRO - MÓDULO DE GERAÇÃO DE PDF E IMPRESSÃO (ISOLADO VIA IFRAME)
 * Garante fidelidade de 100% sem interferência de temas, barras de rolagem ou flexbox da tela principal
 */

(function () {
  'use strict';

  const btnPrintPdf = document.getElementById('btn-print-pdf');
  const btnPrintPreview = document.getElementById('btn-print-preview');
  const reportPaper = document.getElementById('report-paper');

  function initPdfModule() {
    if (btnPrintPdf) {
      btnPrintPdf.addEventListener('click', generatePdf);
    }
    if (btnPrintPreview) {
      btnPrintPreview.addEventListener('click', printNative);
    }
  }

  // IMPRESSÃO NATIVA NAVEGADOR (IMPRESSORA / NATIVO DO CHROME/EDGE)
  function printNative() {
    window.print();
  }

  // GERAÇÃO DE ARQUIVO PDF COM ISOLAMENTO EM IFRAME
  function generatePdf() {
    if (typeof html2pdf === 'undefined') {
      alert('Iniciando impressão nativa do navegador...');
      window.print();
      return;
    }

    const osNumberElem = document.getElementById('doc-os-number');
    const clientNameElem = document.getElementById('doc-client-name');

    const osStr = osNumberElem ? osNumberElem.textContent.replace(/[^a-z0-9]/gi, '_') : 'OS_000';
    const clientStr = clientNameElem ? clientNameElem.textContent.replace(/[^a-z0-9]/gi, '_').substring(0, 20) : 'Cliente';
    const fileName = `Relatorio_${osStr}_${clientStr}.pdf`;

    const originalText = btnPrintPdf.innerHTML;
    btnPrintPdf.innerHTML = `<i class="ri-loader-4-line spin"></i> Gerando PDF...`;
    btnPrintPdf.disabled = true;

    // 1. Criar iframe invisível para isolar completamente a renderização A4
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '794px';
    iframe.style.height = '1123px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    // 2. Copiar os estilos da página principal
    const headHtml = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    // 3. Obter o HTML limpo do papel A4
    const paperHtml = reportPaper.outerHTML;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="pt-BR" data-theme="light">
      <head>
        <meta charset="UTF-8">
        ${headHtml}
        <style>
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          body {
            background-color: #ffffff !important;
            color: #1e293b !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 794px !important;
            font-family: 'Inter', sans-serif !important;
          }
          .a4-container {
            width: 794px !important;
            max-width: 794px !important;
            min-height: auto !important;
            height: auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 12mm 15mm 15mm 15mm !important;
            background-color: #ffffff !important;
          }
          .doc-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            width: 100% !important;
            gap: 12px !important;
          }
          .doc-brand {
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            flex: 1 !important;
          }
          .doc-company-info h2 {
            font-size: 12pt !important;
            margin: 0 !important;
          }
          .doc-company-info p {
            font-size: 8pt !important;
            margin: 2px 0 0 0 !important;
          }
          .doc-meta {
            text-align: right !important;
            width: 220px !important;
            flex-shrink: 0 !important;
          }
          .doc-badge-title {
            display: block !important;
            text-align: center !important;
            font-size: 8pt !important;
            padding: 4px 6px !important;
            margin-bottom: 4px !important;
            white-space: nowrap !important;
          }
          .doc-meta-box {
            font-size: 8pt !important;
            padding: 4px 8px !important;
          }
          .doc-photo-grid {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 12px !important;
            width: 100% !important;
          }
          .doc-photo-card {
            width: calc(50% - 6px) !important;
            max-width: calc(50% - 6px) !important;
            flex: 0 0 calc(50% - 6px) !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .doc-item-preview-card, .doc-box, .doc-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        </style>
      </head>
      <body>
        ${paperHtml}
      </body>
      </html>
    `);
    doc.close();

    // 4. Processar renderização com pequeno delay para assegurar carregamento das fontes e imagens
    setTimeout(() => {
      const clonedPaper = doc.getElementById('report-paper');

      const opt = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break',
          avoid: ['.doc-photo-card', '.doc-item-preview-card', '.doc-box', '.doc-section']
        }
      };

      html2pdf().set(opt).from(clonedPaper).outputPdf('blob').then(async (pdfBlob) => {
        // Destruir iframe temporário
        if (document.body.contains(iframe)) document.body.removeChild(iframe);

        // 1. Download do PDF
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();

        // 2. Upload para Google Drive e Registro no Sheets
        if (window.GoogleDriveModule && window.GoogleSheetsModule) {
          btnPrintPdf.innerHTML = `<i class="ri-loader-4-line spin"></i> Enviando para Google Cloud...`;
          try {
            const driveLink = await window.GoogleDriveModule.uploadPdf(pdfBlob, fileName);
            const savedDraft = localStorage.getItem('relatorio_pro_draft');
            if (savedDraft) {
              const reportData = JSON.parse(savedDraft);
              await window.GoogleSheetsModule.saveReport(reportData, driveLink);
            }
          } catch (cloudErr) {
            console.warn('Sincronização em nuvem:', cloudErr);
          }
        }

        btnPrintPdf.innerHTML = originalText;
        btnPrintPdf.disabled = false;
      }).catch(err => {
        console.error('Erro na geração do PDF:', err);
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
        btnPrintPdf.innerHTML = originalText;
        btnPrintPdf.disabled = false;
        window.print();
      });
    }, 400);
  }

  document.addEventListener('DOMContentLoaded', initPdfModule);

})();
