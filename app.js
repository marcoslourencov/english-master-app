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

        // Renderiza o conteúdo da aba se for a primeira vez
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
                // Adicione casos para outras abas aqui
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
        let html = `<div class="content-grid">`;
        filteredVerbs.forEach(verb => {
            html += `
                <div class="content-item searchable-item" data-search-term="${verb.infinitive} ${verb.past} ${verb.participle} ${verb.translation}">
                    <h3>${verb.infinitive} / ${verb.past} / ${verb.participle}</h3>
                    ${createStackedTranslationHTML(verb.present_example.eng, verb.present_example.ipa, verb.present_example.por)}
                    ${createStackedTranslationHTML(verb.past_example.eng, verb.past_example.ipa, verb.past_example.por)}
                </div>
            `;
        });
        html += `</div>`;
        container.innerHTML = html;
        addTTSListeners(container);
    };
    
    const renderPilares = (container) => {
      // Função simplificada para gerar o conteúdo massivo dos pilares
      // Na aplicação real, isso viria de um JSON ou seria gerado mais programaticamente
      container.innerHTML = `
        <div class="pillar-section searchable-item">
          <h2>To Be - Present</h2>
          <h3>Pronome: I</h3>
          ${createStackedTranslationHTML('I am a teacher.', 'aɪ æm ə ˈtitʃər', 'Eu sou um professor.')}
          ${createStackedTranslationHTML('I am not a teacher.', 'aɪ æm nɒt ə ˈtitʃər', 'Eu não sou um professor.')}
          ${createStackedTranslationHTML('Am I a teacher?', 'æm aɪ ə ˈtitʃər', 'Sou eu um professor?')}
          ${createStackedTranslationHTML('Am I not a teacher?', 'æm aɪ nɒt ə ˈtitʃər', 'Não sou eu um professor?')}
          <h3>Pronome: You</h3>
          ${createStackedTranslationHTML('You are a student.', 'ju ɑr ə ˈstudənt', 'Você é um estudante.')}
          ${createStackedTranslationHTML('You are not a student.', 'ju ɑr nɒt ə ˈstudənt', 'Você não é um estudante.')}
          </div>
          <div class="pillar-section searchable-item">
          <h2>Simple Past</h2>
           <h3>Pronome: She</h3>
          ${createStackedTranslationHTML('She worked yesterday.', 'ʃi wɜrkt ˈjɛstərˌdeɪ', 'Ela trabalhou ontem.')}
        </div>
      `;
      addTTSListeners(container);
    };

    const renderConversations = (container, data) => {
        let html = '';
        for (const level in data) {
            html += `<h2>${level.toUpperCase()}</h2>`;
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
        let html = `<h2>${title}</h2><div class="content-grid">`;
        data.forEach(item => {
            html += `
                <div class="content-item searchable-item" data-search-term="${item.eng} ${item.por}">
                    ${createStackedTranslationHTML(item.eng, item.ipa, item.por)}
                </div>
            `;
        });
        html += `</div>`;
        container.innerHTML = html;
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
            mainContainer.classList.remove('hide-translation');
            translationToggle.textContent = 'Tradução: ON';
        } else {
            mainContainer.classList.add('hide-translation');
            translationToggle.textContent = 'Tradução: OFF';
        }
    };

    const handleSearch = (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const activeContent = document.querySelector('.tab-content.active');
        if (!activeContent) return;

        const items = activeContent.querySelectorAll('.searchable-item');
        items.forEach(item => {
            const itemText = item.dataset.searchTerm || item.textContent;
            if (itemText.toLowerCase().includes(searchTerm)) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    };

    // --- TEXT-TO-SPEECH (TTS) ---
    const addTTSListeners = (container) => {
        const ttsButtons = container.querySelectorAll('.tts-button');
        ttsButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const textToSpeak = e.target.nextElementSibling.textContent;
                speak(textToSpeak, e.target);
            });
        });
    };

    const speak = (text, buttonEl) => {
        speechSynthesis.cancel(); // Cancela falas anteriores

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