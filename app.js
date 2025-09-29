document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');
    const translationToggle = document.getElementById('translation-toggle');
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
    
    // --- FUNÇÃO DE PILARES TOTALMENTE RECONSTRUÍDA ---
    const renderPilares = (container) => {
        const pronouns = [
            { subj: 'I', pt: 'Eu', am: 'am', was: 'was', do: 'do', d_not: "don't", a_not: "am not", w_not: "wasn't" },
            { subj: 'You', pt: 'Você', am: 'are', was: 'were', do: 'do', d_not: "don't", a_not: "aren't", w_not: "weren't" },
            { subj: 'He', pt: 'Ele', am: 'is', was: 'was', do: 'does', d_not: "doesn't", a_not: "isn't", w_not: "wasn't" },
            { subj: 'She', pt: 'Ela', am: 'is', was: 'was', do: 'does', d_not: "doesn't", a_not: "isn't", w_not: "wasn't" },
            { subj: 'It', pt: 'Isso', am: 'is', was: 'was', do: 'does', d_not: "doesn't", a_not: "isn't", w_not: "wasn't" },
            { subj: 'We', pt: 'Nós', am: 'are', was: 'were', do: 'do', d_not: "don't", a_not: "aren't", w_not: "weren't" },
            { subj: 'They', pt: 'Eles', am: 'are', was: 'were', do: 'do', d_not: "don't", a_not: "aren't", w_not: "weren't" }
        ];

        let html = '<h2>⚖️ Pilares Fundamentais</h2>';
        html += `
            <div class="pillar-toggles">
                <button class="pillar-toggle" data-pillar="tobe">To Be</button>
                <button class="pillar-toggle" data-pillar="simple">Simple Tenses</button>
                <button class="pillar-toggle" data-pillar="can">Can / Could</button>
            </div>
            <div id="content-tobe" class="pillar-content"></div>
            <div id="content-simple" class="pillar-content"></div>
            <div id="content-can" class="pillar-content"></div>
        `;
        container.innerHTML = html;

        // --- GERAÇÃO DE CONTEÚDO PARA CADA PILAR ---
        
        // TO BE
        let tobeContent = '<h3>To Be</h3>';
        ['Present', 'Past', 'Future'].forEach(tense => {
            tobeContent += `<div class="pillar-group"><h3>${tense}</h3>`;
            pronouns.forEach(p => {
                tobeContent += `<h4>Pronome: ${p.subj}</h4>`;
                let forms = {};
                if (tense === 'Present') {
                    forms.aff = `${p.subj} ${p.am} happy.`; forms.aff_pt = `${p.pt} ${p.pt === 'Eu' ? 'sou/estou' : 'é/está'} feliz.`;
                    forms.neg = `${p.subj} ${p.am} not happy.`; forms.neg_pt = `${p.pt} não ${p.pt === 'Eu' ? 'sou/estou' : 'é/está'} feliz.`;
                    forms.int = `${p.am.charAt(0).toUpperCase() + p.am.slice(1)} ${p.subj.toLowerCase()} happy?`; forms.int_pt = `${p.pt} ${p.pt === 'Eu' ? 'é/está' : 'é/está'} feliz?`;
                    forms.int_neg = `${p.am.charAt(0).toUpperCase() + p.am.slice(1)} ${p.subj.toLowerCase()} not happy?`; forms.int_neg_pt = `${p.pt} não ${p.pt === 'Eu' ? 'é/está' : 'é/está'} feliz?`;
                    forms.contr = `${p.a_not.charAt(0).toUpperCase() + p.a_not.slice(1)} ${p.subj.toLowerCase()} happy?`; forms.contr_pt = `Forma abreviada interrogativa-negativa.`;
                } else if (tense === 'Past') {
                    forms.aff = `${p.subj} ${p.was} at home.`; forms.aff_pt = `${p.pt} estava em casa.`;
                    forms.neg = `${p.subj} ${p.was} not at home.`; forms.neg_pt = `${p.pt} não estava em casa.`;
                    forms.int = `${p.was.charAt(0).toUpperCase() + p.was.slice(1)} ${p.subj.toLowerCase()} at home?`; forms.int_pt = `${p.pt} estava em casa?`;
                    forms.int_neg = `${p.was.charAt(0).toUpperCase() + p.was.slice(1)} ${p.subj.toLowerCase()} not at home?`; forms.int_neg_pt = `${p.pt} não estava em casa?`;
                    forms.contr = `${p.w_not.charAt(0).toUpperCase() + p.w_not.slice(1)} ${p.subj.toLowerCase()} at home?`; forms.contr_pt = `Forma abreviada interrogativa-negativa.`;
                } else { // Future
                    forms.aff = `${p.subj} will be a doctor.`; forms.aff_pt = `${p.pt} será um(a) médico(a).`;
                    forms.neg = `${p.subj} will not be a doctor.`; forms.neg_pt = `${p.pt} não será um(a) médico(a).`;
                    forms.int = `Will ${p.subj.toLowerCase()} be a doctor?`; forms.int_pt = `${p.pt} será um(a) médico(a)?`;
                    forms.int_neg = `Will ${p.subj.toLowerCase()} not be a doctor?`; forms.int_neg_pt = `${p.pt} não será um(a) médico(a)?`;
                    forms.contr = `Won't ${p.subj.toLowerCase()} be a doctor?`; forms.contr_pt = `Forma abreviada interrogativa-negativa.`;
                }
                 tobeContent += `<h5>Afirmativa</h5>${createStackedTranslationHTML(forms.aff, '...', forms.aff_pt)}`;
                 tobeContent += `<h5>Negativa</h5>${createStackedTranslationHTML(forms.neg, '...', forms.neg_pt)}`;
                 tobeContent += `<h5>Interrogativa</h5>${createStackedTranslationHTML(forms.int, '...', forms.int_pt)}`;
                 tobeContent += `<h5>Interrogativa Negativa</h5>${createStackedTranslationHTML(forms.int_neg, '...', forms.int_neg_pt)}`;
                 tobeContent += `<h5>Abreviada (Int-Neg)</h5>${createStackedTranslationHTML(forms.contr, '...', forms.contr_pt)}`;
            });
            tobeContent += `</div>`;
        });
        document.getElementById('content-tobe').innerHTML = tobeContent;

        // SIMPLE TENSES
        let simpleContent = '<h3>Simple Tenses (com "work")</h3>';
        ['Present', 'Past', 'Future'].forEach(tense => {
            simpleContent += `<div class="pillar-group"><h3>${tense}</h3>`;
            pronouns.forEach(p => {
                simpleContent += `<h4>Pronome: ${p.subj}</h4>`;
                 let forms = {};
                 const verb = (p.do === 'does') ? 'works' : 'work';
                 const verb_pt = (p.do === 'does') ? 'trabalha' : 'trabalha';
                 if (tense === 'Present') {
                    forms.aff = `${p.subj} ${verb}.`; forms.aff_pt = `${p.pt} ${verb_pt}.`;
                    forms.neg = `${p.subj} ${p.d_not} work.`; forms.neg_pt = `${p.pt} não trabalha.`;
                    forms.int = `${p.do.charAt(0).toUpperCase() + p.do.slice(1)} ${p.subj.toLowerCase()} work?`; forms.int_pt = `${p.pt} trabalha?`;
                    forms.int_neg = `${p.do.charAt(0).toUpperCase() + p.do.slice(1)} ${p.subj.toLowerCase()} not work?`; forms.int_neg_pt = `${p.pt} não trabalha?`;
                    forms.contr = `${p.d_not.charAt(0).toUpperCase() + p.d_not.slice(1)} ${p.subj.toLowerCase()} work?`; forms.contr_pt = `Forma abreviada interrogativa-negativa.`;
                 } else if (tense === 'Past') {
                    forms.aff = `${p.subj} worked.`; forms.aff_pt = `${p.pt} trabalhou.`;
                    forms.neg = `${p.subj} did not work.`; forms.neg_pt = `${p.pt} não trabalhou.`;
                    forms.int = `Did ${p.subj.toLowerCase()} work?`; forms.int_pt = `${p.pt} trabalhou?`;
                    forms.int_neg = `Did ${p.subj.toLowerCase()} not work?`; forms.int_neg_pt = `${p.pt} não trabalhou?`;
                    forms.contr = `Didn't ${p.subj.toLowerCase()} work?`; forms.contr_pt = `Forma abreviada interrogativa-negativa.`;
                 } else { // Future
                    forms.aff = `${p.subj} will work.`; forms.aff_pt = `${p.pt} trabalhará.`;
                    forms.neg = `${p.subj} will not work.`; forms.neg_pt = `${p.pt} não trabalhará.`;
                    forms.int = `Will ${p.subj.toLowerCase()} work?`; forms.int_pt = `${p.pt} trabalhará?`;
                    forms.int_neg = `Will ${p.subj.toLowerCase()} not work?`; forms.int_neg_pt = `${p.pt} não trabalhará?`;
                    forms.contr = `Won't ${p.subj.toLowerCase()} work?`; forms.contr_pt = `Forma abreviada interrogativa-negativa.`;
                 }
                 simpleContent += `<h5>Afirmativa</h5>${createStackedTranslationHTML(forms.aff, '...', forms.aff_pt)}`;
                 simpleContent += `<h5>Negativa</h5>${createStackedTranslationHTML(forms.neg, '...', forms.neg_pt)}`;
                 simpleContent += `<h5>Interrogativa</h5>${createStackedTranslationHTML(forms.int, '...', forms.int_pt)}`;
                 simpleContent += `<h5>Interrogativa Negativa</h5>${createStackedTranslationHTML(forms.int_neg, '...', forms.int_neg_pt)}`;
                 simpleContent += `<h5>Abreviada (Int-Neg)</h5>${createStackedTranslationHTML(forms.contr, '...', forms.contr_pt)}`;
            });
            simpleContent += `</div>`;
        });
        document.getElementById('content-simple').innerHTML = simpleContent;

        // CAN / COULD
        let canContent = '<h3>Can / Could / Will be able to</h3>';
        ['Present (Can)', 'Past (Could)', 'Future (Will be able to)'].forEach(tense => {
             canContent += `<div class="pillar-group"><h3>${tense}</h3>`;
             pronouns.forEach(p => {
                canContent += `<h4>Pronome: ${p.subj}</h4>`;
                let forms = {};
                if (tense.includes('Can')) {
                    forms.aff = `${p.subj} can swim.`; forms.aff_pt = `${p.pt} consegue nadar.`;
                    forms.neg = `${p.subj} cannot swim.`; forms.neg_pt = `${p.pt} não consegue nadar.`;
                    forms.int = `Can ${p.subj.toLowerCase()} swim?`; forms.int_pt = `${p.pt} consegue nadar?`;
                    forms.int_neg = `Cannot ${p.subj.toLowerCase()} swim?`; forms.int_neg_pt = `${p.pt} não consegue nadar?`;
                    forms.contr = `Can't ${p.subj.toLowerCase()} swim?`; forms.contr_pt = `Forma abreviada interrogativa-negativa.`;
                } else if (tense.includes('Could')) {
                    forms.aff = `${p.subj} could swim.`; forms.aff_pt = `${p.pt} conseguia nadar.`;
                    forms.neg = `${p.subj} could not swim.`; forms.neg_pt = `${p.pt} não conseguia nadar.`;
                    forms.int = `Could ${p.subj.toLowerCase()} swim?`; forms.int_pt = `${p.pt} conseguia nadar?`;
                    forms.int_neg = `Could ${p.subj.toLowerCase()} not swim?`; forms.int_neg_pt = `${p.pt} não conseguia nadar?`;
                    forms.contr = `Couldn't ${p.subj.toLowerCase()} swim?`; forms.contr_pt = `Forma abreviada interrogativa-negativa.`;
                } else { // Future
                    forms.aff = `${p.subj} will be able to swim.`; forms.aff_pt = `${p.pt} conseguirá nadar.`;
                    forms.neg = `${p.subj} will not be able to swim.`; forms.neg_pt = `${p.pt} não conseguirá nadar.`;
                    forms.int = `Will ${p.subj.toLowerCase()} be able to swim?`; forms.int_pt = `${p.pt} conseguirá nadar?`;
                    forms.int_neg = `Will ${p.subj.toLowerCase()} not be able to swim?`; forms.int_neg_pt = `${p.pt} não conseguirá nadar?`;
                    forms.contr = `Won't ${p.subj.toLowerCase()} be able to swim?`; forms.contr_pt = `Forma abreviada interrogativa-negativa.`;
                }
                 canContent += `<h5>Afirmativa</h5>${createStackedTranslationHTML(forms.aff, '...', forms.aff_pt)}`;
                 canContent += `<h5>Negativa</h5>${createStackedTranslationHTML(forms.neg, '...', forms.neg_pt)}`;
                 canContent += `<h5>Interrogativa</h5>${createStackedTranslationHTML(forms.int, '...', forms.int_pt)}`;
                 canContent += `<h5>Interrogativa Negativa</h5>${createStackedTranslationHTML(forms.int_neg, '...', forms.int_neg_pt)}`;
                 canContent += `<h5>Abreviada (Int-Neg)</h5>${createStackedTranslationHTML(forms.contr, '...', forms.contr_pt)}`;
             });
             canContent += `</div>`;
        });
        document.getElementById('content-can').innerHTML = canContent;


        // Adiciona a lógica de clique para os botões do acordeão
        const pillarToggles = container.querySelectorAll('.pillar-toggle');
        const pillarContents = container.querySelectorAll('.pillar-content');
        pillarToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const pillarName = toggle.dataset.pillar;
                
                // Fecha todos e desativa todos os botões
                pillarToggles.forEach(t => t.classList.remove('active'));
                pillarContents.forEach(c => c.classList.remove('active'));

                // Ativa o clicado
                toggle.classList.add('active');
                document.getElementById(`content-${pillarName}`).classList.add('active');
            });
        });

        addTTSListeners(container);
    };

    // --- FUNÇÕES DE RENDERIZAÇÃO E CORE (O RESTO PERMANECE O MESMO) ---
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
            const isHidden = !itemText.includes(searchTerm);
            item.style.display = isHidden ? 'none' : '';
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