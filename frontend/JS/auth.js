document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
});

// ✅ Check if someone is logged in already
function checkLoginStatus() {
    const user = JSON.parse(localStorage.getItem("user"));
    const logoutBtn = document.getElementById("logout-btn");
    const loginLink = document.getElementById("login-link");
    const profileContainer = document.getElementById("profile-container");

    if (user) {
        if (logoutBtn) logoutBtn.style.display = "inline-block";
        if (loginLink) loginLink.style.display = "none";

        if (profileContainer) {
            if (user.username === "admin") {
                profileContainer.innerHTML = `<a href="admin.html" id="profile-link">Admin</a>`;
            } else {
                profileContainer.innerHTML = `<a href="profile.html" id="profile-link">Min profil</a>`;
            }
        }
    } else {
        if (logoutBtn) logoutBtn.style.display = "none";
        if (loginLink) loginLink.style.display = "inline-block";
        if (profileContainer) profileContainer.innerHTML = "";
    }
}



// ✅ Signup handler
function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;

    let users = JSON.parse(localStorage.getItem("registeredUsers")) || [];

    const userExists = users.some(user => user.username === username);
    if (userExists) {
        showMessage("Brugernavnet er allerede i brug!");
        return;
    }

    // Tjek om brugeren skal være admin (fx skriv 'admin' som brugernavn for nu)
    const isAdmin = username.toLowerCase() === "admin";

    const newUser = {
        username,
        password,
        isAdmin,
        createdAt: new Date().toLocaleDateString()
    };

    users.push(newUser);
    localStorage.setItem("registeredUsers", JSON.stringify(users));
    showMessage("Bruger oprettet! Du kan nu logge ind.");
}


// ✅ Login handler
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const users = JSON.parse(localStorage.getItem("registeredUsers")) || [];
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        showMessage("Login lykkedes! Du viderestilles...");
        setTimeout(() => {
            if (user.username === "admin") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "index.html";
            }
        }, 1000);
    }    
}


// ✅ Logout function
function logout() {
    localStorage.removeItem("user");
    showMessage("Du er logget ud!");
    setTimeout(() => {
        window.location.href = "login.html";
    }, 1000);
}

// ✅ Reusable message display
function showMessage(msg) {
    const messageEl = document.getElementById("message");
    if (messageEl) {
        messageEl.innerText = msg;
    } else {
        alert(msg); // fallback
    }
}
