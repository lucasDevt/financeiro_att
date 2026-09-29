import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


const firebaseConfig = {
    apiKey: "AIzaSyBXDBH4gR3ul1FvZFJkM033bPLZHjywvjM",
    authDomain: "financeiro-1c815.firebaseapp.com",
    projectId: "financeiro-1c815",
    storageBucket: "financeiro-1c815.firebasestorage.app",
    messagingSenderId: "1050487088994",
    appId: "1:1050487088994:web:d351162784856630dcae3b"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


export {
    app,
    auth,
    db
};