/**
 * RELATÓRIO PRO - MÓDULO GOOGLE SHEETS (BANCO DE DADOS EM NUVEM)
 * Gerencia a comunicação com a planilha Google Sheets para Login, Cadastro de Usuários,
 * Histórico de Relatórios, Clientes e Dados da Empresa.
 */

(function () {
  'use strict';

  // CONFIGURAÇÕES DA PLANILHA GOOGLE SHEETS
  const sheetsConfig = {
    // URL do Web App do Google Apps Script ou Endpoint API
    webAppUrl: '',
    spreadsheetId: '',
    // Usuários padrão para primeiro acesso imediato (caso a planilha não esteja configurada)
    defaultUsers: [
      {
        id: 'usr_admin',
        name: 'Administrador Técnico',
        email: 'admin@empresa.com',
        password: '123',
        role: 'Administrador',
        status: 'Ativo'
      },
      {
        id: 'usr_tec1',
        name: 'Carlos Eduardo (Técnico)',
        email: 'tecnico@empresa.com',
        password: '123',
        role: 'Técnico Executor',
        status: 'Ativo'
      }
    ]
  };

  // LER CONFIGURAÇÕES SALVAS DO LOCALSTORAGE
  function loadSheetsConfig() {
    try {
      const saved = localStorage.getItem('relatorio_pro_sheets_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        sheetsConfig.webAppUrl = parsed.webAppUrl || '';
        sheetsConfig.spreadsheetId = parsed.spreadsheetId || '';
      }
    } catch (e) {
      console.warn('Erro ao carregar configurações do Google Sheets:', e);
    }
  }

  function saveSheetsConfig(url, id) {
    sheetsConfig.webAppUrl = url || '';
    sheetsConfig.spreadsheetId = id || '';
    try {
      localStorage.setItem('relatorio_pro_sheets_config', JSON.stringify({
        webAppUrl: sheetsConfig.webAppUrl,
        spreadsheetId: sheetsConfig.spreadsheetId
      }));
    } catch (e) {
      console.warn('Erro ao salvar configurações do Google Sheets:', e);
    }
  }

  // OBTER LISTA DE USUÁRIOS (DA PLANILHA OU FALLBACK LOCAL)
  async function fetchUsersFromSheets() {
    loadSheetsConfig();

    if (sheetsConfig.webAppUrl) {
      try {
        const response = await fetch(`${sheetsConfig.webAppUrl}?action=getUsers`);
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.users)) {
            // Salva cópia local para modo offline
            localStorage.setItem('relatorio_pro_users_cache', JSON.stringify(data.users));
            return data.users;
          }
        }
      } catch (err) {
        console.warn('Erro de conexão com Google Sheets. Usando cache local:', err);
      }
    }

    // Fallback: Cache local ou usuários padrão
    try {
      const localCache = localStorage.getItem('relatorio_pro_users_cache');
      if (localCache) {
        return JSON.parse(localCache);
      }
    } catch (e) {}

    return sheetsConfig.defaultUsers;
  }

  // REGISTRAR NOVO USUÁRIO NA PLANILHA
  async function registerUserInSheets(userObj) {
    loadSheetsConfig();

    // 1. Atualizar cache local
    const users = await fetchUsersFromSheets();

    // Verificar duplicidade de e-mail
    if (users.some(u => u.email.toLowerCase() === userObj.email.toLowerCase())) {
      throw new Error('Este e-mail já está cadastrado.');
    }

    users.push(userObj);
    localStorage.setItem('relatorio_pro_users_cache', JSON.stringify(users));

    // 2. Se a URL do Web App do Google Apps Script estiver configurada, envia para a nuvem
    if (sheetsConfig.webAppUrl) {
      try {
        await fetch(sheetsConfig.webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'addUser',
            user: userObj
          })
        });
      } catch (err) {
        console.warn('Não foi possível enviar o usuário para o Google Sheets online:', err);
      }
    }

    return userObj;
  }

  // GRAVAR RELATÓRIO NA PLANILHA GOOGLE SHEETS
  async function saveReportToSheets(reportData, pdfDriveLink = '') {
    loadSheetsConfig();

    const rowObj = {
      osNumber: reportData.client.osNumber || 'OS-SEM-NUMERO',
      date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientName: reportData.client.name || '-',
      clientDoc: reportData.client.document || '-',
      technician: reportData.client.technician || '-',
      serviceTitle: reportData.service.title || '-',
      status: reportData.client.status || 'Concluído',
      photoCount: reportData.photos.length,
      docCount: reportData.docAttachments.length,
      driveLink: pdfDriveLink || 'Armazenado Localmente'
    };

    if (sheetsConfig.webAppUrl) {
      try {
        await fetch(sheetsConfig.webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'addReport',
            report: rowObj
          })
        });
        return true;
      } catch (e) {
        console.warn('Erro ao salvar relatório no Google Sheets:', e);
      }
    }
    return false;
  }

  // EXPORTAR MÓDULO PARA ESCOPO GLOBAL
  window.GoogleSheetsModule = {
    getConfig: () => sheetsConfig,
    saveConfig: saveSheetsConfig,
    fetchUsers: fetchUsersFromSheets,
    registerUser: registerUserInSheets,
    saveReport: saveReportToSheets
  };

  // Inicializar ao carregar
  loadSheetsConfig();

})();
