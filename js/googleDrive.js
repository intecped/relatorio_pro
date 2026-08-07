/**
 * RELATÓRIO PRO - MÓDULO GOOGLE DRIVE (NUVEM DE ARQUIVOS)
 * Gerencia o upload de PDFs de relatórios e anexos fotográficos/documentais para o Google Drive.
 */

(function () {
  'use strict';

  const driveConfig = {
    folderId: '',
    folderName: 'Relatorios_Servico_Executado'
  };

  function loadDriveConfig() {
    try {
      const saved = localStorage.getItem('relatorio_pro_drive_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        driveConfig.folderId = parsed.folderId || '';
      }
    } catch (e) {
      console.warn('Erro ao carregar configurações do Google Drive:', e);
    }
  }

  function saveDriveConfig(folderId) {
    driveConfig.folderId = folderId || '';
    try {
      localStorage.setItem('relatorio_pro_drive_config', JSON.stringify({ folderId: driveConfig.folderId }));
    } catch (e) {
      console.warn('Erro ao salvar configurações do Google Drive:', e);
    }
  }

  // UPLOAD DO PDF GERADO PARA O GOOGLE DRIVE
  async function uploadPdfToDrive(pdfBlob, fileName) {
    loadDriveConfig();

    const sheetsConfig = window.GoogleSheetsModule ? window.GoogleSheetsModule.getConfig() : {};

    // Se houver Web App do Google Apps Script configurado, envia o arquivo Base64
    if (sheetsConfig.webAppUrl) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async function () {
          const base64Data = reader.result.split(',')[1];
          try {
            await fetch(sheetsConfig.webAppUrl, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'uploadDriveFile',
                fileName: fileName,
                mimeType: 'application/pdf',
                base64: base64Data,
                folderId: driveConfig.folderId
              })
            });
            resolve(`https://drive.google.com/drive/folders/${driveConfig.folderId || 'root'}`);
          } catch (err) {
            console.warn('Erro no envio do PDF para o Google Drive:', err);
            resolve('');
          }
        };
        reader.readAsDataURL(pdfBlob);
      });
    }

    return '';
  }

  window.GoogleDriveModule = {
    getConfig: () => driveConfig,
    saveConfig: saveDriveConfig,
    uploadPdf: uploadPdfToDrive
  };

  loadDriveConfig();

})();
