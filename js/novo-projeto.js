import { auth } from "./firebase.js";
import { escapeHTML, formatarMoeda } from "./utils.js";
import { criarProjetoNoBanco, atualizarProjetoNoBanco } from "./projeto-repositorio.js";
import { comprimirImagem } from "./imagem-utils.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

/*
   ESTADO */

let usuarioAtual = null;

let projeto = {
  id: null,
  nome: "",
  imagem: null,
  dataEvento: null,
  secoes: [],
};

let modoEdicao = false;

/*
   AUTENTICAÇÃO */

onAuthStateChanged(auth, (user) => {
  usuarioAtual = user || null;
});

/*
   NOVO PROJETO */

document.addEventListener("DOMContentLoaded", () => {
  const botao = document.getElementById("btnNovoProjeto");

  if (!botao) return;

  botao.addEventListener("click", abrirModalNovoProjeto);
});

/*
   ABRIR NOVO PROJETO */

function abrirModalNovoProjeto() {
  if (!usuarioAtual) {
    alert("Você precisa estar logado.");

    return;
  }

  modoEdicao = false;

  projeto = {
    id: null,

    nome: "",

    imagem: null,

    secoes: [
      {
        id: gerarId(),

        nome: "Tipo do evento",

        descricao: "Escolha uma opção para definir a base do projeto.",

        campos: [
          {
            id: gerarId(),

            nome: "Casamento",

            tipo: "opcao",

            valor: 1500,

            selecionado: false,
          },

          {
            id: gerarId(),

            nome: "Aniversário",

            tipo: "opcao",

            valor: 800,

            selecionado: false,
          },

          {
            id: gerarId(),

            nome: "Formatura",

            tipo: "opcao",

            valor: 1000,

            selecionado: false,
          },
        ],
      },
    ],
  };

  criarModal();
}

/*
   EDITAR PROJETO */

export function editarProjeto(projetoExistente) {
  if (!usuarioAtual) {
    alert("Você precisa estar logado.");

    return;
  }

  if (!projetoExistente) {
    return;
  }

  modoEdicao = true;

  projeto = structuredClone(projetoExistente);

  projeto.id = projetoExistente.id;

  projeto.nome = projetoExistente.nome || "";

  projeto.imagem = projetoExistente.imagem || null;

  projeto.secoes = Array.isArray(projetoExistente.secoes)
    ? projetoExistente.secoes
    : [];

  criarModal();
}

/*
   MODAL PRINCIPAL */

function criarModal() {
  removerModalExistente();

  const overlay = document.createElement("div");

  overlay.id = "novoProjetoOverlay";

  overlay.className = "novo-projeto-overlay";

  overlay.innerHTML = `

        <div class="novo-projeto-modal">

            <div class="novo-projeto-header">

                <div>

                    <span class="novo-projeto-overline">

                        ${modoEdicao ? "EDITAR PROJETO" : "NOVO PROJETO"}

                    </span>


                    <h2>

                        ${modoEdicao ? "Editar projeto" : "Criar novo projeto"}

                    </h2>


                    <p>

                        ${
                          modoEdicao
                            ? "Atualize as informações e valores deste projeto."
                            : "Configure as informações e valores que farão parte deste projeto."
                        }

                    </p>

                </div>


                <button
                    class="novo-projeto-fechar"
                    id="fecharNovoProjeto"
                    type="button"
                >
                    ×
                </button>

            </div>


            <div class="novo-projeto-content">

                <div class="projeto-topo">

                    <div class="campo-nome-projeto">

                        <label>
                            Nome do projeto
                        </label>


                        <input
                            id="nomeProjeto"
                            type="text"
                            maxlength="100"
                            placeholder="Ex.: Casamento Ana e João"
                            value="${escapeHTML(projeto.nome)}"
                        >

                    </div>

                    <div class="campo-nome-projeto">
                        <label for= "dataEventoProjeto">
                          Data e Hora do evento:
                        </label>

                        <input id="dataEventoProjeto" type="datetime-local" 
                        value = "${formatarDataParaInput(projeto.dataEvento)}" required
                        />
                    </div>
                    <div class="imagem-projeto">

                        <label>
                            Imagem do evento
                        </label>


                        <label
                            class="upload-imagem"
                            for="imagemProjeto"
                        >

                            <div id="previewImagem">

                                ${
                                  projeto.imagem
                                    ? `
                                            <img
                                                src="${escapeHTML(
                                                  projeto.imagem,
                                                )}"
                                                alt="Imagem do projeto"
                                            >
                                        `
                                    : `
                                            <span class="upload-icon">
                                                +
                                            </span>

                                            <span>
                                                Adicionar imagem
                                            </span>

                                            <small>
                                                JPG, PNG ou WEBP
                                            </small>
                                        `
                                }

                            </div>

                        </label>


                        <input
                            id="imagemProjeto"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            hidden
                        >

                    </div>

                </div>


                <div id="secoesProjeto"></div>


                <button
                    class="botao-adicionar-secao"
                    id="adicionarSecao"
                    type="button"
                >
                    + Adicionar seção
                </button>

            </div>


            <div class="novo-projeto-footer">

                <div class="orcamento-container">

                    <span>
                        ORÇAMENTO ATUAL
                    </span>


                    <strong id="valorOrcamento">
                        R$ 0,00
                    </strong>

                </div>


                <div class="acoes-projeto">

                    <button
                        class="botao-cancelar"
                        id="cancelarNovoProjeto"
                        type="button"
                    >
                        Cancelar
                    </button>


                    <button
                        class="botao-criar"
                        id="salvarNovoProjeto"
                        type="button"
                    >

                        ${modoEdicao ? "Salvar alterações" : "Criar projeto"}

                    </button>

                </div>

            </div>

        </div>

    `;

  document.body.appendChild(overlay);

  document.body.style.overflow = "hidden";

  requestAnimationFrame(() => {
    overlay.classList.add("ativo");
  });

  renderizarSecoes();

  configurarEventosModal();
}

/*
   EVENTOS PRINCIPAIS */

function configurarEventosModal() {
  document.getElementById("fecharNovoProjeto").onclick = fecharModal;

  document.getElementById("cancelarNovoProjeto").onclick = fecharModal;

  document.getElementById("adicionarSecao").onclick = () =>
    abrirFormularioSecao();

  document.getElementById("salvarNovoProjeto").onclick = salvarProjeto;

  document
    .getElementById("imagemProjeto")
    .addEventListener("change", selecionarImagem);

  document
    .getElementById("novoProjetoOverlay")
    .addEventListener("click", (event) => {
      if (event.target.id === "novoProjetoOverlay") {
        fecharModal();
      }
    });
}

/*
   RENDERIZAR SEÇÕES */

function renderizarSecoes() {
  const container = document.getElementById("secoesProjeto");

  if (!container) return;

  container.innerHTML = "";

  projeto.secoes.forEach((secao, indiceSecao) => {
    const elemento = document.createElement("div");

    elemento.className = "projeto-secao";

    elemento.innerHTML = `

                <div class="secao-header">

                    <div>

                        <h3>
                            ${escapeHTML(secao.nome)}
                        </h3>


                        ${
                          secao.descricao
                            ? `
                                    <p>
                                        ${escapeHTML(secao.descricao)}
                                    </p>
                                `
                            : ""
                        }

                    </div>


                    <div class="secao-acoes">

                        <button
                            type="button"
                            data-editar-secao="${indiceSecao}"
                            title="Editar seção"
                        >
                            ✎
                        </button>


                        <button
                            type="button"
                            data-excluir-secao="${indiceSecao}"
                            title="Excluir seção"
                        >
                            ×
                        </button>

                    </div>

                </div>


                <div class="campos-container">

                    ${renderizarCampos(secao, indiceSecao)}

                </div>


                <button
                    type="button"
                    class="botao-adicionar-campo"
                    data-adicionar-campo="${indiceSecao}"
                >
                    + Adicionar campo
                </button>

            `;

    container.appendChild(elemento);
  });

  configurarEventosSecoes();

  atualizarOrcamento();
}

/*
   RENDERIZAR CAMPOS */

function renderizarCampos(secao, indiceSecao) {
  if (!secao.campos || !secao.campos.length) {
    return `
            <div class="nenhum-campo">
                Nenhum campo adicionado.
            </div>
        `;
  }

  return secao.campos
    .map((campo, indiceCampo) => {
      const podeSelecionar = campo.tipo !== "informacao";

      return `

                    <div
                        class="
                            campo-projeto
                            ${campo.selecionado ? "selecionado" : ""}
                        "
                        data-selecionar-campo="${indiceSecao}:${indiceCampo}"
                    >

                        <div class="campo-info">

                            <div class="campo-titulo">

                                <span>
                                    ${escapeHTML(campo.nome)}
                                </span>


                                ${
                                  campo.tipo === "informacao"
                                    ? ""
                                    : `
                                            <small
                                                style="
                                                    color:#777;
                                                    font-size:8px;
                                                "
                                            >
                                                ${
                                                  campo.tipo === "servico"
                                                    ? "SERVIÇO"
                                                    : "OPÇÃO"
                                                }
                                            </small>
                                        `
                                }

                            </div>


                            <span class="campo-valor">

                                ${
                                  campo.valor > 0
                                    ? formatarMoeda(campo.valor)
                                    : "Sem valor"
                                }

                            </span>

                        </div>


                        ${
                          podeSelecionar
                            ? `
                                    <div
                                        class="campo-selecao-indicador"
                                    >
                                        ✓
                                    </div>
                                `
                            : ""
                        }


                        <button
                            type="button"
                            class="menu-campo"
                            data-menu-campo="${indiceSecao}:${indiceCampo}"
                            title="Opções"
                        >
                            ⋮
                        </button>

                    </div>

                `;
    })
    .join("");
}

/*
   EVENTOS DAS SEÇÕES E CAMPOS */

function configurarEventosSecoes() {
  document.querySelectorAll("[data-adicionar-campo]").forEach((botao) => {
    botao.addEventListener("click", (event) => {
      event.stopPropagation();

      abrirFormularioCampo(Number(botao.dataset.adicionarCampo));
    });
  });

  document.querySelectorAll("[data-editar-secao]").forEach((botao) => {
    botao.addEventListener("click", () => {
      abrirFormularioSecao(Number(botao.dataset.editarSecao));
    });
  });

  document.querySelectorAll("[data-excluir-secao]").forEach((botao) => {
    botao.addEventListener("click", () => {
      excluirSecao(Number(botao.dataset.excluirSecao));
    });
  });

  document.querySelectorAll("[data-selecionar-campo]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest(".menu-campo")) {
        return;
      }

      const [secao, campo] = card.dataset.selecionarCampo
        .split(":")
        .map(Number);

      const objetoCampo = projeto.secoes[secao].campos[campo];

      if (objetoCampo.tipo === "informacao") {
        return;
      }

      objetoCampo.selecionado = !objetoCampo.selecionado;

      renderizarSecoes();
    });
  });

  document.querySelectorAll("[data-menu-campo]").forEach((botao) => {
    botao.addEventListener("click", (event) => {
      event.stopPropagation();

      const [secao, campo] = botao.dataset.menuCampo.split(":").map(Number);

      abrirMenuCampo(secao, campo, botao);
    });
  });
}

/*
   MODAL DE SEÇÃO */

function abrirFormularioSecao(indice = null) {
  const editando = indice !== null;

  const secao = editando ? projeto.secoes[indice] : null;

  criarFormularioModal({
    titulo: editando ? "Editar seção" : "Nova seção",

    descricao: editando
      ? "Altere as informações desta seção."
      : "Crie uma nova categoria para organizar os campos.",

    campos: [
      {
        nome: "nome",

        label: "Nome da seção",

        tipo: "text",

        placeholder: "Ex.: Serviços",

        valor: secao?.nome || "",
      },

      {
        nome: "descricao",

        label: "Descrição",

        tipo: "text",

        placeholder: "Ex.: Serviços contratados para o projeto",

        valor: secao?.descricao || "",
      },
    ],

    salvar: (valores) => {
      if (!valores.nome.trim()) {
        return;
      }

      if (editando) {
        projeto.secoes[indice].nome = valores.nome.trim();

        projeto.secoes[indice].descricao = valores.descricao.trim();
      } else {
        projeto.secoes.push({
          id: gerarId(),

          nome: valores.nome.trim(),

          descricao: valores.descricao.trim(),

          campos: [],
        });
      }

      fecharFormularioModal();

      renderizarSecoes();
    },
  });
}

/*
   MODAL DE CAMPO */

function abrirFormularioCampo(indiceSecao, indiceCampo = null) {
  const editando = indiceCampo !== null;

  const campo = editando
    ? projeto.secoes[indiceSecao].campos[indiceCampo]
    : null;

  criarFormularioCampo({
    titulo: editando ? "Editar campo" : "Adicionar campo",

    descricao: editando
      ? "Altere as informações e o valor deste campo."
      : "Defina o nome, valor e comportamento do campo.",

    campo,

    salvar: (valores) => {
      if (!valores.nome.trim()) {
        return;
      }

      const novoCampo = {
        id: campo?.id || gerarId(),

        nome: valores.nome.trim(),

        tipo: valores.tipo,

        valor: valores.tipo === "informacao" ? 0 : Number(valores.valor) || 0,

        selecionado: campo?.selecionado || false,
      };

      if (editando) {
        projeto.secoes[indiceSecao].campos[indiceCampo] = novoCampo;
      } else {
        projeto.secoes[indiceSecao].campos.push(novoCampo);
      }

      fecharFormularioModal();

      renderizarSecoes();
    },
  });
}

/*
   FORMULÁRIO DE SEÇÃO */

function criarFormularioModal(config) {
  fecharFormularioModal();

  const overlay = document.createElement("div");

  overlay.id = "formularioOverlay";

  overlay.className = "formulario-overlay";

  overlay.innerHTML = `

        <div class="formulario-modal">

            <div class="formulario-modal-header">

                <div>

                    <span class="formulario-modal-kicker">
                        CONFIGURAÇÃO
                    </span>


                    <h3>
                        ${escapeHTML(config.titulo)}
                    </h3>


                    <p>
                        ${escapeHTML(config.descricao)}
                    </p>

                </div>


                <button
                    type="button"
                    class="formulario-fechar"
                    id="fecharFormulario"
                >
                    ×
                </button>

            </div>


            <form id="formularioInterno">

                ${config.campos
                  .map(
                    (campo) => `

                            <div class="form-group">

                                <label>
                                    ${escapeHTML(campo.label)}
                                </label>


                                <input
                                    name="${escapeHTML(campo.nome)}"
                                    type="${escapeHTML(campo.tipo)}"
                                    placeholder="${escapeHTML(
                                      campo.placeholder,
                                    )}"
                                    value="${escapeHTML(campo.valor)}"
                                >

                            </div>

                        `,
                  )
                  .join("")}


                <div class="formulario-acoes">

                    <button
                        type="button"
                        class="formulario-btn cancelar"
                        id="cancelarFormulario"
                    >
                        Cancelar
                    </button>


                    <button
                        type="submit"
                        class="formulario-btn salvar"
                    >
                        Salvar
                    </button>

                </div>

            </form>

        </div>

    `;

  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add("ativo");
  });

  document.getElementById("fecharFormulario").onclick = fecharFormularioModal;

  document.getElementById("cancelarFormulario").onclick = fecharFormularioModal;

  document
    .getElementById("formularioInterno")
    .addEventListener("submit", (event) => {
      event.preventDefault();

      const dados = new FormData(event.target);

      config.salvar({
        nome: dados.get("nome") || "",

        descricao: dados.get("descricao") || "",
      });
    });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      fecharFormularioModal();
    }
  });
}

/*
   FORMULÁRIO DE CAMPO */

function criarFormularioCampo(config) {
  fecharFormularioModal();

  const campo = config.campo;

  const overlay = document.createElement("div");

  overlay.id = "formularioOverlay";

  overlay.className = "formulario-overlay";

  overlay.innerHTML = `

        <div class="formulario-modal">

            <div class="formulario-modal-header">

                <div>

                    <span class="formulario-modal-kicker">
                        CAMPO PERSONALIZÁVEL
                    </span>


                    <h3>
                        ${escapeHTML(config.titulo)}
                    </h3>


                    <p>
                        ${escapeHTML(config.descricao)}
                    </p>

                </div>


                <button
                    type="button"
                    class="formulario-fechar"
                    id="fecharFormulario"
                >
                    ×
                </button>

            </div>


            <form id="formularioInterno">

                <div class="form-group">

                    <label>
                        Nome do campo
                    </label>


                    <input
                        name="nome"
                        type="text"
                        maxlength="70"
                        placeholder="Ex.: Fotografia"
                        value="${escapeHTML(campo?.nome || "")}"
                        required
                    >

                </div>


                <div
                    class="form-group"
                    id="campoValorGroup"
                >

                    <label>
                        Valor
                    </label>


                    <div class="valor-input-wrapper">

                        <span class="valor-prefixo">
                            R$
                        </span>


                        <input
                            name="valor"
                            id="valorCampo"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0,00"
                            value="${campo?.valor || ""}"
                        >

                    </div>

                </div>


                <div class="form-group">

                    <label>
                        Tipo do campo
                    </label>


                    <div class="tipo-opcoes">

                        <label
                            class="
                                tipo-opcao
                                ${
                                  !campo || campo.tipo === "opcao"
                                    ? "ativo"
                                    : ""
                                }
                            "
                        >

                            <input
                                type="radio"
                                name="tipo"
                                value="opcao"
                                hidden
                                ${
                                  !campo || campo.tipo === "opcao"
                                    ? "checked"
                                    : ""
                                }
                            >


                            <strong>
                                Opção
                            </strong>


                            <small>
                                Selecionável
                            </small>

                        </label>


                        <label
                            class="
                                tipo-opcao
                                ${campo?.tipo === "servico" ? "ativo" : ""}
                            "
                        >

                            <input
                                type="radio"
                                name="tipo"
                                value="servico"
                                hidden
                                ${campo?.tipo === "servico" ? "checked" : ""}
                            >


                            <strong>
                                Serviço
                            </strong>


                            <small>
                                Entra no orçamento
                            </small>

                        </label>


                        <label
                            class="
                                tipo-opcao
                                ${campo?.tipo === "informacao" ? "ativo" : ""}
                            "
                        >

                            <input
                                type="radio"
                                name="tipo"
                                value="informacao"
                                hidden
                                ${campo?.tipo === "informacao" ? "checked" : ""}
                            >


                            <strong>
                                Informação
                            </strong>


                            <small>
                                Sem valor
                            </small>

                        </label>

                    </div>

                </div>


                <div class="formulario-acoes">

                    <button
                        type="button"
                        class="formulario-btn cancelar"
                        id="cancelarFormulario"
                    >
                        Cancelar
                    </button>


                    <button
                        type="submit"
                        class="formulario-btn salvar"
                    >
                        Salvar campo
                    </button>

                </div>

            </form>

        </div>

    `;

  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add("ativo");
  });

  const radios = overlay.querySelectorAll('input[name="tipo"]');

  radios.forEach((radio) => {
    radio.addEventListener("change", atualizarTipoVisual);
  });

  atualizarTipoVisual();

  document.getElementById("fecharFormulario").onclick = fecharFormularioModal;

  document.getElementById("cancelarFormulario").onclick = fecharFormularioModal;

  document
    .getElementById("formularioInterno")
    .addEventListener("submit", (event) => {
      event.preventDefault();

      const dados = new FormData(event.target);

      config.salvar({
        nome: dados.get("nome") || "",

        valor: parseFloat(dados.get("valor")) || 0,

        tipo: dados.get("tipo"),
      });
    });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      fecharFormularioModal();
    }
  });
}

/*
   TIPO DO CAMPO */

function atualizarTipoVisual() {
  const overlay = document.getElementById("formularioOverlay");

  if (!overlay) return;

  const tipoSelecionado = overlay.querySelector(
    'input[name="tipo"]:checked',
  )?.value;

  overlay.querySelectorAll(".tipo-opcao").forEach((opcao) => {
    const radio = opcao.querySelector("input");

    opcao.classList.toggle("ativo", radio.checked);
  });

  const valorGroup = document.getElementById("campoValorGroup");

  if (valorGroup) {
    valorGroup.style.opacity = tipoSelecionado === "informacao" ? ".45" : "1";
  }
}

/*
   MENU DO CAMPO */

function abrirMenuCampo(indiceSecao, indiceCampo, botao) {
  const antigo = document.querySelector(".menu-campo-dropdown");

  if (antigo) {
    antigo.remove();
  }

  const menu = document.createElement("div");

  menu.className = "menu-campo-dropdown";

  menu.innerHTML = `

        <button
            type="button"
            data-acao="editar"
        >
            ✎ Editar campo
        </button>


        <button
            type="button"
            data-acao="excluir"
        >
            × Excluir campo
        </button>

    `;

  document.body.appendChild(menu);

  const rect = botao.getBoundingClientRect();

  menu.style.top = `${rect.bottom + 5}px`;

  menu.style.left = `${rect.right - 155}px`;

  menu.querySelector('[data-acao="editar"]').onclick = () => {
    menu.remove();

    abrirFormularioCampo(indiceSecao, indiceCampo);
  };

  menu.querySelector('[data-acao="excluir"]').onclick = () => {
    menu.remove();

    const campo = projeto.secoes[indiceSecao].campos[indiceCampo];

    if (confirm(`Excluir "${campo.nome}"?`)) {
      projeto.secoes[indiceSecao].campos.splice(indiceCampo, 1);

      renderizarSecoes();
    }
  };
}

/*
   EXCLUIR SEÇÃO */

function excluirSecao(indice) {
  if (projeto.secoes.length <= 1) {
    alert("O projeto precisa ter pelo menos uma seção.");

    return;
  }

  const secao = projeto.secoes[indice];

  if (!confirm(`Excluir a seção "${secao.nome}"?`)) {
    return;
  }

  projeto.secoes.splice(indice, 1);

  renderizarSecoes();
}

/*
   ORÇAMENTO */

function calcularOrcamento() {
  let total = 0;

  projeto.secoes.forEach((secao) => {
    secao.campos.forEach((campo) => {
      if (campo.selecionado && campo.tipo !== "informacao") {
        total += Number(campo.valor) || 0;
      }
    });
  });

  return total;
}

function atualizarOrcamento() {
  const elemento = document.getElementById("valorOrcamento");

  if (!elemento) return;

  elemento.textContent = formatarMoeda(calcularOrcamento());
}

/*
   IMAGEM */

async function selecionarImagem(event) {
  const arquivo = event.target.files?.[0];

  if (!arquivo) return;

  if (!arquivo.type.startsWith("image/")) {
    return;
  }

  try {
    const imagem = await comprimirImagem(arquivo);

    projeto.imagem = imagem;

    const preview = document.getElementById("previewImagem");

    if (!preview) return;

    preview.innerHTML = `

            <img
                src="${imagem}"
                alt="Imagem do projeto"
            >

        `;
  } catch (erro) {
    console.error("Erro ao processar imagem:", erro);
  }
}

/*
   SALVAR / ATUALIZAR PROJETO */

async function salvarProjeto() {
  if (!usuarioAtual) return;

  const nomeInput = document.getElementById("nomeProjeto");

  const nome = nomeInput.value.trim();

  if (!nome) {
    nomeInput.focus();

    return;
  }

  const botao = document.getElementById("salvarNovoProjeto");

  if (!botao) return;
  const dataEventoInput = document.getElementById("dataEventoProjeto")
  const dataEventoValor = dataEventoInput?.value
  if (!dataEventoValor){
    alert("Informe a data e o horário do evento.")
    dataEventoInput?.focus()
    return
  }
  const dataEventoTimestamp = new Date(dataEventoValor).getTime()
  if (!Number.isFinite(dataEventoTimestamp)){
    alert("A data e o horário informado são inválidos.");
    dataEventoInput?.focus()
    return
  }

  projeto.dataEvento = dataEventoTimestamp;
  

  botao.disabled = true;

  botao.textContent = modoEdicao ? "Salvando alterações..." : "Salvando...";

  try {
    projeto.nome = nome;

    const agora = Date.now();

    if (modoEdicao) {
      await atualizarProjeto(agora);
    } else {
      await criarProjeto(agora);
    }

    fecharModal();
  } catch (erro) {
    console.error("Erro ao salvar projeto:", erro);

    botao.disabled = false;

    botao.textContent = modoEdicao ? "Salvar alterações" : "Criar projeto";

    alert("Não foi possível salvar o projeto.");
  }
}

/*
   CRIAR PROJETO NO FIREBASE */

async function criarProjeto(agora) {
  await criarProjetoNoBanco({
    usuarioId: usuarioAtual.uid,
    projeto,
    orcamento: calcularOrcamento(),
    agora,
  });
}

/*
   ATUALIZAR PROJETO NO FIREBASE */

async function atualizarProjeto(agora) {
  await atualizarProjetoNoBanco({
    usuarioId: usuarioAtual.uid,
    projeto,
    orcamento: calcularOrcamento(),
    agora,
  });
}

/*
   FECHAR MODAL PRINCIPAL */

function fecharModal() {
  const overlay = document.getElementById("novoProjetoOverlay");

  if (!overlay) return;

  fecharFormularioModal();

  overlay.classList.remove("ativo");

  setTimeout(() => {
    overlay.remove();

    document.body.style.overflow = "";
  }, 180);
}

/*
   FECHAR MODAL SECUNDÁRIO */

function fecharFormularioModal() {
  const overlay = document.getElementById("formularioOverlay");

  if (!overlay) return;

  overlay.classList.remove("ativo");

  setTimeout(() => {
    overlay.remove();
  }, 150);
}

/*
   UTILITÁRIOS LOCAIS */

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function removerModalExistente() {
  const modal = document.getElementById("novoProjetoOverlay");

  if (modal) {
    modal.remove();
  }
}

function formatarDataParaInput(timestamp){
  if (timestamp === null || timestamp === undefined || timestamp === ""){
    return "";
  }

  const data = new Date(Number(timestamp))
  if(Number.isNaN(data.getTime())){
    return "";
  }

  const ajusteFuso = data.getTimezoneOffset()*60000
  return new Date(data.getTime()-ajusteFuso).toISOString().slice(0,16)
}
