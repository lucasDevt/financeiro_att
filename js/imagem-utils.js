/** Redimensiona e comprime uma imagem para reduzir o tamanho armazenado. */
export function comprimirImagem(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();

    leitor.onload = () => {
      const imagem = new Image();

      imagem.onload = () => {
        const tamanhoMaximo = 1000;
        const maiorDimensao = Math.max(imagem.width, imagem.height);
        const escala = Math.min(1, tamanhoMaximo / maiorDimensao);
        const canvas = document.createElement("canvas");

        canvas.width = imagem.width * escala;
        canvas.height = imagem.height * escala;

        const contexto = canvas.getContext("2d");
        if (!contexto) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }

        contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.65));
      };

      imagem.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
      imagem.src = leitor.result;
    };

    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo de imagem."));
    leitor.readAsDataURL(arquivo);
  });
}
