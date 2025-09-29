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
            switch (tabName) {
                case 'pilares':
                    renderPilares(container);
                    break;
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
            { subj: 'I', pt: 'Eu' }, { subj: 'You', pt: 'Você' },
            { subj: 'He', pt: 'Ele' }, { subj: 'She', pt: 'Ela' },
            { subj: 'It', pt: 'Isso' }, { subj: 'We', pt: 'Nós' },
            { subj: 'They', pt: 'Eles/Elas' }
        ];
        
        const ptConjugations = {
            // ... (conjugações em português)
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
            // ... (lógica de geração de frases, como na versão anterior)
        };
        
        // Renderiza conteúdo para To Be, Simple, Can...
        
        // --- NOVO CONTEÚDO PARA "HAVE" ---
        let haveContent = `<h3>Have (Posse e Obrigação)</h3>`;
        // Presente (Posse)
        haveContent += `<div class="pillar-group"><h3>Present (Posse)</h3>`;
        pronouns.forEach(p => {
            const have = ['He', 'She', 'It'].includes(p.subj) ? 'has' : 'have';
            const do_aux = ['He', 'She', 'It'].includes(p.subj) ? 'Does' : 'Do';
            const dont_aux = ['He', 'She', 'It'].includes(p.subj) ? "doesn't" : "don't";
            const tem = ['We', 'They'].includes(p.subj) ? 'têm' : 'tem';
            
            haveContent += `<h4>Pronome: ${p.subj}</h4>`;
            haveContent += `<h5>Afirmativa</h5>${createStackedTranslationHTML(`${p.subj} ${have} a car.`, '...', `${p.pt} ${tem} um carro.`)}`;
            haveContent += `<h5>Negativa</h5>${createStackedTranslationHTML(`${p.subj} ${dont_aux} have a car.`, '...', `${p.pt} não ${tem} um carro.`)}`;
            haveContent += `<h5>Interrogativa</h5>${createStackedTranslationHTML(`${do_aux} ${p.subj.toLowerCase()} have a car?`, '...', `${p.pt} ${tem} um carro?`)}`;
        });
        haveContent += `</div>`;

        // Presente (Obrigação)
        haveContent += `<div class="pillar-group"><h3>Present (Obrigação - Have to)</h3>`;
        pronouns.forEach(p => {
            const haveTo = ['He', 'She', 'It'].includes(p.subj) ? 'has to' : 'have to';
            const do_aux = ['He', 'She', 'It'].includes(p.subj) ? 'Does' : 'Do';
            const dont_aux = ['He', 'She', 'It'].includes(p.subj) ? "doesn't" : "don't";
            
            haveContent += `<h4>Pronome: ${p.subj}</h4>`;
            haveContent += `<h5>Afirmativa</h5>${createStackedTranslationHTML(`${p.subj} ${haveTo} study.`, '...', `${p.pt} tem que estudar.`)}`;
            haveContent += `<h5>Negativa</h5>${createStackedTranslationHTML(`${p.subj} ${dont_aux} have to study.`, '...', `${p.pt} não tem que estudar.`)}`;
            haveContent += `<h5>Interrogativa</h5>${createStackedTranslationHTML(`${do_aux} ${p.subj.toLowerCase()} have to study?`, '...', `${p.pt} tem que estudar?`)}`;
        });
        haveContent += `</div>`;
        document.getElementById('content-have').innerHTML = haveContent;

        // Lógica do acordeão
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

    // ... (Restante do código JS permanece o mesmo)
    const renderVerbs = (container, verbs, type) => { /* ... */ };
    const renderConversations = (container, data) => { /* ... */ };
    const renderGenericList = (container, data, title) => { /* ... */ };
    const fetchData = async (file) => { /* ... */ };
    const toggleTheme = () => { /* ... */ };
    const applyTheme = () => { /* ... */ };
    const handleSearch = (e) => { /* ... */ };
    const addTTSListeners = (container) => { /* ... */ };
    const speak = (text, buttonEl) => { /* ... */ };
    
    init();
});