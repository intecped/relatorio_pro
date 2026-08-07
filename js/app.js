/**
 * RELATÓRIO PRO - GERADOR DE RELATÓRIOS DE EXECUÇÃO DE SERVIÇO
 * Lógica principal da aplicação, reatividade, gerenciamento de fotos, anexos documentais, perfil fixo da empresa, cadastro de clientes e rascunhos
 */

(function () {
  'use strict';

  // ESTADO GLOBAL DO RELATÓRIO
  const state = {
    company: {
      name: '',
      cnpj: '',
      contact: '',
      address: '',
      logo: '' // Data URL da imagem da logo
    },
    client: {
      name: '',
      document: '',
      contact: '',
      location: '',
      technician: '',
      dateStart: '',
      dateEnd: '',
      osNumber: '',
      status: 'Concluído'
    },
    service: {
      title: '',
      description: '',
      materials: '',
      observations: ''
    },
    photos: [], // Array: { id, dataUrl, title, tag, description, timestamp }
    docAttachments: [], // Array: { id, fileType ('pdf'|'image'), name, category, description, dataUrl, fileSize }
    savedClients: [] // Array: { id, name, document, contact, location }
  };

  // ELEMENTOS DO DOM (EDITOR)
  const elements = {
    // Header & Ações
    btnNewReport: document.getElementById('btn-new-report'),
    btnClear: document.getElementById('btn-clear'),
    btnJsonMenu: document.getElementById('btn-json-menu'),
    jsonDropdown: document.getElementById('json-dropdown'),
    btnExportJson: document.getElementById('btn-export-json'),
    inputImportJson: document.getElementById('input-import-json'),
    btnPrintPdf: document.getElementById('btn-print-pdf'),
    btnPrintPreview: document.getElementById('btn-print-preview'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    modeTabs: document.querySelectorAll('.mode-tab'),
    paneEditor: document.getElementById('pane-editor'),
    panePreview: document.getElementById('pane-preview'),

    // Modal Novo Relatório
    modalNewReport: document.getElementById('modal-new-report'),
    btnModalSaveNew: document.getElementById('btn-modal-save-new'),
    btnModalDiscard: document.getElementById('btn-modal-discard'),
    btnModalCancel: document.getElementById('btn-modal-cancel'),

    // Inputs Empresa
    companyLogoInput: document.getElementById('input-company-logo'),
    btnTriggerLogo: document.getElementById('btn-trigger-logo'),
    btnRemoveLogo: document.getElementById('btn-remove-logo'),
    logoPreviewBox: document.getElementById('logo-preview-box'),
    companyName: document.getElementById('company-name'),
    companyCnpj: document.getElementById('company-cnpj'),
    companyContact: document.getElementById('company-contact'),
    companyAddress: document.getElementById('company-address'),

    // Gerenciador de Clientes Salvos
    selectSavedClient: document.getElementById('select-saved-client'),
    btnSaveClient: document.getElementById('btn-save-client'),
    btnDeleteClient: document.getElementById('btn-delete-client'),

    // Inputs Cliente / OS
    clientName: document.getElementById('client-name'),
    osNumber: document.getElementById('os-number'),
    clientDocument: document.getElementById('client-document'),
    clientContact: document.getElementById('client-contact'),
    serviceLocation: document.getElementById('service-location'),
    technicianName: document.getElementById('technician-name'),
    serviceDateStart: document.getElementById('service-date-start'),
    serviceDateEnd: document.getElementById('service-date-end'),
    serviceStatus: document.getElementById('service-status'),

    // Inputs Serviço
    serviceTitle: document.getElementById('service-title'),
    serviceDescription: document.getElementById('service-description'),
    materialsUsed: document.getElementById('materials-used'),
    observationsConclusions: document.getElementById('observations-conclusions'),

    // Fotografias
    photoDropZone: document.getElementById('photo-drop-zone'),
    inputPhotos: document.getElementById('input-photos'),
    btnTriggerPhotos: document.getElementById('btn-trigger-photos'),
    photoCardsContainer: document.getElementById('photo-cards-container'),
    photosEmptyState: document.getElementById('photos-empty-state'),
    photoCounter: document.getElementById('photo-counter'),
    photoCountBadge: document.getElementById('photo-count-badge'),
    btnClearPhotos: document.getElementById('btn-clear-photos'),

    // Anexo Documental (PDF / Imagens)
    docDropZone: document.getElementById('doc-drop-zone'),
    inputDocAttachments: document.getElementById('input-doc-attachments'),
    btnTriggerDocs: document.getElementById('btn-trigger-docs'),
    docCardsContainer: document.getElementById('doc-cards-container'),
    docsEmptyState: document.getElementById('docs-empty-state'),
    docCounter: document.getElementById('doc-counter'),
    docCountBadge: document.getElementById('doc-count-badge'),
    btnClearDocs: document.getElementById('btn-clear-docs'),

    // ELEMENTOS DO DOCUMENTO A4 (PREVIEW)
    docLogoPlaceholder: document.getElementById('doc-logo-placeholder'),
    docLogoImg: document.getElementById('doc-logo-img'),
    docCompanyName: document.getElementById('doc-company-name'),
    docCompanyCnpj: document.getElementById('doc-company-cnpj'),
    docCompanyAddress: document.getElementById('doc-company-address'),
    docCompanyContact: document.getElementById('doc-company-contact'),
    docOsNumber: document.getElementById('doc-os-number'),
    docIssueDate: document.getElementById('doc-issue-date'),
    docStatusBadge: document.getElementById('doc-status-badge'),

    docClientName: document.getElementById('doc-client-name'),
    docClientDocument: document.getElementById('doc-client-document'),
    docClientContact: document.getElementById('doc-client-contact'),
    docTechnicianName: document.getElementById('doc-technician-name'),
    docServiceLocation: document.getElementById('doc-service-location'),
    docDateStart: document.getElementById('doc-date-start'),
    docDateEnd: document.getElementById('doc-date-end'),

    docServiceTitle: document.getElementById('doc-service-title'),
    docServiceDescription: document.getElementById('doc-service-description'),
    docMaterialsUsed: document.getElementById('doc-materials-used'),
    docObservations: document.getElementById('doc-observations'),
    docBoxMaterials: document.getElementById('doc-box-materials'),
    docBoxObservations: document.getElementById('doc-box-observations'),

    docPhotoGrid: document.getElementById('doc-photo-grid'),

    // Seção A4 de Anexo Documental
    pageBreakDocs: document.getElementById('page-break-docs'),
    docSectionAttachments: document.getElementById('doc-section-attachments'),
    docAttachmentsTbody: document.getElementById('doc-attachments-tbody'),
    docAttachmentsPreviews: document.getElementById('doc-attachments-previews'),

    docFooterCompany: document.getElementById('doc-footer-company')
  };

  // INICIALIZAÇÃO
  function init() {
    setupDateStartEndDefault();
    bindEvents();
    loadFromLocalStorage();
    loadCompanyProfile(); // Carrega perfil fixo da empresa
    loadSavedClients();   // Carrega banco de clientes salvos
    renderAll();
  }

  // DEFINIR DATA DE INÍCIO/TÉRMINO PADRÃO SE VAZIAS
  function setupDateStartEndDefault() {
    const now = new Date();
    const nowIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    elements.serviceDateStart.value = nowIso;
    elements.serviceDateEnd.value = nowIso;
  }

  // VERIFICAR SE O RELATÓRIO CONTÉM DADOS DO SERVIÇO
  function hasReportContent() {
    return !!(
      state.client.name.trim() ||
      state.client.osNumber.trim() ||
      state.service.title.trim() ||
      state.service.description.trim() ||
      state.photos.length > 0 ||
      state.docAttachments.length > 0
    );
  }

  // AÇÃO DO BOTÃO "NOVO RELATÓRIO"
  function handleNewReportClick() {
    if (hasReportContent()) {
      elements.modalNewReport.classList.add('active');
    } else {
      resetReportToBlank();
    }
  }

  // RESETAR PARA RELATÓRIO EM BRANCO (MANTENDO PERFIL FIXO DA EMPRESA E CLIENTES SALVOS)
  function resetReportToBlank() {
    const currentCompanyProfile = { ...state.company };

    state.client = { name: '', document: '', contact: '', location: '', technician: '', dateStart: '', dateEnd: '', osNumber: '', status: 'Concluído' };
    state.service = { title: '', description: '', materials: '', observations: '' };
    state.photos = [];
    state.docAttachments = [];

    loadCompanyProfile();
    if (!state.company.name && currentCompanyProfile.name) {
      state.company = currentCompanyProfile;
    }

    elements.selectSavedClient.value = '';
    elements.btnDeleteClient.style.display = 'none';

    setupDateStartEndDefault();
    renderAll();
    localStorage.removeItem('relatorio_pro_draft');
  }

  // SALVAR E CARREGAR PERFIL FIXO DA EMPRESA
  function saveCompanyProfile() {
    try {
      localStorage.setItem('relatorio_pro_company_profile', JSON.stringify(state.company));
    } catch (e) {
      console.warn('Erro ao salvar perfil da empresa:', e);
    }
  }

  function loadCompanyProfile() {
    try {
      const savedProfile = localStorage.getItem('relatorio_pro_company_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed && (parsed.name || parsed.cnpj || parsed.contact || parsed.address || parsed.logo)) {
          Object.assign(state.company, parsed);
        }
      }
    } catch (e) {
      console.warn('Erro ao ler perfil da empresa:', e);
    }
  }

  // LÓGICA DE GERENCIAMENTO DO BANCO DE CLIENTES SALVOS
  function loadSavedClients() {
    try {
      const saved = localStorage.getItem('relatorio_pro_saved_clients');
      if (saved) {
        state.savedClients = JSON.parse(saved) || [];
      }
    } catch (e) {
      console.warn('Erro ao ler cadastro de clientes:', e);
    }
    renderSavedClientsDropdown();
  }

  function saveClientsList() {
    try {
      localStorage.setItem('relatorio_pro_saved_clients', JSON.stringify(state.savedClients));
    } catch (e) {
      console.warn('Erro ao salvar cadastro de clientes:', e);
    }
  }

  function renderSavedClientsDropdown() {
    const select = elements.selectSavedClient;
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Carregar Cliente Salvo do Cadastro --</option>';

    state.savedClients.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} ${c.document ? '(' + c.document + ')' : ''}`;
      select.appendChild(opt);
    });

    select.value = currentVal;
    if (currentVal && state.savedClients.some(c => c.id === currentVal)) {
      elements.btnDeleteClient.style.display = 'inline-flex';
    } else {
      elements.btnDeleteClient.style.display = 'none';
    }
  }

  function handleSaveCurrentClient() {
    const name = state.client.name.trim();
    if (!name) {
      alert('Por favor, informe ao menos o Nome do Cliente para poder salvá-lo no cadastro.');
      return;
    }

    // Verificar se o cliente já existe pelo nome ou documento
    const existingIndex = state.savedClients.findIndex(c => c.name.toLowerCase() === name.toLowerCase());

    const clientData = {
      id: existingIndex >= 0 ? state.savedClients[existingIndex].id : 'client_' + Date.now(),
      name: state.client.name,
      document: state.client.document,
      contact: state.client.contact,
      location: state.client.location
    };

    if (existingIndex >= 0) {
      state.savedClients[existingIndex] = clientData;
      alert(`Dados do cliente "${name}" atualizados no cadastro com sucesso!`);
    } else {
      state.savedClients.push(clientData);
      alert(`Cliente "${name}" cadastrado com sucesso! Agora você pode reutilizá-lo em qualquer outro relatório.`);
    }

    saveClientsList();
    renderSavedClientsDropdown();
    elements.selectSavedClient.value = clientData.id;
    elements.btnDeleteClient.style.display = 'inline-flex';
  }

  function handleSelectSavedClient(clientId) {
    if (!clientId) {
      elements.btnDeleteClient.style.display = 'none';
      return;
    }

    const clientObj = state.savedClients.find(c => c.id === clientId);
    if (clientObj) {
      state.client.name = clientObj.name || '';
      state.client.document = clientObj.document || '';
      state.client.contact = clientObj.contact || '';
      state.client.location = clientObj.location || '';

      elements.clientName.value = state.client.name;
      elements.clientDocument.value = state.client.document;
      elements.clientContact.value = state.client.contact;
      elements.serviceLocation.value = state.client.location;

      renderPreviewText();
      saveToLocalStorage();
      elements.btnDeleteClient.style.display = 'inline-flex';
    }
  }

  function handleDeleteSelectedClient() {
    const clientId = elements.selectSavedClient.value;
    if (!clientId) return;

    const clientObj = state.savedClients.find(c => c.id === clientId);
    const nameStr = clientObj ? clientObj.name : 'este cliente';

    if (confirm(`Tem certeza que deseja remover "${nameStr}" do seu cadastro de clientes?`)) {
      state.savedClients = state.savedClients.filter(c => c.id !== clientId);
      saveClientsList();
      renderSavedClientsDropdown();
      elements.selectSavedClient.value = '';
      elements.btnDeleteClient.style.display = 'none';
    }
  }

  // VINCULAÇÃO DE EVENTOS
  function bindEvents() {
    // Ação Novo Relatório
    elements.btnNewReport.addEventListener('click', handleNewReportClick);

    // Modal Ações
    elements.btnModalCancel.addEventListener('click', () => {
      elements.modalNewReport.classList.remove('active');
    });

    elements.btnModalDiscard.addEventListener('click', () => {
      elements.modalNewReport.classList.remove('active');
      resetReportToBlank();
    });

    elements.btnModalSaveNew.addEventListener('click', () => {
      exportJson();
      elements.modalNewReport.classList.remove('active');
      resetReportToBlank();
    });

    // Eventos do Banco de Clientes Salvos
    elements.btnSaveClient.addEventListener('click', handleSaveCurrentClient);
    elements.selectSavedClient.addEventListener('change', (e) => handleSelectSavedClient(e.target.value));
    elements.btnDeleteClient.addEventListener('click', handleDeleteSelectedClient);

    // Inputs da Empresa (Salvam automaticamente como Perfil Fixo)
    const companyInputs = [
      { elem: elements.companyName, key: 'name' },
      { elem: elements.companyCnpj, key: 'cnpj' },
      { elem: elements.companyContact, key: 'contact' },
      { elem: elements.companyAddress, key: 'address' }
    ];

    companyInputs.forEach(item => {
      if (item.elem) {
        item.elem.addEventListener('input', () => {
          state.company[item.key] = item.elem.value;
          renderPreviewText();
          saveToLocalStorage();
          saveCompanyProfile();
        });
      }
    });

    // Inputs de Cliente e Serviço
    const reportInputs = [
      { elem: elements.clientName, group: 'client', key: 'name' },
      { elem: elements.osNumber, group: 'client', key: 'osNumber' },
      { elem: elements.clientDocument, group: 'client', key: 'document' },
      { elem: elements.clientContact, group: 'client', key: 'contact' },
      { elem: elements.serviceLocation, group: 'client', key: 'location' },
      { elem: elements.technicianName, group: 'client', key: 'technician' },
      { elem: elements.serviceDateStart, group: 'client', key: 'dateStart' },
      { elem: elements.serviceDateEnd, group: 'client', key: 'dateEnd' },
      { elem: elements.serviceStatus, group: 'client', key: 'status' },

      { elem: elements.serviceTitle, group: 'service', key: 'title' },
      { elem: elements.serviceDescription, group: 'service', key: 'description' },
      { elem: elements.materialsUsed, group: 'service', key: 'materials' },
      { elem: elements.observationsConclusions, group: 'service', key: 'observations' }
    ];

    reportInputs.forEach(item => {
      if (item.elem) {
        item.elem.addEventListener('input', () => {
          state[item.group][item.key] = item.elem.value;
          renderPreviewText();
          saveToLocalStorage();
        });
      }
    });

    // Upload de Logo
    elements.btnTriggerLogo.addEventListener('click', () => elements.companyLogoInput.click());
    elements.logoPreviewBox.addEventListener('click', () => elements.companyLogoInput.click());
    elements.companyLogoInput.addEventListener('change', handleLogoUpload);
    elements.btnRemoveLogo.addEventListener('click', removeLogo);

    // Upload de Fotos
    elements.btnTriggerPhotos.addEventListener('click', () => elements.inputPhotos.click());
    elements.inputPhotos.addEventListener('change', (e) => handlePhotosUpload(e.target.files));
    elements.btnClearPhotos.addEventListener('click', clearAllPhotos);

    // Drag & Drop de Fotos
    setupDropZone(elements.photoDropZone, handlePhotosUpload);

    // Upload de Anexo Documental (PDF / Imagens)
    elements.btnTriggerDocs.addEventListener('click', () => elements.inputDocAttachments.click());
    elements.inputDocAttachments.addEventListener('change', (e) => handleDocAttachmentsUpload(e.target.files));
    elements.btnClearDocs.addEventListener('click', clearAllDocs);

    // Drag & Drop de Documentos
    setupDropZone(elements.docDropZone, handleDocAttachmentsUpload);

    // Botões de Ação Principais
    elements.btnClear.addEventListener('click', clearForm);

    // Dropdown de JSON
    elements.btnJsonMenu.addEventListener('click', () => {
      elements.jsonDropdown.parentElement.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!elements.btnJsonMenu.contains(e.target) && !elements.jsonDropdown.contains(e.target)) {
        elements.jsonDropdown.parentElement.classList.remove('active');
      }
    });

    elements.btnExportJson.addEventListener('click', exportJson);
    elements.inputImportJson.addEventListener('change', importJson);

    // Alternar Tema Claro/Escuro
    elements.btnThemeToggle.addEventListener('click', toggleTheme);

    // Alternar Abas Mobile
    elements.modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        elements.modeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const selectedTab = tab.dataset.tab;
        if (selectedTab === 'editor') {
          elements.paneEditor.setAttribute('data-active', 'true');
          elements.panePreview.setAttribute('data-active', 'false');
        } else {
          elements.paneEditor.setAttribute('data-active', 'false');
          elements.panePreview.setAttribute('data-active', 'true');
        }
      });
    });
  }

  // AUXILIAR CONFIGURAÇÃO DROPAREA
  function setupDropZone(dropZoneElem, handlerFn) {
    if (!dropZoneElem) return;
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZoneElem.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZoneElem.addEventListener(eventName, () => dropZoneElem.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZoneElem.addEventListener(eventName, () => dropZoneElem.classList.remove('dragover'), false);
    });

    dropZoneElem.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      handlerFn(files);
    });
  }

  // PROCESSAR UPLOAD DA LOGO
  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    resizeImage(file, 400, 400, (base64Url) => {
      state.company.logo = base64Url;
      renderLogo();
      saveToLocalStorage();
      saveCompanyProfile();
    });
  }

  function removeLogo() {
    state.company.logo = '';
    elements.companyLogoInput.value = '';
    renderLogo();
    saveToLocalStorage();
    saveCompanyProfile();
  }

  function renderLogo() {
    if (state.company.logo) {
      elements.logoPreviewBox.innerHTML = `<img src="${state.company.logo}" alt="Logo">`;
      elements.btnRemoveLogo.style.display = 'inline-flex';
      elements.docLogoPlaceholder.style.display = 'none';
      elements.docLogoImg.src = state.company.logo;
      elements.docLogoImg.style.display = 'block';
    } else {
      elements.logoPreviewBox.innerHTML = `<i class="ri-image-add-line"></i><span>Clique para enviar logo</span>`;
      elements.btnRemoveLogo.style.display = 'none';
      elements.docLogoPlaceholder.style.display = 'flex';
      elements.docLogoImg.style.display = 'none';
      elements.docLogoImg.src = '';
    }
  }

  // PROCESSAR UPLOAD DE FOTOS (MÚLTIPLO)
  function handlePhotosUpload(files) {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    let loadedCount = 0;

    fileArray.forEach(file => {
      resizeImage(file, 1200, 1200, (base64Url) => {
        const now = new Date();
        const timestampStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const photoObj = {
          id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          dataUrl: base64Url,
          title: file.name.replace(/\.[^/.]+$/, ""),
          tag: 'depois',
          description: '',
          timestamp: timestampStr
        };

        state.photos.push(photoObj);
        loadedCount++;

        if (loadedCount === fileArray.length) {
          renderPhotos();
          saveToLocalStorage();
          elements.inputPhotos.value = '';
        }
      });
    });
  }

  // PROCESSAR UPLOAD DE ANEXOS DOCUMENTAIS (PDF OU IMAGENS)
  function handleDocAttachmentsUpload(files) {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    let loadedCount = 0;

    fileArray.forEach(file => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/');

      if (!isPdf && !isImage) {
        loadedCount++;
        return;
      }

      const sizeKb = Math.round(file.size / 1024);
      const sizeStr = sizeKb > 1024 ? (sizeKb / 1024).toFixed(1) + ' MB' : sizeKb + ' KB';

      if (isImage) {
        resizeImage(file, 1400, 1400, (base64Url) => {
          state.docAttachments.push({
            id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            fileType: 'image',
            name: file.name.replace(/\.[^/.]+$/, ""),
            category: 'Certificado',
            description: '',
            dataUrl: base64Url,
            fileSize: sizeStr
          });
          loadedCount++;
          if (loadedCount === fileArray.length) {
            renderDocAttachments();
            saveToLocalStorage();
            elements.inputDocAttachments.value = '';
          }
        });
      } else if (isPdf) {
        const reader = new FileReader();
        reader.onload = function (e) {
          state.docAttachments.push({
            id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            fileType: 'pdf',
            name: file.name,
            category: 'ART / RRT',
            description: 'Documento PDF em anexo completo.',
            dataUrl: e.target.result,
            fileSize: sizeStr
          });
          loadedCount++;
          if (loadedCount === fileArray.length) {
            renderDocAttachments();
            saveToLocalStorage();
            elements.inputDocAttachments.value = '';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // COMPRESSÃO E REDIMENSIONAMENTO DE IMAGENS EM CANVAS
  function resizeImage(file, maxWidth, maxHeight, callback) {
    const reader = new FileReader();
    reader.onload = function (readerEvent) {
      const image = new Image();
      image.onload = function () {
        let width = image.width;
        let height = image.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height *= maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width *= maxHeight / height));
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        callback(dataUrl);
      };
      image.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
  }

  // LIMPAR TODAS AS FOTOS
  function clearAllPhotos() {
    if (confirm('Tem certeza que deseja remover todas as fotografias anexadas?')) {
      state.photos = [];
      renderPhotos();
      saveToLocalStorage();
    }
  }

  // LIMPAR TODOS OS ANEXOS DOCUMENTAIS
  function clearAllDocs() {
    if (confirm('Tem certeza que deseja remover todos os documentos anexados?')) {
      state.docAttachments = [];
      renderDocAttachments();
      saveToLocalStorage();
    }
  }

  // RENDERIZAR CARDS DAS FOTOS NO EDITOR E NO PREVIEW A4
  function renderPhotos() {
    const count = state.photos.length;
    elements.photoCounter.textContent = count;
    elements.photoCountBadge.textContent = count;

    if (count === 0) {
      elements.photosEmptyState.style.display = 'block';
      elements.btnClearPhotos.style.display = 'none';
      elements.photoCardsContainer.innerHTML = '';
      elements.photoCardsContainer.appendChild(elements.photosEmptyState);

      elements.docPhotoGrid.innerHTML = `
        <div class="empty-doc-photos">
          Nenhuma imagem anexada ao relatório.
        </div>
      `;
      return;
    }

    elements.photosEmptyState.style.display = 'none';
    elements.btnClearPhotos.style.display = 'inline-flex';
    elements.photoCardsContainer.innerHTML = '';

    state.photos.forEach((photo, index) => {
      const card = document.createElement('div');
      card.className = 'photo-card-item';
      card.dataset.id = photo.id;

      card.innerHTML = `
        <div class="photo-card-thumb">
          <img src="${photo.dataUrl}" alt="${photo.title}">
          <span class="photo-tag-badge">${getTagLabel(photo.tag)}</span>
        </div>
        <div class="photo-card-body">
          <div class="photo-card-row">
            <input type="text" class="photo-title-input" value="${escapeHtml(photo.title)}" placeholder="Título / Identificação da foto">
            <select class="photo-tag-select">
              <option value="antes" ${photo.tag === 'antes' ? 'selected' : ''}>🔴 Antes</option>
              <option value="durante" ${photo.tag === 'durante' ? 'selected' : ''}>🟠 Durante</option>
              <option value="depois" ${photo.tag === 'depois' ? 'selected' : ''}>🟢 Depois</option>
              <option value="naoconforme" ${photo.tag === 'naoconforme' ? 'selected' : ''}>⚠️ Não Conforme</option>
              <option value="concluido" ${photo.tag === 'concluido' ? 'selected' : ''}>✅ Concluído</option>
              <option value="outros" ${photo.tag === 'outros' ? 'selected' : ''}>📌 Outros</option>
            </select>
          </div>
          <textarea class="photo-desc-input" rows="2" placeholder="Descrição / Observação detalhada desta fotografia">${escapeHtml(photo.description)}</textarea>
        </div>
        <div class="photo-card-actions">
          <button type="button" class="reorder-up-btn" title="Mover para cima" ${index === 0 ? 'disabled style="opacity:0.3;"' : ''}>
            <i class="ri-arrow-up-s-line"></i>
          </button>
          <button type="button" class="remove-photo-btn" title="Remover Foto">
            <i class="ri-delete-bin-line"></i>
          </button>
          <button type="button" class="reorder-down-btn" title="Mover para baixo" ${index === count - 1 ? 'disabled style="opacity:0.3;"' : ''}>
            <i class="ri-arrow-down-s-line"></i>
          </button>
        </div>
      `;

      const titleInput = card.querySelector('.photo-title-input');
      const tagSelect = card.querySelector('.photo-tag-select');
      const descInput = card.querySelector('.photo-desc-input');
      const removeBtn = card.querySelector('.remove-photo-btn');
      const upBtn = card.querySelector('.reorder-up-btn');
      const downBtn = card.querySelector('.reorder-down-btn');

      titleInput.addEventListener('input', (e) => {
        photo.title = e.target.value;
        renderPhotosPreviewOnly();
        saveToLocalStorage();
      });

      tagSelect.addEventListener('change', (e) => {
        photo.tag = e.target.value;
        card.querySelector('.photo-tag-badge').textContent = getTagLabel(photo.tag);
        renderPhotosPreviewOnly();
        saveToLocalStorage();
      });

      descInput.addEventListener('input', (e) => {
        photo.description = e.target.value;
        renderPhotosPreviewOnly();
        saveToLocalStorage();
      });

      removeBtn.addEventListener('click', () => {
        state.photos = state.photos.filter(p => p.id !== photo.id);
        renderPhotos();
        saveToLocalStorage();
      });

      upBtn.addEventListener('click', () => {
        if (index > 0) {
          const temp = state.photos[index];
          state.photos[index] = state.photos[index - 1];
          state.photos[index - 1] = temp;
          renderPhotos();
          saveToLocalStorage();
        }
      });

      downBtn.addEventListener('click', () => {
        if (index < count - 1) {
          const temp = state.photos[index];
          state.photos[index] = state.photos[index + 1];
          state.photos[index + 1] = temp;
          renderPhotos();
          saveToLocalStorage();
        }
      });

      elements.photoCardsContainer.appendChild(card);
    });

    renderPhotosPreviewOnly();
  }

  // RENDERIZAR CARDS DOS ANEXOS DOCUMENTAIS NO EDITOR E NO PREVIEW A4
  function renderDocAttachments() {
    const count = state.docAttachments.length;
    elements.docCounter.textContent = count;
    elements.docCountBadge.textContent = count;

    if (count === 0) {
      elements.docsEmptyState.style.display = 'block';
      elements.btnClearDocs.style.display = 'none';
      elements.docCardsContainer.innerHTML = '';
      elements.docCardsContainer.appendChild(elements.docsEmptyState);

      elements.pageBreakDocs.style.display = 'none';
      elements.docSectionAttachments.style.display = 'none';
      elements.docAttachmentsTbody.innerHTML = '';
      elements.docAttachmentsPreviews.innerHTML = '';
      return;
    }

    elements.docsEmptyState.style.display = 'none';
    elements.btnClearDocs.style.display = 'inline-flex';
    elements.docCardsContainer.innerHTML = '';

    state.docAttachments.forEach((doc, index) => {
      const card = document.createElement('div');
      card.className = 'photo-card-item';
      card.dataset.id = doc.id;

      const thumbHtml = doc.fileType === 'pdf'
        ? `<div class="photo-card-thumb pdf-thumb"><i class="ri-file-pdf-fill"></i><span>${escapeHtml(doc.name)}</span></div>`
        : `<div class="photo-card-thumb"><img src="${doc.dataUrl}" alt="${doc.name}"><span class="photo-tag-badge">Doc Imagem</span></div>`;

      card.innerHTML = `
        ${thumbHtml}
        <div class="photo-card-body">
          <div class="photo-card-row">
            <input type="text" class="doc-title-input" value="${escapeHtml(doc.name)}" placeholder="Nome do Documento / Anexo">
            <select class="doc-cat-select">
              <option value="ART / RRT" ${doc.category === 'ART / RRT' ? 'selected' : ''}>📜 ART / RRT</option>
              <option value="Certificado" ${doc.category === 'Certificado' ? 'selected' : ''}>🎓 Certificado / Calibração</option>
              <option value="Manual / Datasheet" ${doc.category === 'Manual / Datasheet' ? 'selected' : ''}>📘 Manual / Ficha Técnica</option>
              <option value="Comprovante / NF" ${doc.category === 'Comprovante / NF' ? 'selected' : ''}>🧾 Comprovante / Nota Fiscal</option>
              <option value="Outros" ${doc.category === 'Outros' ? 'selected' : ''}>📁 Outros Documentos</option>
            </select>
          </div>
          <textarea class="doc-desc-input" rows="2" placeholder="Observações / Detalhes deste documento (${doc.fileSize})">${escapeHtml(doc.description)}</textarea>
        </div>
        <div class="photo-card-actions">
          <button type="button" class="reorder-up-btn" title="Mover para cima" ${index === 0 ? 'disabled style="opacity:0.3;"' : ''}>
            <i class="ri-arrow-up-s-line"></i>
          </button>
          <button type="button" class="remove-doc-btn" title="Remover Documento">
            <i class="ri-delete-bin-line"></i>
          </button>
          <button type="button" class="reorder-down-btn" title="Mover para baixo" ${index === count - 1 ? 'disabled style="opacity:0.3;"' : ''}>
            <i class="ri-arrow-down-s-line"></i>
          </button>
        </div>
      `;

      const titleInput = card.querySelector('.doc-title-input');
      const catSelect = card.querySelector('.doc-cat-select');
      const descInput = card.querySelector('.doc-desc-input');
      const removeBtn = card.querySelector('.remove-doc-btn');
      const upBtn = card.querySelector('.reorder-up-btn');
      const downBtn = card.querySelector('.reorder-down-btn');

      titleInput.addEventListener('input', (e) => {
        doc.name = e.target.value;
        renderDocsPreviewOnly();
        saveToLocalStorage();
      });

      catSelect.addEventListener('change', (e) => {
        doc.category = e.target.value;
        renderDocsPreviewOnly();
        saveToLocalStorage();
      });

      descInput.addEventListener('input', (e) => {
        doc.description = e.target.value;
        renderDocsPreviewOnly();
        saveToLocalStorage();
      });

      removeBtn.addEventListener('click', () => {
        state.docAttachments = state.docAttachments.filter(d => d.id !== doc.id);
        renderDocAttachments();
        saveToLocalStorage();
      });

      upBtn.addEventListener('click', () => {
        if (index > 0) {
          const temp = state.docAttachments[index];
          state.docAttachments[index] = state.docAttachments[index - 1];
          state.docAttachments[index - 1] = temp;
          renderDocAttachments();
          saveToLocalStorage();
        }
      });

      downBtn.addEventListener('click', () => {
        if (index < count - 1) {
          const temp = state.docAttachments[index];
          state.docAttachments[index] = state.docAttachments[index + 1];
          state.docAttachments[index + 1] = temp;
          renderDocAttachments();
          saveToLocalStorage();
        }
      });

      elements.docCardsContainer.appendChild(card);
    });

    renderDocsPreviewOnly();
  }

  // RENDERIZAR FOTOS APENAS NA FOLHA A4 (PREVIEW)
  function renderPhotosPreviewOnly() {
    elements.docPhotoGrid.innerHTML = '';
    state.photos.forEach(photo => {
      const docCard = document.createElement('div');
      docCard.className = 'doc-photo-card';
      docCard.innerHTML = `
        <div class="doc-photo-img-wrapper">
          <img src="${photo.dataUrl}" alt="${escapeHtml(photo.title)}">
          <span class="doc-photo-tag tag-${photo.tag}">${getTagLabel(photo.tag)}</span>
        </div>
        <div class="doc-photo-info">
          <div class="doc-photo-caption">${escapeHtml(photo.title || 'Fotografia sem título')}</div>
          ${photo.description ? `<div class="doc-photo-desc">${escapeHtml(photo.description)}</div>` : ''}
          <div class="doc-photo-date">${photo.timestamp || ''}</div>
        </div>
      `;
      elements.docPhotoGrid.appendChild(docCard);
    });
  }

  // RENDERIZAR DOCUMENTOS ANEXADOS NA FOLHA A4 (PREVIEW)
  function renderDocsPreviewOnly() {
    if (state.docAttachments.length === 0) {
      elements.pageBreakDocs.style.display = 'none';
      elements.docSectionAttachments.style.display = 'none';
      return;
    }

    elements.pageBreakDocs.style.display = 'block';
    elements.docSectionAttachments.style.display = 'block';
    elements.docAttachmentsTbody.innerHTML = '';
    elements.docAttachmentsPreviews.innerHTML = '';

    state.docAttachments.forEach((doc, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>Doc #${idx + 1}</strong></td>
        <td><span class="doc-item-badge">${escapeHtml(doc.category)}</span></td>
        <td><strong>${escapeHtml(doc.name)}</strong> (${doc.fileType.toUpperCase()} - ${doc.fileSize})</td>
        <td>${escapeHtml(doc.description || '-')}</td>
      `;
      elements.docAttachmentsTbody.appendChild(tr);

      const previewCard = document.createElement('div');
      previewCard.className = 'doc-item-preview-card';

      if (doc.fileType === 'image') {
        previewCard.innerHTML = `
          <div class="doc-item-preview-header">
            <span class="doc-item-title"><i class="ri-file-image-line"></i> Doc #${idx + 1}: ${escapeHtml(doc.name)}</span>
            <span class="doc-item-badge">${escapeHtml(doc.category)}</span>
          </div>
          <div class="doc-item-img-box">
            <img src="${doc.dataUrl}" alt="${escapeHtml(doc.name)}">
          </div>
          ${doc.description ? `<div class="doc-photo-desc">${escapeHtml(doc.description)}</div>` : ''}
        `;
      } else {
        previewCard.innerHTML = `
          <div class="doc-item-preview-header">
            <span class="doc-item-title"><i class="ri-file-pdf-2-line"></i> Doc #${idx + 1}: ${escapeHtml(doc.name)}</span>
            <span class="doc-item-badge">${escapeHtml(doc.category)}</span>
          </div>
          <div class="doc-pdf-box">
            <i class="ri-file-pdf-fill"></i>
            <div class="doc-pdf-info">
              <strong>${escapeHtml(doc.name)}</strong>
              <span>Documento em formato PDF (${doc.fileSize}) anexado ao registro oficial.</span>
            </div>
          </div>
          ${doc.description ? `<div class="doc-photo-desc" style="margin-top:6px;">${escapeHtml(doc.description)}</div>` : ''}
        `;
      }

      elements.docAttachmentsPreviews.appendChild(previewCard);
    });
  }

  function getTagLabel(tag) {
    const map = {
      antes: 'Antes',
      durante: 'Durante',
      depois: 'Depois',
      naoconforme: 'Não Conforme',
      concluido: 'Concluído',
      outros: 'Outros'
    };
    return map[tag] || 'Foto';
  }

  // RENDERIZAR TEXTOS NO PREVIEW A4
  function renderPreviewText() {
    elements.docCompanyName.textContent = state.company.name || 'Sua Empresa Ltda.';
    elements.docCompanyCnpj.textContent = state.company.cnpj ? `CNPJ/CPF: ${state.company.cnpj}` : '';
    elements.docCompanyAddress.textContent = state.company.address || '';
    elements.docCompanyContact.textContent = state.company.contact || '';
    elements.docFooterCompany.textContent = state.company.name ? `${state.company.name} - Relatório de Execução` : 'Relatório de Execução de Serviço';

    elements.docClientName.textContent = state.client.name || '-';
    elements.docClientDocument.textContent = state.client.document || '-';
    elements.docClientContact.textContent = state.client.contact || '-';
    elements.docTechnicianName.textContent = state.client.technician || '-';
    elements.docServiceLocation.textContent = state.client.location || '-';

    elements.docOsNumber.textContent = state.client.osNumber || 'OS-2026/0000';
    elements.docDateStart.textContent = formatDateString(state.client.dateStart);
    elements.docDateEnd.textContent = formatDateString(state.client.dateEnd);
    elements.docStatusBadge.textContent = state.client.status || 'Concluído';

    const today = new Date();
    elements.docIssueDate.textContent = today.toLocaleDateString('pt-BR');

    elements.docServiceTitle.textContent = state.service.title || 'Título do Serviço Executado';
    elements.docServiceDescription.textContent = state.service.description || 'Nenhuma descrição detalhada informada.';

    if (state.service.materials) {
      elements.docBoxMaterials.style.display = 'block';
      elements.docMaterialsUsed.textContent = state.service.materials;
    } else {
      elements.docBoxMaterials.style.display = 'none';
    }

    if (state.service.observations) {
      elements.docBoxObservations.style.display = 'block';
      elements.docObservations.textContent = state.service.observations;
    } else {
      elements.docBoxObservations.style.display = 'none';
    }
  }

  function renderAll() {
    elements.companyName.value = state.company.name;
    elements.companyCnpj.value = state.company.cnpj;
    elements.companyContact.value = state.company.contact;
    elements.companyAddress.value = state.company.address;

    elements.clientName.value = state.client.name;
    elements.osNumber.value = state.client.osNumber;
    elements.clientDocument.value = state.client.document;
    elements.clientContact.value = state.client.contact;
    elements.serviceLocation.value = state.client.location;
    elements.technicianName.value = state.client.technician;
    if (state.client.dateStart) elements.serviceDateStart.value = state.client.dateStart;
    if (state.client.dateEnd) elements.serviceDateEnd.value = state.client.dateEnd;
    if (state.client.status) elements.serviceStatus.value = state.client.status;

    elements.serviceTitle.value = state.service.title;
    elements.serviceDescription.value = state.service.description;
    elements.materialsUsed.value = state.service.materials;
    elements.observationsConclusions.value = state.service.observations;

    renderLogo();
    renderPhotos();
    renderDocAttachments();
    renderSavedClientsDropdown();
    renderPreviewText();
  }

  // FORMATAR STRINGS DE DATA ISO PARA EXIBIÇÃO BRASILEIRA
  function formatDateString(isoStr) {
    if (!isoStr) return '-';
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return isoStr;
      return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoStr;
    }
  }

  // PERSISTÊNCIA EM LOCALSTORAGE
  function saveToLocalStorage() {
    try {
      localStorage.setItem('relatorio_pro_draft', JSON.stringify(state));
    } catch (e) {
      console.warn('Não foi possível salvar no localStorage:', e);
    }
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('relatorio_pro_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(state.company, parsed.company || {});
        Object.assign(state.client, parsed.client || {});
        Object.assign(state.service, parsed.service || {});
        state.photos = parsed.photos || [];
        state.docAttachments = parsed.docAttachments || [];
      }
    } catch (e) {
      console.error('Erro ao ler rascunho do localStorage:', e);
    }
  }

  // EXPORTAR E IMPORTAR JSON
  function exportJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    const filename = `relatorio_${(state.client.osNumber || 'rascunho').replace(/[^a-z0-9]/gi, '_')}.json`;
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function importJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.company && parsed.client && parsed.service) {
          Object.assign(state.company, parsed.company);
          Object.assign(state.client, parsed.client);
          Object.assign(state.service, parsed.service);
          state.photos = parsed.photos || [];
          state.docAttachments = parsed.docAttachments || [];
          renderAll();
          saveToLocalStorage();
          saveCompanyProfile();
          alert('Rascunho carregado com sucesso!');
        } else {
          alert('Arquivo JSON inválido.');
        }
      } catch (err) {
        alert('Erro ao processar o arquivo JSON.');
      }
    };
    reader.readAsText(file);
  }

  // LIMPAR FORMULÁRIO (PRESERVANDO PERFIL FIXO DA EMPRESA E CADASTRO DE CLIENTES)
  function clearForm() {
    if (confirm('Tem certeza que deseja limpar todos os dados do serviço e anexos? Os dados fixos da sua empresa e o cadastro de clientes serão preservados.')) {
      resetReportToBlank();
    }
  }

  // ALTERNAR TEMA CLARO / ESCURO
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    elements.themeIcon.className = newTheme === 'dark' ? 'ri-moon-line' : 'ri-sun-line';
  }

  // CARREGAR DADOS DE EXEMPLO PARA DEMONSTRAÇÃO
  function loadExampleData() {
    const imgAntes = createSampleCanvasImage("SISTEMA ANTES DA MANUTENÇÃO", "Filtro com acúmulo severo de sujidade", "#7f1d1d", "#f87171");
    const imgDurante = createSampleCanvasImage("PROCEDIMENTO DE HIGIENIZAÇÃO", "Aplicação de produto bactericida e troca", "#78350f", "#fbbf24");
    const imgDepois = createSampleCanvasImage("SISTEMA CONCLUÍDO E TESTADO", "Serpentina limpa e fluxo de ar normalizado", "#064e3b", "#34d399");
    const imgDocArt = createSampleCanvasImage("ART DE MANUTENÇÃO E OPERAÇÃO", "Anotação de Responsabilidade Técnica Nº 2026-SP-00941", "#1e3a8a", "#60a5fa");

    const now = new Date();
    const startTime = new Date(now.getTime() - (3 * 3600000)).toISOString().slice(0, 16);
    const endTime = now.toISOString().slice(0, 16);

    state.company = {
      name: 'ClimaTech Engenharia & Climatização Ltda.',
      cnpj: '12.345.678/0001-90',
      contact: '(11) 3456-7890 | contato@climatech.com.br',
      address: 'Av. das Nações Unidas, 12550 - Brooklin, São Paulo / SP',
      logo: ''
    };

    state.client = {
      name: 'Edifício Empresarial Horizon Tower',
      document: '98.765.432/0001-10',
      contact: 'Eng. Roberto Mendonça (Gerente de Facilidades)',
      location: 'Rua Funchal, 418 - 12º Andar - Vila Olímpia, São Paulo/SP',
      technician: 'Técnico Especialista Marcelo Silva (CREA-SP 5069874)',
      dateStart: startTime,
      dateEnd: endTime,
      osNumber: 'OS-2026/0894',
      status: 'Concluído'
    };

    state.service = {
      title: 'Manutenção Preventiva e Corretiva no Chiller de Refrigeração Central (Unidade 02)',
      description: '- Inspeção visual e análise de ruído/vibração nos compressores principais.\n- Higienização química completa das serpentinas do condensador com detergente neutro biodegradável.\n- Substituição dos filtros secadores de linha de líquido e carga de fluido refrigerante R-410A.\n- Reaperto de todas as conexões elétricas do painel de força e medição das correntes nominais dos motores.\n- Teste final de operação e aferição do superaquecimento e subresfriamento.',
      materials: '01x Jogo de Filtros Secadores Danfoss 3/8;\n4.5 kg Fluido Refrigerante R-410A DuPont;\n02 galões de Produto Higienizador Bactericida AirClean;\n01x Kit de Anéis O-ring de Vedação.',
      observations: 'Equipamento entregue em perfeito estado de funcionamento, operando dentro das curvas nominais de projeto. As pressões de sucção e descarga estão estabilizadas. Recomenda-se manter a rotina de manutenção mensal.'
    };

    state.photos = [
      {
        id: 'ex_1',
        dataUrl: imgAntes,
        title: 'Filtro e Serpentina Antes da Intervenção',
        tag: 'antes',
        description: 'Constatado elevado acúmulo de poeira e obstrução parcial da passagem de ar no elemento filtrante.',
        timestamp: new Date(now.getTime() - (3 * 3600000)).toLocaleDateString('pt-BR') + ' 09:15'
      },
      {
        id: 'ex_2',
        dataUrl: imgDurante,
        title: 'Processo de Aplicação Bactericida e Limpeza',
        tag: 'durante',
        description: 'Aplicação de produto de higienização de alta eficácia e substituição dos componentes desgastados.',
        timestamp: new Date(now.getTime() - (2 * 3600000)).toLocaleDateString('pt-BR') + ' 10:30'
      },
      {
        id: 'ex_3',
        dataUrl: imgDepois,
        title: 'Equipamento Limpo e Testes de Operação',
        tag: 'depois',
        description: 'Serpentina completamente desobstruída e sistema operando com vazão de ar 100% nominal.',
        timestamp: new Date(now.getTime() - (30 * 60000)).toLocaleDateString('pt-BR') + ' 11:45'
      }
    ];

    state.docAttachments = [
      {
        id: 'ex_doc_1',
        fileType: 'image',
        name: 'ART_Anotacao_Responsabilidade_Tecnica_CREA_2026.png',
        category: 'ART / RRT',
        description: 'Anotação de Responsabilidade Técnica emitida junto ao CREA-SP referente ao PMOC do edifício.',
        dataUrl: imgDocArt,
        fileSize: '450 KB'
      },
      {
        id: 'ex_doc_2',
        fileType: 'pdf',
        name: 'Laudo_Calibracao_Manometros_Tecnicos.pdf',
        category: 'Certificado',
        description: 'Certificado de Calibração RBC dos manômetros e balança digital utilizados durante os testes.',
        dataUrl: 'data:application/pdf;base64,JVBERi0xLjQK...',
        fileSize: '1.2 MB'
      }
    ];

    // Adicionar clientes de exemplo se o banco de clientes estiver vazio
    if (state.savedClients.length === 0) {
      state.savedClients = [
        {
          id: 'c_ex_1',
          name: 'Edifício Empresarial Horizon Tower',
          document: '98.765.432/0001-10',
          contact: 'Eng. Roberto Mendonça (Gerente de Facilidades)',
          location: 'Rua Funchal, 418 - 12º Andar - Vila Olímpia, São Paulo/SP'
        },
        {
          id: 'c_ex_2',
          name: 'Hospital São Lucas & Maternidade',
          document: '45.123.890/0001-33',
          contact: 'Dra. Fernanda (Coordenadora de Manutenção Hospitalar)',
          location: 'Av. Brasil, 850 - Jardim América, São Paulo/SP'
        }
      ];
      saveClientsList();
    }

    renderAll();
    saveToLocalStorage();
  }

  // CRIAR IMAGENS DE EXEMPLO SINTÉTICAS EM CANVAS
  function createSampleCanvasImage(titleText, descText, bgColor, accentColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 800, 600);
    grad.addColorStop(0, bgColor);
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    for (let y = 0; y < 600; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 740, 540);

    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(400, 240, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ANEXO', 400, 252);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(titleText, 400, 380);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '19px sans-serif';
    ctx.fillText(descText, 400, 430);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '14px monospace';
    ctx.fillText('REGISTRO DOCUMENTAL DE CAMPO - RELATÓRIO PRO', 400, 520);

    return canvas.toDataURL('image/jpeg', 0.9);
  }

  // AUXILIAR ESCAPE HTML
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // DISPARAR AO CARREGAR A PÁGINA
  document.addEventListener('DOMContentLoaded', init);

})();
