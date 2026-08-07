/**
 * RELATÓRIO PRO - MÓDULO DE AUTENTICAÇÃO E CADASTRO DE USUÁRIOS
 * Controla o Login, Cadastro de novos Usuários, Sessão de Acesso e Configuração da Nuvem (Sheets / Drive)
 * Restrição: Apenas o perfil Administrador pode alterar as Configurações da Nuvem.
 */

(function () {
  'use strict';

  // SESSÃO DE USUÁRIO ATIVA
  const session = {
    user: null,
    isAuthenticated: false
  };

  // ELEMENTOS DO DOM (AUTENTICAÇÃO)
  const elements = {
    loginOverlay: document.getElementById('login-screen-overlay'),
    tabLogin: document.getElementById('tab-login-btn'),
    tabRegister: document.getElementById('tab-register-btn'),
    boxLogin: document.getElementById('box-login-form'),
    boxRegister: document.getElementById('box-register-form'),

    // Formulário de Login
    inputLoginEmail: document.getElementById('login-email'),
    inputLoginPass: document.getElementById('login-password'),
    btnLoginSubmit: document.getElementById('btn-login-submit'),
    loginErrorAlert: document.getElementById('login-error-alert'),

    // Formulário de Cadastro
    inputRegName: document.getElementById('reg-name'),
    inputRegEmail: document.getElementById('reg-email'),
    inputRegPass: document.getElementById('reg-password'),
    selectRegRole: document.getElementById('reg-role'),
    btnRegisterSubmit: document.getElementById('btn-register-submit'),
    registerSuccessAlert: document.getElementById('register-success-alert'),
    registerErrorAlert: document.getElementById('register-error-alert'),

    // Header Perfil & Logout
    userProfileBadge: document.getElementById('user-profile-badge'),
    userNameDisplay: document.getElementById('user-name-display'),
    userRoleDisplay: document.getElementById('user-role-display'),
    btnLogout: document.getElementById('btn-logout'),

    // Modal Configuração da Nuvem
    btnCloudConfig: document.getElementById('btn-cloud-config'),
    modalCloudSettings: document.getElementById('modal-cloud-settings'),
    inputWebAppUrl: document.getElementById('cloud-webapp-url'),
    inputSpreadsheetId: document.getElementById('cloud-spreadsheet-id'),
    inputDriveFolderId: document.getElementById('cloud-drive-folder-id'),
    btnSaveCloudConfig: document.getElementById('btn-save-cloud-config'),
    btnCloseCloudModal: document.getElementById('btn-close-cloud-modal'),
    cloudSyncBadge: document.getElementById('cloud-sync-badge')
  };

  // INICIALIZAÇÃO DO MÓDULO DE AUTENTICAÇÃO
  function initAuth() {
    bindEvents();
    loadSession();
    checkAuthStatus();
  }

  function bindEvents() {
    // Alternar Abas no Modal de Login (Entrar vs Cadastrar)
    if (elements.tabLogin && elements.tabRegister) {
      elements.tabLogin.addEventListener('click', () => {
        elements.tabLogin.classList.add('active');
        elements.tabRegister.classList.remove('active');
        elements.boxLogin.style.display = 'block';
        elements.boxRegister.style.display = 'none';
        hideAlerts();
      });

      elements.tabRegister.addEventListener('click', () => {
        elements.tabRegister.classList.add('active');
        elements.tabLogin.classList.remove('active');
        elements.boxLogin.style.display = 'none';
        elements.boxRegister.style.display = 'block';
        hideAlerts();
      });
    }

    // Submeter Login
    if (elements.btnLoginSubmit) {
      elements.btnLoginSubmit.addEventListener('click', handleLogin);
    }
    if (elements.inputLoginPass) {
      elements.inputLoginPass.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleLogin();
      });
    }

    // Submeter Cadastro
    if (elements.btnRegisterSubmit) {
      elements.btnRegisterSubmit.addEventListener('click', handleRegister);
    }

    // Logout
    if (elements.btnLogout) {
      elements.btnLogout.addEventListener('click', handleLogout);
    }

    // Modal Configurações Nuvem (RESTRITO A ADMINISTRADOR)
    if (elements.btnCloudConfig) {
      elements.btnCloudConfig.addEventListener('click', openCloudModal);
    }
    if (elements.btnCloseCloudModal) {
      elements.btnCloseCloudModal.addEventListener('click', closeCloudModal);
    }
    if (elements.btnSaveCloudConfig) {
      elements.btnSaveCloudConfig.addEventListener('click', saveCloudSettings);
    }
  }

  function hideAlerts() {
    if (elements.loginErrorAlert) elements.loginErrorAlert.style.display = 'none';
    if (elements.registerSuccessAlert) elements.registerSuccessAlert.style.display = 'none';
    if (elements.registerErrorAlert) elements.registerErrorAlert.style.display = 'none';
  }

  // EFETUAR LOGIN
  async function handleLogin() {
    const email = elements.inputLoginEmail.value.trim();
    const pass = elements.inputLoginPass.value.trim();

    if (!email || !pass) {
      showLoginError('Por favor, informe seu e-mail e senha.');
      return;
    }

    elements.btnLoginSubmit.disabled = true;
    elements.btnLoginSubmit.innerHTML = `<i class="ri-loader-4-line spin"></i> Autenticando...`;

    try {
      const users = await window.GoogleSheetsModule.fetchUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);

      if (user) {
        if (user.status && user.status.toLowerCase() === 'inativo') {
          showLoginError('Sua conta está inativa no momento.');
          elements.btnLoginSubmit.disabled = false;
          elements.btnLoginSubmit.innerHTML = `<i class="ri-login-box-line"></i> Entrar no Sistema`;
          return;
        }

        session.user = {
          name: user.name,
          email: user.email,
          role: user.role || 'Técnico Executor'
        };
        session.isAuthenticated = true;
        saveSession();
        updateUIState();
        elements.loginOverlay.classList.remove('active');
      } else {
        showLoginError('E-mail ou senha incorretos. Verifique suas credenciais.');
      }
    } catch (err) {
      showLoginError('Erro de conexão ao autenticar. Tente novamente.');
    }

    elements.btnLoginSubmit.disabled = false;
    elements.btnLoginSubmit.innerHTML = `<i class="ri-login-box-line"></i> Entrar no Sistema`;
  }

  function showLoginError(msg) {
    if (elements.loginErrorAlert) {
      elements.loginErrorAlert.textContent = msg;
      elements.loginErrorAlert.style.display = 'block';
    }
  }

  // CADASTRAR NOVO USUÁRIO
  async function handleRegister() {
    const name = elements.inputRegName.value.trim();
    const email = elements.inputRegEmail.value.trim();
    const pass = elements.inputRegPass.value.trim();
    const role = elements.selectRegRole.value;

    if (!name || !email || !pass) {
      showRegisterError('Por favor, preencha todos os campos do cadastro.');
      return;
    }

    if (pass.length < 3) {
      showRegisterError('A senha deve conter ao menos 3 caracteres.');
      return;
    }

    elements.btnRegisterSubmit.disabled = true;
    elements.btnRegisterSubmit.innerHTML = `<i class="ri-loader-4-line spin"></i> Cadastrando...`;

    try {
      const newUser = {
        id: 'usr_' + Date.now(),
        name: name,
        email: email,
        password: pass,
        role: role,
        status: 'Ativo'
      };

      await window.GoogleSheetsModule.registerUser(newUser);

      if (elements.registerSuccessAlert) {
        elements.registerSuccessAlert.textContent = `Cadastro realizado com sucesso! Você já pode entrar com o e-mail "${email}".`;
        elements.registerSuccessAlert.style.display = 'block';
      }
      if (elements.registerErrorAlert) elements.registerErrorAlert.style.display = 'none';

      elements.inputRegName.value = '';
      elements.inputRegEmail.value = '';
      elements.inputRegPass.value = '';

      setTimeout(() => {
        elements.tabLogin.click();
        elements.inputLoginEmail.value = email;
      }, 1500);

    } catch (err) {
      showRegisterError(err.message || 'Erro ao realizar o cadastro. Tente novamente.');
    }

    elements.btnRegisterSubmit.disabled = false;
    elements.btnRegisterSubmit.innerHTML = `<i class="ri-user-add-line"></i> Criar Meu Cadastro`;
  }

  function showRegisterError(msg) {
    if (elements.registerErrorAlert) {
      elements.registerErrorAlert.textContent = msg;
      elements.registerErrorAlert.style.display = 'block';
    }
    if (elements.registerSuccessAlert) elements.registerSuccessAlert.style.display = 'none';
  }

  // SESSÃO E LOGOUT
  function saveSession() {
    try {
      localStorage.setItem('relatorio_pro_session', JSON.stringify(session));
    } catch (e) {}
  }

  function loadSession() {
    try {
      const saved = localStorage.getItem('relatorio_pro_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isAuthenticated && parsed.user) {
          session.user = parsed.user;
          session.isAuthenticated = true;
        }
      }
    } catch (e) {}
  }

  function checkAuthStatus() {
    if (session.isAuthenticated && session.user) {
      elements.loginOverlay.classList.remove('active');
      updateUIState();
    } else {
      elements.loginOverlay.classList.add('active');
    }
  }

  function handleLogout() {
    if (confirm('Deseja realmente sair da sua conta?')) {
      session.user = null;
      session.isAuthenticated = false;
      localStorage.removeItem('relatorio_pro_session');
      elements.loginOverlay.classList.add('active');
    }
  }

  function updateUIState() {
    if (session.isAuthenticated && session.user) {
      elements.userNameDisplay.textContent = session.user.name;
      elements.userRoleDisplay.textContent = session.user.role;
      elements.userProfileBadge.style.display = 'flex';

      // Restrição: O botão de configuração da nuvem só é visível para o perfil "Administrador"
      const isAdmin = session.user.role === 'Administrador';
      if (elements.btnCloudConfig) {
        elements.btnCloudConfig.style.display = isAdmin ? 'flex' : 'none';
      }
    } else {
      elements.userProfileBadge.style.display = 'none';
      if (elements.btnCloudConfig) elements.btnCloudConfig.style.display = 'none';
    }

    // Atualizar badge de status da nuvem
    const sheetsConfig = window.GoogleSheetsModule ? window.GoogleSheetsModule.getConfig() : {};
    if (elements.cloudSyncBadge) {
      if (sheetsConfig.webAppUrl) {
        elements.cloudSyncBadge.innerHTML = `<i class="ri-cloud-line"></i> Google Sheets Conectado`;
        elements.cloudSyncBadge.className = 'cloud-sync-badge connected';
      } else {
        elements.cloudSyncBadge.innerHTML = `<i class="ri-cloud-off-line"></i> Nuvem Desconectada (Modo Local)`;
        elements.cloudSyncBadge.className = 'cloud-sync-badge disconnected';
      }
    }
  }

  // MODAL DE CONFIGURAÇÕES DE NUVEM (RESTRITO A ADMINISTRADOR)
  function openCloudModal() {
    if (!session.user || session.user.role !== 'Administrador') {
      alert('Acesso Negado: Apenas usuários com perfil Administrador têm permissão para alterar as Configurações da Nuvem.');
      return;
    }

    const sheetsConfig = window.GoogleSheetsModule ? window.GoogleSheetsModule.getConfig() : {};
    const driveConfig = window.GoogleDriveModule ? window.GoogleDriveModule.getConfig() : {};

    elements.inputWebAppUrl.value = sheetsConfig.webAppUrl || '';
    elements.inputSpreadsheetId.value = sheetsConfig.spreadsheetId || '';
    elements.inputDriveFolderId.value = driveConfig.folderId || '';

    elements.modalCloudSettings.classList.add('active');
  }

  function closeCloudModal() {
    elements.modalCloudSettings.classList.remove('active');
  }

  function saveCloudSettings() {
    if (!session.user || session.user.role !== 'Administrador') {
      alert('Acesso Negado: Apenas administradores podem salvar alterações.');
      return;
    }

    const webAppUrl = elements.inputWebAppUrl.value.trim();
    const spreadsheetId = elements.inputSpreadsheetId.value.trim();
    const driveFolderId = elements.inputDriveFolderId.value.trim();

    if (window.GoogleSheetsModule) {
      window.GoogleSheetsModule.saveConfig(webAppUrl, spreadsheetId);
    }
    if (window.GoogleDriveModule) {
      window.GoogleDriveModule.saveConfig(driveFolderId);
    }

    updateUIState();
    closeCloudModal();
    alert('Configurações do Google Sheets e Drive salvas com sucesso!');
  }

  window.AuthModule = {
    getSession: () => session,
    checkAuth: checkAuthStatus,
    logout: handleLogout
  };

  document.addEventListener('DOMContentLoaded', initAuth);

})();
