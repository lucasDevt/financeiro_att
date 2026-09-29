import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    ref,
    set
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


// =========================================
// ELEMENTOS
// =========================================

const telaLogin =
    document.getElementById("telaLogin");

const telaCadastro =
    document.getElementById("telaCadastro");

const loginFlipper =
    document.getElementById("loginFlipper");

const formLogin =
    document.getElementById("formLogin");

const formCadastro =
    document.getElementById("formCadastro");

const btnCriarConta =
    document.getElementById("btnCriarConta");

const btnVoltarLogin =
    document.getElementById("btnVoltarLogin");

const btnEsqueciSenha =
    document.getElementById("btnEsqueciSenha");

const mensagemLogin =
    document.getElementById("mensagemLogin");

const mensagemCadastro =
    document.getElementById("mensagemCadastro");


// =========================================
// TROCAR PARA CADASTRO
// =========================================

btnCriarConta.addEventListener(
    "click",
    function (event) {

        event.preventDefault();

        loginFlipper.classList.add("flipped");

        limparMensagens();

    }
);


// =========================================
// VOLTAR PARA LOGIN
// =========================================

btnVoltarLogin.addEventListener(
    "click",
    function (event) {

        event.preventDefault();

        loginFlipper.classList.remove("flipped");

        limparMensagens();

    }
);


// =========================================
// CRIAR CONTA
// =========================================

formCadastro.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        limparMensagens();


        const nome =
            document
                .getElementById("nomeCadastro")
                .value
                .trim();


        const email =
            document
                .getElementById("emailCadastro")
                .value
                .trim();


        const senha =
            document
                .getElementById("senhaCadastro")
                .value;


        const confirmarSenha =
            document
                .getElementById("confirmarSenha")
                .value;


        // =================================
        // VERIFICA SENHAS
        // =================================

        if (senha !== confirmarSenha) {

            mostrarErro(
                mensagemCadastro,
                "As senhas não coincidem."
            );

            return;

        }


        if (senha.length < 6) {

            mostrarErro(
                mensagemCadastro,
                "A senha precisa ter pelo menos 6 caracteres."
            );

            return;

        }


        const botao =
            document.getElementById("btnCadastro");


        botao.disabled = true;

        botao.textContent =
            "Criando conta...";


        try {

            console.log(
                "1 - Iniciando criação da conta"
            );


            // =================================
            // CRIA USUÁRIO NO AUTHENTICATION
            // =================================

            const resultado =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    senha
                );


            console.log(
                "2 - Usuário criado no Authentication"
            );


            const usuario =
                resultado.user;


            // =================================
            // SALVA O NOME NO AUTHENTICATION
            // =================================

            await updateProfile(
                usuario,
                {
                    displayName: nome
                }
            );


            console.log(
                "3 - Nome atualizado"
            );


            // =================================
            // SALVA USUÁRIO NO REALTIME DATABASE
            // =================================

            await set(
                ref(
                    db,
                    "usuarios/" + usuario.uid
                ),
                {
                    nome: nome,
                    email: email,
                    criadoEm: Date.now()
                }
            );


            console.log(
                "4 - Usuário salvo no Realtime Database"
            );


            // =================================
            // VAI PARA O DASHBOARD
            // =================================

            console.log(
                "5 - Indo para dashboard"
            );


            window.location.href =
                "dashboard.html";


        } catch (erro) {

            console.error(
                "ERRO NO CADASTRO:",
                erro
            );


            mostrarErro(
                mensagemCadastro,
                traduzirErroFirebase(
                    erro.code
                )
            );


            botao.disabled = false;

            botao.textContent =
                "Criar conta";

        }

    }
);


// =========================================
// LOGIN
// =========================================

formLogin.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        limparMensagens();


        const email =
            document
                .getElementById("emailLogin")
                .value
                .trim();


        const senha =
            document
                .getElementById("senhaLogin")
                .value;


        const botao =
            document.getElementById("btnLogin");


        botao.disabled = true;

        botao.textContent =
            "Entrando...";


        try {

            const resultado =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    senha
                );


            const usuario =
                resultado.user;


            console.log(
                "Usuário autenticado:",
                usuario.uid
            );


            // =================================
            // ENTRA NO SISTEMA
            // =================================

            window.location.href =
                "dashboard.html";


        } catch (erro) {

            console.error(
                "Erro no login:",
                erro
            );


            mostrarErro(
                mensagemLogin,
                traduzirErroFirebase(
                    erro.code
                )
            );


            botao.disabled = false;

            botao.textContent =
                "Entrar";

        }

    }
);


// =========================================
// ESQUECI MINHA SENHA
// =========================================

btnEsqueciSenha.addEventListener(
    "click",
    async function (event) {

        event.preventDefault();

        limparMensagens();


        const email =
            document
                .getElementById("emailLogin")
                .value
                .trim();


        if (!email) {

            mostrarErro(
                mensagemLogin,
                "Digite seu e-mail primeiro."
            );

            return;

        }


        try {

            await sendPasswordResetEmail(
                auth,
                email
            );


            mostrarSucesso(
                mensagemLogin,
                "Enviamos um link para redefinir sua senha."
            );


        } catch (erro) {

            console.error(
                "Erro ao recuperar senha:",
                erro
            );


            mostrarErro(
                mensagemLogin,
                traduzirErroFirebase(
                    erro.code
                )
            );

        }

    }
);


// =========================================
// ESTADO DE AUTENTICAÇÃO
// =========================================

onAuthStateChanged(
    auth,
    function (usuario) {

        if (usuario) {

            console.log(
                "Usuário autenticado:",
                usuario.email
            );

        }

    }
);


// =========================================
// MENSAGENS
// =========================================

function mostrarErro(
    elemento,
    mensagem
) {

    elemento.textContent =
        mensagem;

    elemento.style.color =
        "#e05c67";

}


function mostrarSucesso(
    elemento,
    mensagem
) {

    elemento.textContent =
        mensagem;

    elemento.style.color =
        "#1ed760";

}


function limparMensagens() {

    mensagemLogin.textContent =
        "";

    mensagemCadastro.textContent =
        "";

}


// =========================================
// TRADUZIR ERROS FIREBASE
// =========================================

function traduzirErroFirebase(
    codigo
) {

    switch (codigo) {

        case "auth/email-already-in-use":

            return "Este e-mail já possui uma conta.";


        case "auth/invalid-email":

            return "Digite um e-mail válido.";


        case "auth/weak-password":

            return "A senha é muito fraca.";


        case "auth/invalid-credential":

            return "E-mail ou senha incorretos.";


        case "auth/user-not-found":

            return "E-mail ou senha incorretos.";


        case "auth/wrong-password":

            return "E-mail ou senha incorretos.";


        case "auth/too-many-requests":

            return "Muitas tentativas. Aguarde alguns minutos.";


        case "auth/network-request-failed":

            return "Erro de conexão. Verifique sua internet.";


        case "PERMISSION_DENIED":

            return "Você não tem permissão para salvar seus dados.";


        default:

            return "Não foi possível concluir a operação.";

    }

}