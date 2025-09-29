document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DO DOM ---
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');
    const translationToggle = document.getElementById('translation-toggle');
    const mainContainer = document.querySelector('body');

    // --- ESTADO DA APLICAÇÃO ---
    let currentTheme = localStorage.getItem('theme') || 'light';
    let translationsVisible = localStorage.getItem('translationsVisible') !== 'false';
    const contentRendered = new Set();

    // --- INICIALIZAÇÃO ---
    const init = () => {
        setupEventListeners();
        applyTheme();
        applyTranslationVisibility();
        activateTab(tabs[0]); // Ativa a primeira aba por padrão
    };

    // --- CONFIGURAÇÃO DOS EVENT LISTENERS ---
    const setupEventListeners = () => {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => activateTab(tab));
        });

        themeToggle.addEventListener('click', toggleTheme);
        translationToggle.addEventListener('click', toggleTranslations);
        searchInput.addEventListener('input', handleSearch);
    };

    // --- NAVEGAÇÃO POR ABAS ---
    const activateTab = (tab) => {
        const tabName = tab.dataset.tab;

        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(tabName).classList.add('active');

        if (!contentRendered.has(tabName)) {
            renderContentForTab(tabName);
            contentRendered.add(tabName);
        }
    };
    
    // --- LÓGICA DE RENDERIZAÇÃO ---
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
                         renderGenericList(container, gramatica[tabName], tabName.charAt(0).toUpperCase() + tabName.slice(1));
                     } else {
                         container.innerHTML = '<h2>Conteúdo em breve...</h2>';
                     }
            }
        } catch (error) {
            container.innerHTML = '<h2>Erro ao carregar conteúdo.</h2>';
            console.error('Fetch error:', error);
        }
    };

    // --- FUNÇÕES DE RENDERIZAÇÃO ESPECÍFICAS ---
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
    
    // --- GERAÇÃO PROGRAMÁTICA DOS PILARES ---
    const renderPilares = (container) => {
        const pronouns = [
            { subj: 'I', obj: 'me', a:'am', b:'do', c: 'have' },
            { subj: 'You', obj: 'you', a:'are', b:'do', c: 'have' },
            { subj: 'He', obj: 'him', a:'is', b:'does', c: 'has' },
            { subj: 'She', obj: 'her', a:'is', b:'does', c: 'has' },
            { subj: 'It', obj: 'it', a:'is', b:'does', c: 'has' },
            { subj: 'We', obj: 'us', a:'are', b:'do', c: 'have' },
            { subj: 'They', obj: 'them', a:'are', b:'do', c: 'have' },
        ];
        
        let html = '<h2>⚖️ Pilares Fundamentais</h2>';
        
        // --- TO BE ---
        html += '<div class="pillar-section"><h3>Verbo To Be (Presente, Passado, Futuro)</h3>';
        pronouns.forEach(p => {
            html += `<h4>Pronome: ${p.subj}</h4>`;
            // Present
            html += createStackedTranslationHTML(`${p.subj} ${p.a} happy.`, `...`, `(${p.subj} - Afirmativa Presente)`);
            html += createStackedTranslationHTML(`${p.subj} ${p.a} not happy.`, `...`, `(${p.subj} - Negativa Presente)`);
            // Past
            const wasWere = (p.subj === 'I' || p.subj === 'He' || p.subj === 'She' || p.subj === 'It') ? 'was' : 'were';
            html += createStackedTranslationHTML(`${p.subj} ${wasWere} sad.`, `...`, `(${p.subj} - Afirmativa Passado)`);
            html += createStackedTranslationHTML(`${p.subj} ${wasWere} not sad.`, `...`, `(${p.subj} - Negativa Passado)`);
            // Future
            html += createStackedTranslationHTML(`${p.subj} will be an engineer.`, `...`, `(${p.subj} - Afirmativa Futuro)`);
            html += createStackedTranslationHTML(`${p.subj} will not be an engineer.`, `...`, `(${p.subj} - Negativa Futuro)`);
        });
        html += '</div>';

        // --- SIMPLE TENSES (com verbo 'work') ---
        html += '<div class="pillar-section"><h3>Simple Tenses (com "work")</h3>';
        pronouns.forEach(p => {
            const verb = (p.subj === 'He' || p.subj === 'She' || p.subj === 'It') ? 'works' : 'work';
            html += `<h4>Pronome: ${p.subj}</h4>`;
            // Simple Present
            html += createStackedTranslationHTML(`${p.subj} ${verb} here.`, `...`, `(${p.subj} - Afirmativa Presente)`);
            html += createStackedTranslationHTML(`${p.b === 'does' ? 'Does' : 'Do'} ${p.subj} work here?`, `...`, `(${p.subj} - Interrogativa Presente)`);
             // Simple Past
            html += createStackedTranslationHTML(`${p.subj} worked yesterday.`, `...`, `(${p.subj} - Afirmativa Passado)`);
            html += createStackedTranslationHTML(`Did ${p.subj} work yesterday?`, `...`, `(${p.subj} - Interrogativa Passado)`);
             // Simple Future
            html += createStackedTranslationHTML(`${p.subj} will work tomorrow.`, `...`, `(${p.subj} - Afirmativa Futuro)`);
            html += createStackedTranslationHTML(`Will ${p.subj} work tomorrow?`, `...`, `(${p.subj} - Interrogativa Futuro)`);
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

    // --- FUNCIONALIDADES CORE ---
    const fetchData = async (file) => {
        const response = await fetch(file);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
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
            document.body.classList.remove('hide-translation');
            translationToggle.textContent = 'Tradução: ON';
        } else {
            document.body.classList.add('hide-translation');
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

    // --- TEXT-TO-SPEECH (TTS) ---
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

        utterance.onend = () => {
            buttonEl.classList.remove('speaking');
        };
        
        speechSynthesis.speak(utterance);
    };

    // --- INICIA A APLICAÇÃO ---
    init();
});