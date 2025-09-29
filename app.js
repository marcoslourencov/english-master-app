document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // --- ESTADO DA APLICAÇÃO ---
    let currentTheme = localStorage.getItem('theme') || 'light';
    const contentRendered = new Set();

    // --- INICIALIZAÇÃO ---
    const init = () => {
        setupEventListeners();
        applyTheme();
        activateTab(tabs[0]);
    };

    const setupEventListeners = () => {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => activateTab(tab));
        });
        themeToggle.addEventListener('click', toggleTheme);
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
            const gramaticaData = ['perguntas', 'preposicoes', 'phrasalverbs', 'artigos', 'adjetivos', 'numeros', 'nacionalidades', 'profissoes', 'continuous', 'perfect', 'modais'];
            
            if (tabName === 'pilares') {
                renderPilares(container);
            } else if (tabName === 'regulares' || tabName === 'irregulares') {
                const verbs = await fetchData('verbos.json');
                const type = tabName === 'regulares' ? 'regular' : 'irregular';
                renderVerbs(container, verbs, type);
            } else if (tabName === 'conversacoes') {
                const convos = await fetchData('conversacoes.json');
                renderConversations(container, convos);
            } else if (gramaticaData.includes(tabName)) {
                const gramatica = await fetchData('gramatica.json');
                if (tabName === 'phrasalverbs') {
                    renderPhrasalVerbs(container, gramatica.phrasalverbs);
                } else if (tabName === 'preposicoes') {
                    renderPrepositions(container, gramatica.preposicoes);
                } else {
                    renderGenericList(container, gramatica[tabName], tabName.charAt(0).toUpperCase() + tabName.slice(1));
                }
            } else {
                 container.innerHTML = '<h2>Conteúdo em breve...</h2>';
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

    const renderPrepositions = (container, data) => {
        let html = `<h2>🌍 Preposições</h2>`;
        for (const category in data) {
            html += `<div class="pillar-group"><h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>`; // Ex: Tempo, Lugar
            html += data[category].map(item => `
                 <div class="content-item searchable-item" data-search-term="${item.eng} ${item.por}">
                    ${createStackedTranslationHTML(item.eng, item.ipa, item.por)}
                </div>
            `).join('');
            html += `</div>`;
        }
        container.innerHTML = html;
        addTTSListeners(container);
    };

    const renderPhrasalVerbs = (container, data) => {
        container.innerHTML = `<h2>🔄 Phrasal Verbs (${data.length})</h2><div class="content-grid"></div>`;
        const grid = container.querySelector('.content-grid');
        grid.innerHTML = data.map(item => `
            <div class="content-item searchable-item" data-search-term="${item.verb} ${item.meaning} ${item.example_eng}">
                <h3>${item.verb}</h3>
                <p class="translation-line"><em>Significado: ${item.meaning}</em></p>
                ${createStackedTranslationHTML(item.example_eng, item.ipa, item.example_por)}
            </div>
        `).join('');
        addTTSListeners(container);
    };
    
    const renderPilares = (container) => {
        const pronouns = [
            { subj: 'I', pt: 'Eu' }, { subj: 'You', pt: 'Você' },
            { subj: 'He', pt: 'Ele' }, { subj: 'She', pt: 'Ela' },
            { subj: 'It', pt: 'Isso' }, { subj: 'We', pt: 'Nós' },
            { subj: 'They', pt: 'Eles/Elas' }
        ];
        
        const ptConjugations = {
            'ser/estar': { 'I': 'sou/estou', 'You': 'é/está', 'He': 'é/está', 'She': 'é/está', 'It': 'é/está', 'We': 'somos/estamos', 'They': 'são/estão' },
            'ser/estar_passado': { 'I': 'era/estava', 'You': 'era/estava', 'He': 'era/estava', 'She': 'era/estava', 'It': 'era/estava', 'We': 'éramos/estávamos', 'They': 'eram/estavam' },
            'ser/estar_futuro': { 'I': 'serei/estarei', 'You': 'será/estará', 'He': 'será/estará', 'She': 'será/estará', 'It': 'será/estará', 'We': 'seremos/estaremos', 'They': 'serão/estarão' },
            'trabalhar': { 'I': 'trabalho', 'You': 'trabalha', 'He': 'trabalha', 'She': 'trabalha', 'It': 'trabalha', 'We': 'trabalhamos', 'They': 'trabalham' },
            'trabalhar_passado': { 'I': 'trabalhei', 'You': 'trabalhou', 'He': 'trabalhou', 'She': 'trabalhou', 'It': 'trabalhou', 'We': 'trabalhamos', 'They': 'trabalharam' },
            'trabalhar_futuro': { 'I': 'trabalharei', 'You': 'trabalhará', 'He': 'trabalhará', 'She': 'trabalhará', 'It': 'trabalhará', 'We': 'trabalharemos', 'They': 'trabalharão' },
            'conseguir': { 'I': 'consigo', 'You': 'consegue', 'He': 'consegue', 'She': 'consegue', 'It': 'consegue', 'We': 'conseguimos', 'They': 'conseguem' },
            'conseguir_passado': { 'I': 'conseguia', 'You': 'conseguia', 'He': 'conseguia', 'She': 'conseguia', 'It': 'conseguia', 'We': 'conseguíamos', 'They': 'conseguiam' },
            'conseguir_futuro': { 'I': 'conseguirei', 'You': 'conseguirá', 'He': 'conseguirá', 'She': 'conseguirá', 'It': 'conseguirá', 'We': 'conseguiremos', 'They': 'conseguirão' },
            'ter': { 'I': 'tenho', 'You': 'tem', 'He': 'tem', 'She': 'tem', 'It': 'tem', 'We': 'temos', 'They': 'têm' },
            'ter_passado': { 'I': 'tive', 'You': 'teve', 'He': 'teve', 'She': 'teve', 'It': 'teve', 'We': 'tivemos', 'They': 'tiveram' },
            'ter_futuro': { 'I': 'terei', 'You': 'terá', 'He': 'terá', 'She': 'terá', 'It': 'terá', 'We': 'teremos', 'They': 'terão' }
        };

        let html = `
            <div class="pillar-toggles">
                <button class="pillar-toggle" data-pillar="tobe">To Be</button>
                <button class="pillar-toggle" data-pillar="simple">Simple Tenses</button>
                <button class="pillar-toggle" data-pillar="can">Can / Could</button>
                <button class="pillar-toggle" data-pillar="have">Have</button>
            </div>
            <div id="content-tobe" class="pillar-content"></div>
            <div id="content-simple" class="pillar-content"></div>
            <div id="content-can" class="pillar-content"></div>
            <div id="content-have" class="pillar-content"></div>
        `;
        container.innerHTML = html;

        const generatePillarForms = (p, tense, type, example, example_pt, conj_pt) => {
            const subjLower = p.subj === 'I' ? 'I' : p.subj.toLowerCase();
            const subjUpper = p.subj;
            const ptSubj = p.pt;
            const ptVerb = ptConjugations[conj_pt][p.subj];
            let forms = {};

            if (type === 'tobe') {
                const am = {I:'am',You:'are',He:'is',She:'is',It:'is',We:'are',They:'are'}[subjUpper];
                const am_not_contr = {I:"'m not",You:"aren't",He:"isn't",She:"isn't",It:"isn't",We:"aren't",They:"aren't"}[subjUpper];
                const was = {I:'was',You:'were',He:'was',She:'was',It:'was',We:'were',They:'were'}[subjUpper];
                const was_not_contr = {I:"wasn't",You:"weren't",He:"wasn't",She:"wasn't",It:"wasn't",We:"weren't",They:"weren't"}[subjUpper];
                
                if (tense === 'Present') {
                    forms.aff = { eng: `${subjUpper} ${am} ${example}.`, pt: `${ptSubj} ${ptVerb} ${example_pt}.` };
                    forms.neg = { eng: `${subjUpper} ${am} not ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}.` };
                    forms.int = { eng: `${am.charAt(0).toUpperCase() + am.slice(1)} ${subjLower} ${example}?`, pt: `${ptSubj} ${ptVerb} ${example_pt}?` };
                    forms.int_neg = { eng: `${am.charAt(0).toUpperCase() + am.slice(1)} ${subjLower} not ${example}?`, pt: `${ptSubj} não ${ptVerb} ${example_pt}?` };
                    forms.contr = { eng: `${subjUpper} ${am_not_contr} ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}. (Abreviado)` };
                } else if (tense === 'Past') {
                    forms.aff = { eng: `${subjUpper} ${was} ${example}.`, pt: `${ptSubj} ${ptVerb} ${example_pt}.` };
                    forms.neg = { eng: `${subjUpper} ${was} not ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}.` };
                    forms.int = { eng: `${was.charAt(0).toUpperCase() + was.slice(1)} ${subjLower} ${example}?`, pt: `${ptSubj} ${ptVerb} ${example_pt}?` };
                    forms.int_neg = { eng: `${was.charAt(0).toUpperCase() + was.slice(1)} ${subjLower} not ${example}?`, pt: `${ptSubj} não ${ptVerb} ${example_pt}?` };
                    forms.contr = { eng: `${subjUpper} ${was_not_contr} ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}. (Abreviado)` };
                } else { // Future
                    forms.aff = { eng: `${subjUpper} will be ${example}.`, pt: `${ptSubj} ${ptVerb} ${example_pt}.` };
                    forms.neg = { eng: `${subjUpper} will not be ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}.` };
                    forms.int = { eng: `Will ${subjLower} be ${example}?`, pt: `${ptSubj} ${ptVerb} ${example_pt}?` };
                    forms.int_neg = { eng: `Will ${subjLower} not be ${example}?`, pt: `${ptSubj} não ${ptVerb} ${example_pt}?` };
                    forms.contr = { eng: `${subjUpper} won't be ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}. (Abreviado)` };
                }
            } else if (type === 'simple') {
                 const verb = ['He','She','It'].includes(subjUpper) ? 'works' : 'work';
                 const do_aux = ['He','She','It'].includes(subjUpper) ? 'does' : 'do';
                 const do_not_contr = ['He','She','It'].includes(subjUpper) ? "doesn't" : "don't";
                 if (tense === 'Present') {
                    forms.aff = { eng: `${subjUpper} ${verb} ${example}.`, pt: `${ptSubj} ${ptVerb} ${example_pt}.` };
                    forms.neg = { eng: `${subjUpper} ${do_not_contr} work ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}.` };
                    forms.int = { eng: `${do_aux.charAt(0).toUpperCase() + do_aux.slice(1)} ${subjLower} work ${example}?`, pt: `${ptSubj} ${ptVerb} ${example_pt}?` };
                    forms.int_neg = { eng: `${do_aux.charAt(0).toUpperCase() + do_aux.slice(1)} ${subjLower} not work ${example}?`, pt: `${ptSubj} não ${ptVerb} ${example_pt}?` };
                    forms.contr = forms.neg;
                 } else if (tense === 'Past') {
                    forms.aff = { eng: `${subjUpper} worked ${example}.`, pt: `${ptSubj} ${ptVerb} ${example_pt}.` };
                    forms.neg = { eng: `${subjUpper} did not work ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}.` };
                    forms.int = { eng: `Did ${subjLower} work ${example}?`, pt: `${ptSubj} ${ptVerb} ${example_pt}?` };
                    forms.int_neg = { eng: `Did ${subjLower} not work ${example}?`, pt: `${ptSubj} não ${ptVerb} ${example_pt}?` };
                    forms.contr = { eng: `${subjUpper} didn't work ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}. (Abreviado)` };
                 } else { // Future
                    forms.aff = { eng: `${subjUpper} will work ${example}.`, pt: `${ptSubj} ${ptVerb} ${example_pt}.` };
                    forms.neg = { eng: `${subjUpper} will not work ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}.` };
                    forms.int = { eng: `Will ${subjLower} work ${example}?`, pt: `${ptSubj} ${ptVerb} ${example_pt}?` };
                    forms.int_neg = { eng: `Will ${subjLower} not work ${example}?`, pt: `${ptSubj} não ${ptVerb} ${example_pt}?` };
                    forms.contr = { eng: `${subjUpper} won't work ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}. (Abreviado)` };
                 }
            } else if (type === 'can') {
                 if (tense.includes('Can')) {
                    forms.aff = { eng: `${subjUpper} can ${example}.`, pt: `${ptSubj} ${ptVerb} ${example_pt}.` };
                    forms.neg = { eng: `${subjUpper} cannot ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}.` };
                    forms.int = { eng: `Can ${subjLower} ${example}?`, pt: `${ptSubj} ${ptVerb} ${example_pt}?` };
                    forms.int_neg = { eng: `Can ${subjLower} not ${example}?`, pt: `${ptSubj} não ${ptVerb} ${example_pt}?` };
                    forms.contr = { eng: `${subjUpper} can't ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}. (Abreviado)` };
                 } else if (tense.includes('Could')) {
                    forms.aff = { eng: `${subjUpper} could ${example}.`, pt: `${ptSubj} ${ptVerb} ${example_pt}.` };
                    forms.neg = { eng: `${subjUpper} could not ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}.` };
                    forms.int = { eng: `Could ${subjLower} ${example}?`, pt: `${ptSubj} ${ptVerb} ${example_pt}?` };
                    forms.int_neg = { eng: `Could ${subjLower} not ${example}?`, pt: `${ptSubj} não ${ptVerb} ${example_pt}?` };
                    forms.contr = { eng: `${subjUpper} couldn't ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}. (Abreviado)` };
                 } else { // Future
                    forms.aff = { eng: `${subjUpper} will be able to ${example}.`, pt: `${ptSubj} ${ptVerb} ${example_pt}.` };
                    forms.neg = { eng: `${subjUpper} will not be able to ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}.` };
                    forms.int = { eng: `Will ${subjLower} be able to ${example}?`, pt: `${ptSubj} ${ptVerb} ${example_pt}?` };
                    forms.int_neg = { eng: `Will ${subjLower} not be able to ${example}?`, pt: `${ptSubj} não ${ptVerb} ${example_pt}?` };
                    forms.contr = { eng: `${subjUpper} won't be able to ${example}.`, pt: `${ptSubj} não ${ptVerb} ${example_pt}. (Abreviado)` };
                 }
            } else if (type === 'have') {
                const have = ['He', 'She', 'It'].includes(subjUpper) ? 'has' : 'have';
                const do_aux = ['He', 'She', 'It'].includes(subjUpper) ? 'does' : 'do';
                const dont_aux = ['He', 'She', 'It'].includes(subjUpper) ? "doesn't" : "don't";
                const haveTo = ['He', 'She', 'It'].includes(subjUpper) ? 'has to' : 'have to';
                if(tense.includes('Posse (Presente)')) {
                    forms.aff = { eng: `${subjUpper} ${have} a car.`, pt: `${ptSubj} ${ptVerb} um carro.` };
                    forms.neg = { eng: `${subjUpper} ${dont_aux} have a car.`, pt: `${ptSubj} não ${ptVerb} um carro.` };
                    forms.int = { eng: `${do_aux.charAt(0).toUpperCase() + do_aux.slice(1)} ${subjLower} have a car?`, pt: `${ptSubj} ${ptVerb} um carro?` };
                } else if (tense.includes('Posse (Passado)')) {
                    forms.aff = { eng: `${subjUpper} had a car.`, pt: `${ptSubj} ${ptVerb} um carro.` };
                    forms.neg = { eng: `${subjUpper} didn't have a car.`, pt: `${ptSubj} não ${ptVerb} um carro.` };
                    forms.int = { eng: `Did ${subjLower} have a car?`, pt: `${ptSubj} ${ptVerb} um carro?` };
                } else if (tense.includes('Posse (Futuro)')) {
                    forms.aff = { eng: `${subjUpper} will have a car.`, pt: `${ptSubj} ${ptVerb} um carro.` };
                    forms.neg = { eng: `${subjUpper} won't have a car.`, pt: `${ptSubj} não ${ptVerb} um carro.` };
                    forms.int = { eng: `Will ${subjLower} have a car?`, pt: `${ptSubj} ${ptVerb} um carro?` };
                } else if(tense.includes('Obrigação (Presente)')) {
                    forms.aff = { eng: `${subjUpper} ${haveTo} study.`, pt: `${ptSubj} tem que estudar.` };
                    forms.neg = { eng: `${subjUpper} ${dont_aux} have to study.`, pt: `${ptSubj} não tem que estudar.` };
                    forms.int = { eng: `${do_aux.charAt(0).toUpperCase() + do_aux.slice(1)} ${subjLower} have to study?`, pt: `${ptSubj} tem que estudar?` };
                } else if(tense.includes('Obrigação (Passado)')) {
                    forms.aff = { eng: `${subjUpper} had to travel.`, pt: `${ptSubj} ${ptVerb} que viajar.` };
                    forms.neg = { eng: `${subjUpper} didn't have to travel.`, pt: `${ptSubj} não ${ptVerb} que viajar.` };
                    forms.int = { eng: `Did ${subjLower} have to travel?`, pt: `${ptSubj} ${ptVerb} que viajar?` };
                } else { // Obrigação (Futuro)
                    forms.aff = { eng: `${subjUpper} will have to wait.`, pt: `${ptSubj} ${ptVerb} que esperar.` };
                    forms.neg = { eng: `${subjUpper} won't have to wait.`, pt: `${ptSubj} não ${ptVerb} que esperar.` };
                    forms.int = { eng: `Will ${subjLower} have to wait?`, pt: `${ptSubj} ${ptVerb} que esperar?` };
                }
            }
            
            let content = `<h4>Pronome: ${subjUpper}</h4>`;
            content += `<h5>Afirmativa</h5>${createStackedTranslationHTML(forms.aff.eng, '...', forms.aff.pt)}`;
            content += `<h5>Negativa</h5>${createStackedTranslationHTML(forms.neg.eng, '...', forms.neg.pt)}`;
            content += `<h5>Interrogativa</h5>${createStackedTranslationHTML(forms.int.eng, '...', forms.int.pt)}`;
            if (forms.int_neg) {
                content += `<h5>Interrogativa Negativa</h5>${createStackedTranslationHTML(forms.int_neg.eng, '...', forms.int_neg.pt)}`;
            }
            if (forms.contr) {
                content += `<h5>Abreviada (Negativa)</h5>${createStackedTranslationHTML(forms.contr.eng, '...', forms.contr.pt)}`;
            }
            return content;
        };
        
        document.getElementById('content-tobe').innerHTML = `
            <h3>To Be</h3>
            <div class="pillar-group"><h3>Present</h3> ${pronouns.map(p => generatePillarForms(p, 'Present', 'tobe', 'happy', 'feliz', 'ser/estar')).join('')}</div>
            <div class="pillar-group"><h3>Past</h3> ${pronouns.map(p => generatePillarForms(p, 'Past', 'tobe', 'at home', 'em casa', 'ser/estar_passado')).join('')}</div>
            <div class="pillar-group"><h3>Future</h3> ${pronouns.map(p => generatePillarForms(p, 'Future', 'tobe', 'a doctor', 'um(a) médico(a)', 'ser/estar_futuro')).join('')}</div>
        `;
        document.getElementById('content-simple').innerHTML = `
            <h3>Simple Tenses</h3>
            <div class="pillar-group"><h3>Present</h3> ${pronouns.map(p => generatePillarForms(p, 'Present', 'simple', 'every day', 'todos os dias', 'trabalhar')).join('')}</div>
            <div class="pillar-group"><h3>Past</h3> ${pronouns.map(p => generatePillarForms(p, 'Past', 'simple', 'yesterday', 'ontem', 'trabalhar_passado')).join('')}</div>
            <div class="pillar-group"><h3>Future</h3> ${pronouns.map(p => generatePillarForms(p, 'Future', 'simple', 'tomorrow', 'amanhã', 'trabalhar_futuro')).join('')}</div>
        `;
        document.getElementById('content-can').innerHTML = `
            <h3>Can / Could</h3>
            <div class="pillar-group"><h3>Present (Can)</h3> ${pronouns.map(p => generatePillarForms(p, 'Present (Can)', 'can', 'swim', 'nadar', 'conseguir')).join('')}</div>
            <div class="pillar-group"><h3>Past (Could)</h3> ${pronouns.map(p => generatePillarForms(p, 'Past (Could)', 'can', 'swim', 'nadar', 'conseguir_passado')).join('')}</div>
            <div class="pillar-group"><h3>Future (Will be able to)</h3> ${pronouns.map(p => generatePillarForms(p, 'Future (Will be able to)', 'can', 'swim', 'nadar', 'conseguir_futuro')).join('')}</div>
        `;
        document.getElementById('content-have').innerHTML = `
            <h3>Have</h3>
            <div class="pillar-group"><h3>Posse (Presente)</h3> ${pronouns.map(p => generatePillarForms(p, 'Posse (Presente)', 'have', '', '', 'ter')).join('')}</div>
            <div class="pillar-group"><h3>Posse (Passado)</h3> ${pronouns.map(p => generatePillarForms(p, 'Posse (Passado)', 'have', '', '', 'ter_passado')).join('')}</div>
            <div class="pillar-group"><h3>Posse (Futuro)</h3> ${pronouns.map(p => generatePillarForms(p, 'Posse (Futuro)', 'have', '', '', 'ter_futuro')).join('')}</div>
            <div class="pillar-group"><h3>Obrigação (Presente)</h3> ${pronouns.map(p => generatePillarForms(p, 'Obrigação (Presente)', 'have', '', '', 'ter')).join('')}</div>
            <div class="pillar-group"><h3>Obrigação (Passado)</h3> ${pronouns.map(p => generatePillarForms(p, 'Obrigação (Passado)', 'have', '', '', 'ter_passado')).join('')}</div>
            <div class="pillar-group"><h3>Obrigação (Futuro)</h3> ${pronouns.map(p => generatePillarForms(p, 'Obrigação (Futuro)', 'have', '', '', 'ter_futuro')).join('')}</div>
        `;

        const pillarToggles = container.querySelectorAll('.pillar-toggle');
        const pillarContents = container.querySelectorAll('.pillar-content');
        pillarToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const pillarName = toggle.dataset.pillar;
                const isAlreadyActive = toggle.classList.contains('active');
                pillarToggles.forEach(t => t.classList.remove('active'));
                pillarContents.forEach(c => c.classList.remove('active'));
                if (!isAlreadyActive) {
                    toggle.classList.add('active');
                    document.getElementById(`content-${pillarName}`).classList.add('active');
                }
            });
        });
        addTTSListeners(container);
    };

    const renderVerbs = (container, verbs, type) => {
        const filteredVerbs = verbs.filter(v => v.type === type);
        container.innerHTML = `<h2>Verbos ${type === 'regular' ? 'Regulares' : 'Irregulares'} (${filteredVerbs.length})</h2><div class="content-grid"></div>`;
        const grid = container.querySelector('.content-grid');
        grid.innerHTML = filteredVerbs.map(verb => `
            <div class="content-item searchable-item" data-search-term="${verb.infinitive} ${verb.past} ${verb.participle} ${verb.translation}">
                <h3>${verb.infinitive} / ${verb.past} / ${verb.participle}</h3>
                <p class="translation-line"><em>${verb.translation}</em></p>
                ${createStackedTranslationHTML(verb.present_example.eng, verb.present_example.ipa, verb.present_example