const formCarta = document.getElementById('form-carta');
const selectGame = document.getElementById('card-game');
const inputNome = document.getElementById('nome-carta');
const inputNumero = document.getElementById('numero-carta');
const selectColecao = document.getElementById('colecao-carta');
const inputQtd = document.getElementById('qtd-carta');
const tabelaInventario = document.getElementById('tabela-inventario');

let inventario = JSON.parse(localStorage.getItem('tcg_inventario_completo')) || [];

function atualizarCamposPorJogo() {
    if (!selectGame || !selectColecao) return;
    
    const jogoSelecionado = selectGame.value.trim();
    const dados = typeof dadosPorJogo !== 'undefined' ? dadosPorJogo[jogoSelecionado] : null;
    
    if (dados) {
        if (inputNome) {
            inputNome.value = '';
            inputNome.placeholder = "Ex: " + (dados.exemploNome || '');
        }
        if (inputNumero) {
            inputNumero.value = '';
            inputNumero.placeholder = "Ex: " + (dados.exemploNumero || '');
        }

        selectColecao.innerHTML = '';
        if (dados.colecoes && Array.isArray(dados.colecoes)) {
            dados.colecoes.forEach(col => {
                const option = document.createElement('option');
                option.value = col;
                option.textContent = col;
                selectColecao.appendChild(option);
            });
        }
    } else {
        selectColecao.innerHTML = '<option value="">Sem coleções</option>';
    }
}

function atualizarSistema() {
    atualizarTabelaInventario();
    localStorage.setItem('tcg_inventario_completo', JSON.stringify(inventario));
}

function atualizarTabelaInventario() {
    const conteinerTabelas = document.getElementById('tabela-para-pdf') || tabelaInventario;
    if (!conteinerTabelas) return;
    conteinerTabelas.innerHTML = '';

    if (inventario.length === 0) {
        conteinerTabelas.innerHTML = '<p style="text-align: center; color: #777; padding: 20px;">Nenhuma carta cadastrada.</p>';
        return;
    }

    const jogos = {};
    inventario.forEach((carta, index) => {
        if (!jogos[carta.jogo]) jogos[carta.jogo] = [];
        jogos[carta.jogo].push({ ...carta, indexOriginal: index });
    });

    Object.keys(jogos).sort().forEach(nomeJogo => {
        const cartas = jogos[nomeJogo];
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
                        <th>Qtd</th>
                        <th class="nao-imprimir">Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;

        cartas.forEach(carta => {
            htmlTabela += `
                <tr>
                    <td>${carta.jogo}</td>
                    <td>${carta.nome}</td>
                    <td>${carta.numero}</td>
                    <td>${carta.colecao}</td>
                    <td>${carta.quantidade}</td>
                    <td class="nao-imprimir">
                        <button class="btn-excluir" onclick="removerInventario(${carta.indexOriginal})">Remover</button>
                    </td>
                </tr>
            `;
        });

        htmlTabela += `</tbody></table>`;
        blocoJogo.innerHTML = htmlTabela;
        conteinerTabelas.appendChild(blocoJogo);
    });
}

if (formCarta) {
    formCarta.addEventListener('submit', (e) => {
        e.preventDefault();
        const nomeCarta = inputNome.value.trim() || inputNome.placeholder.replace("Ex: ", "");
        const numeroCarta = inputNumero.value.trim() || inputNumero.placeholder.replace("Ex: ", "");

        const novaCarta = {
            jogo: selectGame.value,
            nome: nomeCarta,
            numero: numeroCarta,
            colecao: selectColecao.value,
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

        inputQtd.value = 1;
        atualizarCamposPorJogo();
        atualizarSistema();
    });
}

function removerInventario(index) {
    inventario.splice(index, 1);
    atualizarSistema();
}

function gerarPDF() {
    const tabelaOriginal = document.getElementById('tabela-para-pdf') || tabelaInventario;
    if (!tabelaOriginal || inventario.length === 0) {
        alert("Cadastre pelo menos uma carta antes de exportar o PDF!");
        return;
    }

    const elementosAcao = tabelaOriginal.querySelectorAll('.nao-imprimir');
    elementosAcao.forEach(el => el.style.display = 'none');

    const configuracoes = {
        margin: [10, 10, 10, 10],
        filename: 'Colecao_InkPirates.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(configuracoes).from(tabelaOriginal).save()
        .then(() => elementosAcao.forEach(el => el.style.display = ''))
        .catch(() => elementosAcao.forEach(el => el.style.display = ''));
}

document.addEventListener("DOMContentLoaded", () => {
    atualizarCamposPorJogo();
    atualizarSistema();
});

if (selectGame) {
    selectGame.addEventListener('change', atualizarCamposPorJogo);
}
