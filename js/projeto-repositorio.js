import { db } from "./firebase.js";
import { ref, push, set, update } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

/** Persiste um novo projeto associado ao usuário autenticado. */
export async function criarProjetoNoBanco({ usuarioId, projeto, orcamento, agora }) {
  const projetosRef = ref(db, `projetos/${usuarioId}`);
  const novoProjetoRef = push(projetosRef);

  const dadosProjeto = {
    id: novoProjetoRef.key,
    nome: projeto.nome,
    imagem: projeto.imagem || null,
    status: "aguardando",
    orcamento,
    secoes: projeto.secoes,
    criadoEm: agora,
    atualizadoEm: agora,
  };

  await set(novoProjetoRef, dadosProjeto);
}

/** Atualiza os dados editáveis de um projeto existente. */
export async function atualizarProjetoNoBanco({ usuarioId, projeto, orcamento, agora }) {
  if (!projeto.id) {
    throw new Error("Projeto sem ID para atualização.");
  }

  const projetoRef = ref(db, `projetos/${usuarioId}/${projeto.id}`);

  await update(projetoRef, {
    nome: projeto.nome,
    imagem: projeto.imagem || null,
    orcamento,
    secoes: projeto.secoes,
    atualizadoEm: agora,
  });
}
