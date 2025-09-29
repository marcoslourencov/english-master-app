document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');
    const translationToggle = document.getElementById('translation-toggle');
    const body = document.body;

    let currentTheme = localStorage.getItem('theme') || 'light';
    let translationsVisible = localStorage.getItem('translationsVisible') !== 'false';
    const contentRendered = new Set();

    const init = () => {
        setupEventListeners();
        applyTheme();
        applyTranslationVisibility();
        activateTab(tabs[0]);
    };

    const setupEventListeners = () => {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => activateTab(tab));
        });
        themeToggle.addEventListener('click', toggleTheme);
        translationToggle.addEventListener('click', toggleTranslations);
        searchInput.addEventListener('input', handleSearch);
    };

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

    const renderContentForTab = async (tabName) => {
        const container = document.getElementById(tabName);
        container.innerHTML = '<h2>Carregando...</h2>';
        try {
            switch (tabName) {
                case 'pilares':
                    renderPilares(container);
                    break;
                // ... (outros cases permanecem os mesmos)
                 case 'regulares':
                case 'irregulares':
                    const verbs = await fetchData('verbos.json');
                    const type = tabName === 'regulares' ? 'regular' : 'irregular';
                    renderVerbs(container, verbs, type);
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

    const createStackedTranslationHTML = (eng, ipa, por) => {
        return `<div class="sentence-pair">
                    <div class="english-line">
                        <button class="tts-button">🔊</button>
                        <span>${eng}</span>
                        <span class="ipa">[${ipa}]</span>
                    </div>
                    <div class="translation-line">${por}</div>
                </div>`;
    };

    // NOVA FUNÇÃO COMPLETA PARA OS PILARES
    const renderPilares = (container) => {
        const pronouns = [
            { subj: 'I', a: 'am', b: 'was', c: 'do', d: 'am not', e: "I'm", f: "I'm not", g: "wasn't", h: "don't" },
            { subj: 'You', a: 'are', b: 'were', c: 'do', d: 'are not', e: "You're", f: "You're not", g: "weren't", h: "don't" },
            { subj: 'He', a: 'is', b: 'was', c: 'does', d: 'is not', e: "He's", f: "He's not", g: "wasn't", h: "doesn't" },
            { subj: 'She', a: 'is', b: 'was', c: 'does', d: 'is not', e: "She's", f: "She's not", g: "wasn't", h: "doesn't" },
            { subj: 'It', a: 'is', b: 'was', c: 'does', d: 'is not', e: "It's", f: "It's not", g: "wasn't", h: "doesn't" },
            { subj: 'We', a: 'are', b: 'were', c: 'do', d: 'are not', e: "We're", f: "We're not", g: "weren't", h: "don't" },
            { subj: 'They', a: 'are', b: 'were', c: 'do', d: 'are not', e: "They're", f: "They're not", g: "weren't", h: "don't" }
        ];

        let html = '<h2>⚖️ Pilares Fundamentais</h2>';

        // --- SEÇÃO TO BE ---
        html += '<div class="pillar-section"><h3>To Be</h3>';
        ['Present', 'Past', 'Future'].forEach(tense => {
            html += `<div class="pillar-group"><h3>${tense}</h3>`;
            pronouns.forEach(p => {
                html += `<h4>Pronome: ${p.subj}</h4>`;
                let affirmative, negative, interrogative, interrogativeNegative, contracted, negContracted;
                if (tense === 'Present') {
                    affirmative = `${p.subj} ${p.a} a teacher.`;
                    negative = `${p.subj} ${p.d} a teacher.`;
                    interrogative = `${p.a.charAt(0).toUpperCase() + p.a.slice(1)} ${p.subj.toLowerCase()} a teacher?`;
                    interrogativeNegative = `${p.a.charAt(0).toUpperCase() + p.a.slice(1)} ${p.subj.toLowerCase()} not a teacher?`;
                    contracted = `${p.e} a teacher.`;
                    negContracted = `${p.f} a teacher. / ${p.subj} ${p.a === 'is' ? "isn't" : "aren't"} a teacher.`;
                } else if (tense === 'Past') {
                    affirmative = `${p.subj} ${p.b} a student.`;
                    negative = `${p.subj} ${p.b} not a student.`;
                    interrogative = `${p.b.charAt(0).toUpperCase() + p.b.slice(1)} ${p.subj.toLowerCase()} a student?`;
                    interrogativeNegative = `${p.b.charAt(0).toUpperCase() + p.b.slice(1)} ${p.subj.toLowerCase()} not a student?`;
                    contracted = `(Não aplicável)`;
                    negContracted = `${p.subj} ${p.g} a student.`;
                } else { // Future
                    affirmative = `${p.subj} will be a pilot.`;
                    negative = `${p.subj} will not be a pilot.`;
                    interrogative = `Will ${p.subj.toLowerCase()} be a pilot?`;
                    interrogativeNegative = `Will ${p.subj.toLowerCase()} not be a pilot?`;
                    contracted = `${p.subj}'ll be a pilot.`;
                    negContracted = `${p.subj} won't be a pilot.`;
                }
                html += `<h5>Afirmativa</h5>${createStackedTranslationHTML(affirmative, '...', 'Eu sou um professor.')}`;
                html += `<h5>Negativa</h5>${createStackedTranslationHTML(negative, '...', 'Eu não sou um professor.')}`;
                html += `<h5>Interrogativa</h5>${createStackedTranslationHTML(interrogative, '...', 'Eu sou um professor?')}`;
                html += `<h5>Interrogativa Negativa</h5>${createStackedTranslationHTML(interrogativeNegative, '...', 'Eu não sou um professor?')}`;
                html += `<h5>Formas Abreviadas</h5>${createStackedTranslationHTML(contracted, '...', 'Eu sou um professor. (Abreviado)')}`;
                html += createStackedTranslationHTML(negContracted, '...', 'Eu não sou um professor. (Abreviado)');
            });
            html += `</div>`;
        });
        html += '</div>';
        
        // --- SEÇÃO SIMPLE TENSES ---
        html += '<div class="pillar-section"><h3>Simple (com o verbo "work")</h3>';
        ['Present', 'Past', 'Future'].forEach(tense => {
            html += `<div class="pillar-group"><h3>${tense}</h3>`;
             pronouns.forEach(p => {
                html += `<h4>Pronome: ${p.subj}</h4>`;
                let affirmative, negative, interrogative, interrogativeNegative, negContracted;
                const verb = (p.c === 'does') ? 'works' : 'work';
                if (tense === 'Present') {
                    affirmative = `${p.subj} ${verb}.`;
                    negative = `${p.subj} ${p.h} work.`;
                    interrogative = `${p.c.charAt(0).toUpperCase() + p.c.slice(1)} ${p.subj.toLowerCase()} work?`;
                    interrogativeNegative = `${p.c.charAt(0).toUpperCase() + p.c.slice(1)} ${p.subj.toLowerCase()} not work?`;
                    negContracted = `${p.h.charAt(0).toUpperCase() + p.h.slice(1)} ${p.subj.toLowerCase()} work?`;
                } else if (tense === 'Past') {
                    affirmative = `${p.subj} worked.`;
                    negative = `${p.subj} did not work.`;
                    interrogative = `Did ${p.subj.toLowerCase()} work?`;
                    interrogativeNegative = `Did ${p.subj.toLowerCase()} not work?`;
                    negContracted = `Didn't ${p.subj.toLowerCase()} work?`;
                } else { // Future
                    affirmative = `${p.subj} will work.`;
                    negative = `${p.subj} will not work.`;
                    interrogative = `Will ${p.subj.toLowerCase()} work?`;
                    interrogativeNegative = `Will ${p.subj.toLowerCase()} not work?`;
                    negContracted = `Won't ${p.subj.toLowerCase()} work?`;
                }
                html += `<h5>Afirmativa</h5>${createStackedTranslationHTML(affirmative, '...', 'Ele trabalha.')}`;
                html += `<h5>Negativa</h5>${createStackedTranslationHTML(negative, '...', 'Ele não trabalha.')}`;
                html += `<h5>Interrogativa</h5>${createStackedTranslationHTML(interrogative, '...', 'Ele trabalha?')}`;
                html += `<h5>Interrogativa Negativa</h5>${createStackedTranslationHTML(interrogativeNegative, '...', 'Ele não trabalha?')}`;
                html += `<h5>Forma Abreviada (Negativa)</h5>${createStackedTranslationHTML(negContracted, '...', 'Ele não trabalha? (Abreviado)')}`;
            });
            html += `</div>`;
        });
        html += '</div>';

        container.innerHTML = html;
        addTTSListeners(container);
    };


    // --- FUNÇÕES DE RENDERIZAÇÃO E CORE (permanecem as mesmas) ---
    // ... (cole aqui o restante do seu arquivo app.js, pois ele não muda)
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
        body.dataset.theme = currentTheme;
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