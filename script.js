const formCarta = document.getElementById('form-carta');
const selectGame = document.getElementById('card-game');
const inputNome = document.getElementById('nome-carta');
const inputNumero = document.getElementById('numero-carta');
const selectColecao = document.getElementById('colecao-carta');
const inputQtd = document.getElementById('qtd-carta');

const tabelaInventario = document.getElementById('tabela-inventario');

let inventario = JSON.parse(localStorage.getItem('tcg_inventario_completo')) || [];

document.addEventListener("DOMContentLoaded", () => {
    atualizarCamposPorJogo();
    atualizarSistema();
});

selectGame.addEventListener('change', atualizarCamposPorJogo);

function atualizarCamposPorJogo() {
    const jogoSelecionado = selectGame.value;
    const dados = dadosPorJogo[jogoSelecionado];
    
    if (dados) {
        inputNome.value = '';
        inputNumero.value = '';

        inputNome.placeholder = "Ex: " + dados.exemploNome;
        inputNumero.placeholder = "Ex: " + dados.exemploNumero;

        selectColecao.innerHTML = '';
        dados.colecoes.forEach(col => {
            const option = document.createElement('option');
            option.value = col;
            option.textContent = col;
            selectColecao.appendChild(option);
        });
    }
}

function atualizarSistema() {
    atualizarTabelaInventario();
    salvarDados();
}

function salvarDados() {
    localStorage.setItem('tcg_inventario_completo', JSON.stringify(inventario));
}

function atualizarTabelaInventario() {
    tabelaInventario.innerHTML = '';
    
    inventario.forEach((carta, index) => {
        const linha = document.createElement('tr');
        
        linha.innerHTML = `
            <td>${carta.jogo}</td>
            <td>${carta.nome}</td>
            <td>${carta.numero}</td>
            <td>${carta.colecao}</td>
            <td>${carta.quantidade}</td>
            <td class="nao-imprimir">
                <button class="btn-excluir" onclick="removerInventario(${index})">Remover</button>
            </td>
        `;
        
        tabelaInventario.appendChild(linha);
    });
}

formCarta.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nomeCarta = inputNome.value.trim() || inputNome.placeholder.replace("Ex: ", "");
    const numeroCarta = inputNumero.value.trim() || inputNumero.placeholder.replace("Ex: ", "");

    const novaCarta = {
        jogo: selectGame.value,
        nome: nomeCarta,
        numero: numeroCarta,
        colecao: selectColecao.value,
        quantidade: parseInt(inputQtd.value)
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

function removerInventario(index) {
    inventario.splice(index, 1);
    atualizarSistema();
}

function gerarPDF() {
    const elementoParaPDF = document.getElementById('tabela-para-pdf'); 
    
    const configuracoes = {
        margin: 10,
        filename: 'Minha_Colecao.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(configuracoes).from(elementoParaPDF).save();
}