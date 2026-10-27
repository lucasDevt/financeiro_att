/**
 * Funções utilitárias compartilhadas entre as telas do sistema.
 */

/** Formata um valor numérico como moeda brasileira. */
export function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

/** Formata um timestamp em data brasileira. */
export function formatarData(timestamp) {
  if (!timestamp) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

/** Escapa caracteres especiais antes de inserir texto em HTML. */
export function escapeHTML(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
