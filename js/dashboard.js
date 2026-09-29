import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  ref,
  onValue,
  update,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

import { editarProjeto } from "./novo-projeto.js";

// =========================================
// CONFIGURAÇÕES
// =========================================

let projetosAtuais = []

const STATUS = {
  AGUARDANDO: "aguardando",
  NAO_APROVADO: "nao_aprovado",
  CONFIRMADO: "confirmado",
};

const ELEMENTOS = {
  aguardando: "aguardandoProjetos",
  naoAprovado: "naoAprovadosProjetos",
  confirmado: "confirmadosProjetos",
};

// =========================================
// ESTADO
// =========================================

let usuarioAtual = null;

// =========================================
// AUTENTICAÇÃO
// =========================================

onAuthStateChanged(auth, (user) => {
  usuarioAtual = user || null;

  if (!usuarioAtual) {
    limparDashboard();
    return;
  }

  carregarProjetos();
});

// =========================================
// CARREGAR PROJETOS
// =========================================

function carregarProjetos() {
  const projetosRef = ref(db, `projetos/${usuarioAtual.uid}`);

  onValue(projetosRef, (snapshot) => {
    if (!snapshot.exists()) {
      limparDashboard();
      return;
    }

    const dados = snapshot.val();

    const projetos = Object.entries(dados).map(([chave, projeto]) => ({
      ...projeto,
      id: projeto.id || chave,
    }));

    renderizarProjetos(projetos);
  });
}

// =========================================
// ORGANIZAR E RENDERIZAR PROJETOS
// =========================================

function renderizarProjetos(projetos) {
  const projetosPorStatus = {
    [STATUS.AGUARDANDO]: projetos.filter(
      (projeto) => projeto.status === STATUS.AGUARDANDO,
    ),

    [STATUS.NAO_APROVADO]: projetos.filter(
      (projeto) => projeto.status === STATUS.NAO_APROVADO,
    ),

    [STATUS.CONFIRMADO]: projetos.filter(
      (projeto) => projeto.status === STATUS.CONFIRMADO,
    ),
  };

  renderizarColuna(
    ELEMENTOS.aguardando,
    projetosPorStatus[STATUS.AGUARDANDO],
    "Nenhum projeto aguardando aprovação.",
  );

  renderizarColuna(
    ELEMENTOS.naoAprovado,
    projetosPorStatus[STATUS.NAO_APROVADO],
    "Nenhum projeto não aprovado.",
  );

  renderizarColuna(
    ELEMENTOS.confirmado,
    projetosPorStatus[STATUS.CONFIRMADO],
    "Nenhum projeto confirmado.",
  );

  atualizarContadorAguardando(projetosPorStatus[STATUS.AGUARDANDO].length);
}

// =========================================
// RENDERIZAR COLUNA
// =========================================

function renderizarColuna(elementoId, projetos, mensagemVazia) {
  const container = document.getElementById(elementoId);

  if (!container) return;

  container.innerHTML = "";

  if (!projetos.length) {
    mostrarVazio(container, mensagemVazia);

    return;
  }

  projetos.forEach((projeto) => {
    const card = criarCardProjeto(projeto, projeto.status);

    container.appendChild(card);
  });
}

// =========================================
// CONTADOR
// =========================================

function atualizarContadorAguardando(quantidade) {
  const contador = document.getElementById("aguardandoCount");

  if (!contador) return;

  contador.textContent = quantidade;
}

// =========================================
// CRIAR CARD
// =========================================

function criarCardProjeto(projeto, status) {
  const card = document.createElement("div");

  card.className = "dashboard-project-card";

  const imagem = criarImagemProjeto(projeto);

  const botoes = criarBotoesProjeto(projeto, status);

  card.innerHTML = `

        ${imagem}

        <div class="dashboard-card-content">

            <div class="dashboard-card-header">

                <div>

                    <h3>
                        ${escapeHTML(projeto.nome || "Projeto sem nome")}
                    </h3>

                    <span
                        class="dashboard-card-status status-${status}"
                    >
                        ${textoStatus(status)}
                    </span>

                </div>


                <button
                    class="dashboard-card-more"
                    type="button"
                    data-action = "editar"
                    data-id = "${escapeHTML(projeto.id)}"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16">
  <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/>
</svg>
                </button>

            </div>


            <div class="dashboard-card-details">

                <div class="dashboard-detail">

                    <span>
                        ORÇAMENTO
                    </span>

                    <strong>
                        ${formatarMoeda(projeto.orcamento)}
                    </strong>

                </div>


                <div class="dashboard-detail">

                    <span>
                        CRIADO EM
                    </span>

                    <strong>
                        ${formatarData(projeto.criadoEm)}
                    </strong>

                </div>

            </div>


            ${botoes}

        </div>

    `;

  adicionarEventos(card);

  return card;
}

// =========================================
// IMAGEM DO PROJETO
// =========================================

function criarImagemProjeto(projeto) {
  if (projeto.imagem) {
    return `

            <div class="dashboard-card-image">

                <img
                    src="${escapeHTML(projeto.imagem)}"
                    alt=""
                >

            </div>

        `;
  }

  return `

        <div class="dashboard-card-image dashboard-card-placeholder">

            <span>
                ◈
            </span>

        </div>

    `;
}

// =========================================
// BOTÕES DO PROJETO
// =========================================

function criarBotoesProjeto(projeto, status) {
  if (status === STATUS.AGUARDANDO) {
    return `

            <div class="dashboard-card-actions">

                <button
                    class="dashboard-btn dashboard-btn-reject"
                    data-action="rejeitar"
                    data-id="${escapeHTML(projeto.id)}"
                >
                    Não aprovar
                </button>


                <button
                    class="dashboard-btn dashboard-btn-confirm"
                    data-action="confirmar"
                    data-id="${escapeHTML(projeto.id)}"
                >
                    Confirmar projeto
                </button>

            </div>

        `;
  }

  if (status === STATUS.NAO_APROVADO || status === STATUS.CONFIRMADO) {
    return `

            <div class="dashboard-card-actions">

                <button
                    class="dashboard-btn dashboard-btn-back"
                    data-action="aguardar"
                    data-id="${escapeHTML(projeto.id)}"
                >
                    Voltar para análise
                </button>

            </div>

        `;
  }

  return "";
}

// =========================================
// EVENTOS DOS BOTÕES
// =========================================

function adicionarEventos(card) {
  const botoes = card.querySelectorAll("[data-action]");

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => executarAcao(botao));
  });
}

// =========================================
// EXECUTAR AÇÃO
// =========================================

async function executarAcao(botao) {
  const acao = botao.dataset.action;

  const projetoId = botao.dataset.id;

  if (!projetoId) return;

  if (acao === "editar") {
    const projeto = projetosAtuais.find(projeto=>projeto.id === projetoId)
    if (!projetoId) return;
    editarProjeto(projeto);
    return;
  }

  const novoStatus = obterStatusDaAcao(acao);

  if (!novoStatus) return;

  await alterarStatus(projetoId, novoStatus);
}

// =========================================
// DEFINIR NOVO STATUS
// =========================================

function obterStatusDaAcao(acao) {
  const statusPorAcao = {
    confirmar: STATUS.CONFIRMADO,

    rejeitar: STATUS.NAO_APROVADO,

    aguardar: STATUS.AGUARDANDO,
  };

  return statusPorAcao[acao] || null;
}

// =========================================
// ALTERAR STATUS NO FIREBASE
// =========================================

async function alterarStatus(projetoId, novoStatus) {
  if (!usuarioAtual) return;

  try {
    const projetoRef = ref(db, `projetos/${usuarioAtual.uid}/${projetoId}`);

    await update(projetoRef, {
      status: novoStatus,
      atualizadoEm: Date.now(),
    });
  } catch (erro) {
    console.error("Erro ao alterar status:", erro);

    alert("Não foi possível atualizar o projeto.");
  }
}

// =========================================
// TEXTO DO STATUS
// =========================================

function textoStatus(status) {
  const textos = {
    [STATUS.AGUARDANDO]: "Aguardando aprovação",

    [STATUS.CONFIRMADO]: "Projeto confirmado",

    [STATUS.NAO_APROVADO]: "Não aprovado",
  };

  return textos[status] || "Status desconhecido";
}

// =========================================
// ESTADO VAZIO
// =========================================

function mostrarVazio(container, mensagem) {
  container.innerHTML = `

        <div class="dashboard-empty">

            <span>
                ○
            </span>

            <p>
                ${mensagem}
            </p>

        </div>

    `;
}

// =========================================
// LIMPAR DASHBOARD
// =========================================

function limparDashboard() {
  Object.values(ELEMENTOS).forEach((elementoId) => {
    const container = document.getElementById(elementoId);

    if (container) {
      container.innerHTML = "";
    }
  });

  const contador = document.getElementById("aguardandoCount");

  if (contador) {
    contador.textContent = "0";
  }
}

// =========================================
// FORMATAÇÃO DE MOEDA
// =========================================

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

// =========================================
// FORMATAÇÃO DE DATA
// =========================================

function formatarData(timestamp) {
  if (!timestamp) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

// =========================================
// SEGURANÇA
// =========================================

function escapeHTML(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");
}
