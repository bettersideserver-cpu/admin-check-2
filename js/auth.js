const API = "https://admin-check-2.onrender.com/api";
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const error = document.getElementById("error");

document.getElementById("showRegister").onclick = () => {

    loginForm.style.display = "none";
    registerForm.style.display = "block";
    error.textContent = "";

};

document.getElementById("showLogin").onclick = () => {

    registerForm.style.display = "none";
    loginForm.style.display = "block";
    error.textContent = "";

};


// REGISTER

document.getElementById("registerBtn").onclick = async () => {

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();

    if (!name || !email || !password) {

        error.textContent = "Please fill all fields.";
        return;

    }

    const res = await fetch(API + "/register", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            name,
            email,
            password
        })

    });

    const data = await res.json();

    if (data.success) {

        alert("Registration Successful");

        registerForm.style.display = "none";
        loginForm.style.display = "block";

    } else {

        error.textContent = data.message;

    }

};

// LOGIN

document.getElementById("loginBtn").onclick = async () => {

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {

        error.textContent = "Please fill all fields.";
        return;

    }

    const res = await fetch(API + "/login", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            email,
            password
        })

    });

    const data = await res.json();

    if (data.success) {

        localStorage.setItem("token", data.token);
        localStorage.setItem("admin", JSON.stringify(data.admin));

        window.location.href = "admin.html";

    } else {

        error.textContent = data.message;

    }

};