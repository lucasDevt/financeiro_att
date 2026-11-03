import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  ref,
  onValue,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

import { editarProjeto } from "./novo-projeto.js";

// =========================================
// CONFIGURAÇÕES
// =========================================

let projetosAtuais = [];

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
      projetosAtuais = [];

      limparDashboard();

      return;
    }

    const dados = snapshot.val();

    projetosAtuais = Object.entries(dados).map(([chave, projeto]) => ({
      ...projeto,
      id: projeto.id || chave,
    }));

    renderizarProjetos(projetosAtuais);
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


        <div class="dashboard-card-menu">

          <button
            class="dashboard-card-more"
            type="button"
            aria-label="Mais opções"
          >

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-three-dots"
              viewBox="0 0 16 16"
            >
              <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/>
            </svg>

          </button>


          <div class="dashboard-card-dropdown">

            <button
              type="button"
              data-action="editar"
              data-id="${escapeHTML(projeto.id)}"
            >

              <span>✏️</span>

              <span>
                Editar
              </span>

            </button>


            <button
              type="button"
              class="dashboard-delete-option"
              data-action="apagar"
              data-id="${escapeHTML(projeto.id)}"
            >

              <span>🗑️</span>

              <span>
                Apagar
              </span>

            </button>

          </div>

        </div>

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

    <div
      class="
        dashboard-card-image
        dashboard-card-placeholder
      "
    >

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
          class="
            dashboard-btn
            dashboard-btn-reject
          "
          data-action="rejeitar"
          data-id="${escapeHTML(projeto.id)}"
        >
          Não aprovar
        </button>


        <button
          class="
            dashboard-btn
            dashboard-btn-confirm
          "
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
          class="
            dashboard-btn
            dashboard-btn-back
          "
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
  const botoesAcao = card.querySelectorAll("[data-action]");

  botoesAcao.forEach((botao) => {
    botao.addEventListener("click", (evento) => {
      evento.stopPropagation();

      executarAcao(botao);
    });
  });

  const botaoMenu = card.querySelector(".dashboard-card-more");

  const menu = card.querySelector(".dashboard-card-dropdown");

  if (!botaoMenu || !menu) return;

  botaoMenu.addEventListener("click", (evento) => {
    evento.stopPropagation();

    document
      .querySelectorAll(".dashboard-card-dropdown.aberto")
      .forEach((outroMenu) => {
        if (outroMenu !== menu) {
          outroMenu.classList.remove("aberto");
        }
      });

    menu.classList.toggle("aberto");
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
    const projeto = projetosAtuais.find((projeto) => projeto.id === projetoId);

    if (!projeto) return;

    editarProjeto(projeto);

    return;
  }

  if (acao === "apagar") {
    await apagarProjeto(projetoId);

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
// APAGAR PROJETO
// =========================================

async function apagarProjeto(projetoId) {
  if (!usuarioAtual) return;

  const confirmou = await abrirModalExcluir();

  if (!confirmou) return;

  try {
    const projetoRef = ref(db, `projetos/${usuarioAtual.uid}/${projetoId}`);

    await remove(projetoRef);
  } catch (erro) {
    console.error("Erro ao apagar projeto:", erro);

    alert("Não foi possível apagar o projeto.");
  }
}
function abrirModalExcluir() {
  return new Promise((resolve) => {
    const modalExistente = document.getElementById("modalExcluirProjeto");

    if (modalExistente) {
      modalExistente.remove();
    }

    const modal = document.createElement("div");

    modal.id = "modalExcluirProjeto";

    modal.className = "modal-excluir-overlay";

    modal.innerHTML = `

      <div class="modal-excluir">

        <div class="modal-excluir-icon">

          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>

            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L10.882 4zM2.5 2a.5.5 0 0 0 0 1h11a.5.5 0 0 0 0-1z"/>
          </svg>

        </div>


        <div class="modal-excluir-content">

          <h2>
            Excluir projeto?
          </h2>

          <p>
            Essa ação não poderá ser desfeita.
            O projeto será removido permanentemente.
          </p>

        </div>


        <div class="modal-excluir-actions">

          <button
            type="button"
            class="modal-excluir-cancelar"
            id="cancelarExclusao"
          >
            Cancelar
          </button>


          <button
            type="button"
            class="modal-excluir-confirmar"
            id="confirmarExclusao"
          >
            Apagar projeto
          </button>

        </div>

      </div>

    `;

    document.body.appendChild(modal);

    const cancelar = modal.querySelector("#cancelarExclusao");

    const confirmar = modal.querySelector("#confirmarExclusao");

    function fechar(resultado) {
      modal.classList.remove("modal-excluir-visivel");

      setTimeout(() => {
        modal.remove();

        resolve(resultado);
      }, 200);
    }

    cancelar.addEventListener("click", () => fechar(false));

    confirmar.addEventListener("click", () => fechar(true));

    modal.addEventListener("click", (evento) => {
      if (evento.target === modal) {
        fechar(false);
      }
    });

    requestAnimationFrame(() => {
      modal.classList.add("modal-excluir-visivel");
    });
  });
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
  projetosAtuais = [];

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
