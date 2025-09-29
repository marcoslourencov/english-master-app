document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DO DOM ---
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');
    const translationToggle = document.getElementById('translation-toggle');
    const menuToggleBtn = document.getElementById('menu-toggle');
    const headerTitle = document.getElementById('header-title');
    const body = document.body;

    // --- ESTADO DA APLICAÇÃO ---
    let currentTheme = localStorage.getItem('theme') || 'light';
    let translationsVisible = localStorage.getItem('translationsVisible') !== 'false';
    const contentRendered = new Set();

    // --- INICIALIZAÇÃO ---
    const init = () => {
        setupEventListeners();
        applyTheme();
        applyTranslationVisibility();
        activateTab(navLinks[0]); // Ativa o primeiro link por padrão
    };

    // --- CONFIGURAÇÃO DOS EVENT LISTENERS ---
    const setupEventListeners = () => {
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                activateTab(link);
                // Fecha a sidebar no mobile ao clicar em um link
                if (window.innerWidth <= 768) {
                    body.classList.remove('sidebar-open');
                }
            });
        });

        menuToggleBtn.addEventListener('click', () => {
            body.classList.toggle('sidebar-open');
        });

        themeToggle.addEventListener('click', toggleTheme);
        translationToggle.addEventListener('click', toggleTranslations);
        searchInput.addEventListener('input', handleSearch);
    };

    // --- NAVEGAÇÃO E ATIVAÇÃO DE CONTEÚDO ---
    const activateTab = (tab) => {
        const tabName = tab.dataset.tab;

        navLinks.forEach(l => l.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(tabName).classList.add('active');
        headerTitle.textContent = tab.textContent; // Atualiza o título no header

        if (!contentRendered.has(tabName)) {
            renderContentForTab(tabName);
            contentRendered.add(tabName);
        }
    };
    
    // --- LÓGICA DE RENDERIZAÇÃO (inalterada) ---
    const renderContentForTab = async (tabName) => {
        const container = document.getElementById(tabName);
        container.innerHTML = '<h2>Carregando...</h2>';

        try {
            switch (tabName) {
                case 'regulares':
                case 'irregulares':
                    const verbs = await fetchData('verbos.json');
                    const type = tabName === 'regulares' ? 'regular' : 'irregular';
                    renderVerbs(container, verbs, type);
                    break;
                case 'pilares':
                    renderPilares(container);
                    break;
                case 'conversacoes':
                    const convos = await fetchData('conversacoes.json');
                    renderConversations(container, convos);
                    break;
                default:
                     const gramatica = await fetchData('gramatica.json');
                     if(gramatica[tabName]){
                         renderGenericList(container, gramatica[tabName], tabName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
                     } else {
                         container.innerHTML = '<h2>Conteúdo em breve...</h2>';
                     }
            }
        } catch (error) {
            container.innerHTML = '<h2>Erro ao carregar conteúdo.</h2>';
            console.error('Fetch error:', error);
        }
    };
    
    // --- FUNÇÕES DE RENDERIZAÇÃO (inalteradas, apenas a do pilar foi movida para manter consistência) ---
    const createStackedTranslationHTML = (eng, ipa, por) => {
        return `
            <div class="english-line">
                <button class="tts-button">🔊</button>
                <span>${eng}</span>
                <span class="ipa">[${ipa}]</span>
            </div>
            <div class="translation-line">${por}</div>
        `;
    };

    const renderVerbs = (container, verbs, type) => {
        const filteredVerbs = verbs.filter(v => v.type === type);
        container.innerHTML = `<h2>Verbos ${type === 'regular' ? 'Regulares' : 'Irregulares'} (${filteredVerbs.length})</h2><div class="content-grid"></div>`;
        const grid = container.querySelector('.content-grid');
        let html = '';
        filteredVerbs.forEach(verb => {
            html += `
                <div class="content-item searchable-item" data-search-term="${verb.infinitive} ${verb.past} ${verb.participle} ${verb.translation}">
                    <h3>${verb.infinitive} / ${verb.past} / ${verb.participle}</h3>
                    <p class="translation-line"><em>${verb.translation}</em></p>
                    ${createStackedTranslationHTML(verb.present_example.eng, verb.present_example.ipa, verb.present_example.por)}
                    ${createStackedTranslationHTML(verb.past_example.eng, verb.past_example.ipa, verb.past_example.por)}
                </div>
            `;
        });
        grid.innerHTML = html;
        addTTSListeners(container);
    };
    
    const renderPilares = (container) => {
        const pronouns = [
            { subj: 'I', a:'am' }, { subj: 'You', a:'are' }, { subj: 'He', a:'is' },
            { subj: 'She', a:'is' }, { subj: 'It', a:'is' }, { subj: 'We', a:'are' }, { subj: 'They', a:'are' }
        ];
        let html = '<h2>⚖️ Pilares Fundamentais</h2>';
        html += '<div class="pillar-section"><h3>Verbo To Be (Presente, Passado, Futuro)</h3>';
        pronouns.forEach(p => {
            html += `<h4>Pronome: ${p.subj}</h4>`;
            const wasWere = (p.subj === 'I' || p.subj === 'He' || p.subj === 'She' || p.subj === 'It') ? 'was' : 'were';
            html += createStackedTranslationHTML(`${p.subj} ${p.a} a student.`, `...`, `(${p.subj} - Afirmativa Presente)`);
            html += createStackedTranslationHTML(`${p.subj} ${p.a} not a student.`, `...`, `(${p.subj} - Negativa Presente)`);
            html += createStackedTranslationHTML(`${p.subj} ${wasWere} a student.`, `...`, `(${p.subj} - Afirmativa Passado)`);
            html += createStackedTranslationHTML(`${p.subj} will be a student.`, `...`, `(${p.subj} - Afirmativa Futuro)`);
        });
        html += '</div>';
        container.innerHTML = html;
        addTTSListeners(container);
    };

    const renderConversations = (container, data) => {
        let html = '';
        for (const level in data) {
            html += `<h2>Nível ${level.toUpperCase()}</h2>`;
            data[level].forEach(convo => {
                html += `<div class="conversation-block searchable-item" data-search-term="${convo.title}"><h4>${convo.title}</h4>`;
                convo.dialogue.forEach(line => {
                    html += createStackedTranslationHTML(line.eng, line.ipa, line.por);
                });
                html += `</div>`;
            });
        }
        container.innerHTML = html;
        addTTSListeners(container);
    };

    const renderGenericList = (container, data, title) => {
        container.innerHTML = `<h2>${title} (${data.length})</h2><div class="content-grid"></div>`;
        const grid = container.querySelector('.content-grid');
        let html = '';
        data.forEach(item => {
            html += `
                <div class="content-item searchable-item" data-search-term="${item.eng} ${item.por}">
                    ${createStackedTranslationHTML(item.eng, item.ipa, item.por)}
                </div>
            `;
        });
        grid.innerHTML = html;
        addTTSListeners(container);
    };

    // --- FUNCIONALIDADES CORE (inalteradas) ---
    const fetchData = async (file) => {
        const response = await fetch(file);
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        return await response.json();
    };
    const toggleTheme = () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
        applyTheme();
    };
    const applyTheme = () => {
        document.body.dataset.theme = currentTheme;
        themeToggle.textContent = `Tema: ${currentTheme === 'light' ? 'Claro' : 'Escuro'}`;
    };
    const toggleTranslations = () => {
        translationsVisible = !translationsVisible;
        localStorage.setItem('translationsVisible', translationsVisible);
        applyTranslationVisibility();
    };
    const applyTranslationVisibility = () => {
        if (translationsVisible) {
            body.classList.remove('hide-translation');
            translationToggle.textContent = 'Tradução: ON';
        } else {
            body.classList.add('hide-translation');
            translationToggle.textContent = 'Tradução: OFF';
        }
    };
    const handleSearch = (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const activeContent = document.querySelector('.tab-content.active');
        if (!activeContent) return;
        const items = activeContent.querySelectorAll('.searchable-item');
        items.forEach(item => {
            const itemText = (item.dataset.searchTerm || item.textContent).toLowerCase();
            item.style.display = itemText.includes(searchTerm) ? '' : 'none';
        });
    };
    const addTTSListeners = (container) => {
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('tts-button')) {
                const textToSpeak = e.target.nextElementSibling.textContent;
                speak(textToSpeak, e.target);
            }
        });
    };
    const speak = (text, buttonEl) => {
        speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        utterance.volume = 1.0;
        utterance.onstart = () => {
            document.querySelectorAll('.tts-button.speaking').forEach(b => b.classList.remove('speaking'));
            buttonEl.classList.add('speaking');
        };
        utterance.onend = () => { buttonEl.classList.remove('speaking'); };
        speechSynthesis.speak(utterance);
    };
    
    init();
});