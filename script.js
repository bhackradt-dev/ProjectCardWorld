const formCarta = document.getElementById('form-carta');
const selectGame = document.getElementById('card-game');
const inputNome = document.getElementById('nome-carta');
const inputNumero = document.getElementById('numero-carta');
const selectColecao = document.getElementById('colecao-carta');
const inputQtd = document.getElementById('qtd-carta');

let inventario = JSON.parse(localStorage.getItem('tcg_inventario_completo')) || [];
let indiceEmEdicao = -1;

function atualizarCamposPorJogo() {
    if (!selectGame || !selectColecao) return;
    
    const jogoSelecionado = selectGame.value.trim();
    
    if (typeof dadosPorJogo === 'undefined' || !dadosPorJogo[jogoSelecionado]) {
        selectColecao.options.length = 0;
        selectColecao.add(new Option('Sem coleções disponíveis', ''));
        return;
    }
    
    const dados = dadosPorJogo[jogoSelecionado];
    
    if (inputNome && indiceEmEdicao === -1) {
        inputNome.value = '';
        inputNome.placeholder = "Ex: " + (dados.exemploNome || '');
    }
    if (inputNumero && indiceEmEdicao === -1) {
        inputNumero.value = '';
        inputNumero.placeholder = "Ex: " + (dados.exemploNumero || '');
    }

    selectColecao.options.length = 0;
    
    if (dados.colecoes && Array.isArray(dados.colecoes)) {
        dados.colecoes.forEach(col => {
            const valorOpcao = `${col.nome}@@${col.ano}`;
            const textoOpcao = `${col.nome} (${col.ano})`;
            selectColecao.add(new Option(textoOpcao, valorOpcao));
        });
    }
}

function atualizarSistema() {
    atualizarTabelaInventario();
    localStorage.setItem('tcg_inventario_completo', JSON.stringify(inventario));
}

function atualizarTabelaInventario() {
    const conteinerTabelas = document.getElementById('tabela-para-pdf');
    if (!conteinerTabelas) return;
    
    conteinerTabelas.innerHTML = '';

    if (inventario.length === 0) {
        conteinerTabelas.innerHTML = '<p style="text-align: center; color: #777; padding: 20px;">Nenhuma carta cadastrada.</p>';
        return;
    }

    const selectFiltro = document.getElementById('filtro-ordenacao');
    const criterio = selectFiltro ? selectFiltro.value : 'nome-asc';

    const jogos = {};
    inventario.forEach((carta, index) => {
        if (!jogos[carta.jogo]) jogos[carta.jogo] = [];
        jogos[carta.jogo].push({ ...carta, indexOriginal: index });
    });

    Object.keys(jogos).sort().forEach(nomeJogo => {
        const cartasDoJogo = jogos[nomeJogo];

        cartasDoJogo.sort((a, b) => {
            let resultado = 0;

            if (criterio.startsWith('nome')) {
                resultado = a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
            } else if (criterio.startsWith('colecao')) {
                resultado = a.colecao.localeCompare(b.colecao, 'pt-BR', { sensitivity: 'base' });
            } else if (criterio.startsWith('ano')) {
                const anoA = parseInt(a.ano || 0, 10);
                const anoB = parseInt(b.ano || 0, 10);
                
                if (anoA !== anoB) {
                    resultado = anoA - anoB;
                } else {
                    resultado = a.colecao.localeCompare(b.colecao, 'pt-BR', { sensitivity: 'base' });
                }
            } else if (criterio.startsWith('numero')) {
                resultado = a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true, sensitivity: 'base' });
            }

            return criterio.endsWith('desc') ? -resultado : resultado;
        });

        const blocoJogo = document.createElement('div');
        blocoJogo.className = 'bloco-jogo';

        let htmlTabela = `
            <h3>${nomeJogo}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Jogo</th>
                        <th>Nome</th>
                        <th>Número</th>
                        <th>Coleção</th>
                        <th>Ano</th>
                        <th>Qtd</th>
                        <th class="nao-imprimir">Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;

        cartasDoJogo.forEach(carta => {
            htmlTabela += `
                <tr>
                    <td>${carta.jogo}</td>
                    <td>${carta.nome}</td>
                    <td>${carta.numero}</td>
                    <td>${carta.colecao}</td>
                    <td>${carta.ano || '-'}</td>
                    <td>${carta.quantidade}</td>
                    <td class="nao-imprimir">
                        <button type="button" class="btn-editar" onclick="carregarParaEdicao(${carta.indexOriginal})">Editar</button>
                        <button type="button" class="btn-excluir" onclick="removerInventario(${carta.indexOriginal})">Remover</button>
                    </td>
                </tr>
            `;
        });

        htmlTabela += `</tbody></table>`;
        blocoJogo.innerHTML = htmlTabela;
        conteinerTabelas.appendChild(blocoJogo);
    });
}

function carregarParaEdicao(index) {
    const carta = inventario[index];
    if (!carta) return;

    selectGame.value = carta.jogo;
    atualizarCamposPorJogo();

    inputNome.value = carta.nome;
    inputNumero.value = carta.numero;
    
    for (let i = 0; i < selectColecao.options.length; i++) {
        if (selectColecao.options[i].value.startsWith(carta.colecao + "@@")) {
            selectColecao.selectedIndex = i;
            break;
        }
    }

    inputQtd.value = carta.quantidade;
    indiceEmEdicao = index;

    const btnSubmit = formCarta.querySelector('button[type="submit"]');
    if (btnSubmit) btnSubmit.textContent = "Salvar Alteração";

    formCarta.scrollIntoView({ behavior: 'smooth' });
}

if (formCarta) {
    formCarta.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nomeCarta = inputNome.value.trim() || inputNome.placeholder.replace("Ex: ", "");
        const numeroCarta = inputNumero.value.trim() || inputNumero.placeholder.replace("Ex: ", "");

        const valorSelecionado = selectColecao.value;
        const partes = valorSelecionado.split("@@");
        const nomeColecao = partes[0] || "";
        const anoColecao = partes[1] || "";

        if (indiceEmEdicao > -1) {
            inventario[indiceEmEdicao] = {
                jogo: selectGame.value,
                nome: nomeCarta,
                numero: numeroCarta,
                colecao: nomeColecao,
                ano: anoColecao,
                quantidade: parseInt(inputQtd.value) || 1
            };

            indiceEmEdicao = -1;
            const btnSubmit = formCarta.querySelector('button[type="submit"]');
            if (btnSubmit) btnSubmit.textContent = "Cadastrar na Coleção";
        } else {
            const novaCarta = {
                jogo: selectGame.value,
                nome: nomeCarta,
                numero: numeroCarta,
                colecao: nomeColecao,
                ano: anoColecao,
                quantidade: parseInt(inputQtd.value) || 1
            };

            const cartaExistente = inventario.find(c => 
                c.jogo === novaCarta.jogo && 
                c.numero.toLowerCase() === novaCarta.numero.toLowerCase()
            );

            if (cartaExistente) {
                cartaExistente.quantidade += novaCarta.quantidade;
            } else {
                inventario.push(novaCarta);
            }
        }

        formCarta.reset();
        atualizarCamposPorJogo();
        atualizarSistema();
    });
}

function removerInventario(index) {
    inventario.splice(index, 1);
    if (indiceEmEdicao === index) {
        indiceEmEdicao = -1;
        const btnSubmit = formCarta.querySelector('button[type="submit"]');
        if (btnSubmit) btnSubmit.textContent = "Cadastrar na Coleção";
        formCarta.reset();
        atualizarCamposPorJogo();
    }
    atualizarSistema();
}

function gerarPDF() {
    const elementoAlvo = document.getElementById('tabela-para-pdf');

    if (!elementoAlvo || inventario.length === 0) {
        alert("Cadastre pelo menos uma carta antes de exportar o PDF!");
        return;
    }

    const elementosAcao = elementoAlvo.querySelectorAll('.nao-imprimir');
    elementosAcao.forEach(el => el.style.display = 'none');

    const configuracoes = {
        margin: [10, 10, 10, 10],
        filename: 'Colecao_InkPirates.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(configuracoes).from(elementoAlvo).save()
        .then(() => {
            elementosAcao.forEach(el => el.style.display = '');
        })
        .catch(err => {
            console.error("Erro ao gerar PDF:", err);
            elementosAcao.forEach(el => el.style.display = '');
        });
}

document.addEventListener("DOMContentLoaded", () => {
    atualizarCamposPorJogo();
    atualizarSistema();
});

if (selectGame) {
    selectGame.addEventListener('change', atualizarCamposPorJogo);
}