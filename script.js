let currentUser = localStorage.getItem("currentUser") || null;
let token = localStorage.getItem("token") || null;

const categories = [
  {
    id: 1,
    name: "Gaming",
    description: "Diskussionen zu Spielen",
    subcategories: [
      { id: 1.1, name: "Multiplayer", description: "Online-Spiele" },
      { id: 1.2, name: "Singleplayer", description: "Story-basierte Spiele" },
    ],
  },
  {
    id: 2,
    name: "Handel",
    description: "Kaufen/Verkaufen von Items",
    subcategories: [
      { id: 2.1, name: "In-Game Items", description: "Virtuelle Güter" },
      { id: 2.2, name: "Accounts", description: "Spiel-Accounts" },
    ],
  },
  {
    id: 3,
    name: "Tutorials",
    description: "Anleitungen und Guides",
    subcategories: [
      { id: 3.1, name: "YouTube Tutorials", description: "Video-Anleitungen" },
      { id: 3.2, name: "Schritt-für-Schritt", description: "Textbasierte Guides" },
    ],
  },
];

function displayCategories() {
  const categoryContainer = document.getElementById("category-container");
  if (!categoryContainer) {
    console.error("Category-Container nicht gefunden!");
    return;
  }
  categoryContainer.innerHTML = "";
  categories.forEach((category) => {
    const categoryCard = `
      <div class="bg-gray-800 p-4 rounded-lg shadow-md">
        <a href="category.html?categoryId=${category.id}" class="text-xl font-semibold text-blue-400 hover:underline">${category.name}</a>
        <p class="text-gray-400">${category.description}</p>
      </div>
    `;
    categoryContainer.innerHTML += categoryCard;
  });
}

function displayThreads(threads) {
  const threadContainer = document.getElementById("thread-container");
  if (!threadContainer) {
    console.error("Thread-Container nicht gefunden!");
    return;
  }
  threadContainer.innerHTML = "";
  threads.sort((a, b) => new Date(b.date) - new Date(a.date));
  threads.forEach((thread) => {
    // Finde Kategorie und Unterkategorie
    let categoryName = "Unbekannt";
    let subcategoryName = "Unbekannt";
    const category = categories.find(cat => cat.subcategories.some(sub => sub.id == thread.subcategoryId));
    if (category) {
      categoryName = category.name;
      const subcategory = category.subcategories.find(sub => sub.id == thread.subcategoryId);
      if (subcategory) {
        subcategoryName = subcategory.name;
      }
    }

    // Erstelle Vorschau
    const previewText = thread.content
      ? thread.content
          .replace(/```[\s\S]*?```/g, '') // Entferne Codeblöcke
          .replace(/\n/g, ' ') // Entferne Zeilenumbrüche
          .trim()
          .substring(0, 50) + (thread.content.length > 50 ? '...' : '')
      : 'Kein Inhalt';
    const threadRow = `
      <div class="flex justify-between p-4 border-b border-gray-700">
        <div>
          <p class="text-sm text-gray-400 mb-1">${categoryName} > ${subcategoryName}</p>
          <a href="thread.html?threadId=${thread._id}" class="text-blue-400 font-medium">${thread.title}</a>
          <p class="text-sm text-gray-400">von ${thread.author}</p>
          <p class="text-sm text-gray-500">${previewText}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-400">Antworten: ${thread.replies.length}</p>
          <p class="text-sm text-gray-500">${thread.date}</p>
        </div>
      </div>
    `;
    threadContainer.innerHTML += threadRow;
  });
}

function updateUI() {
  const userStatus = document.getElementById("user-status");
  const showLoginButton = document.getElementById("show-login-button");
  const showRegisterButton = document.getElementById("show-register-button");
  const logoutButton = document.getElementById("logout-button");

  if (!userStatus || !showLoginButton || !showRegisterButton || !logoutButton) {
    console.error("Ein oder mehrere UI-Elemente nicht gefunden!");
    return;
  }

  userStatus.textContent = currentUser ? `Angemeldet als ${currentUser}` : "Nicht angemeldet";
  showLoginButton.classList.toggle("hidden", !!currentUser);
  showRegisterButton.classList.toggle("hidden", !!currentUser);
  logoutButton.classList.toggle("hidden", !currentUser);
}

function showLoginForm() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  if (!loginForm || !registerForm) {
    console.error("Login- oder Register-Formular nicht gefunden!");
    return;
  }
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
}

function showRegisterForm() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  if (!loginForm || !registerForm) {
    console.error("Login- oder Register-Formular nicht gefunden!");
    return;
  }
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
}

async function register() {
  const username = document.getElementById("register-username")?.value;
  const password = document.getElementById("register-password")?.value;

  if (!username || !password) {
    alert("Bitte fülle alle Felder aus!");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.status === 404) {
      alert("Registrierungs-Endpunkt nicht gefunden!");
      return;
    }

    const data = await response.json();
    if (response.ok) {
      alert("Registrierung erfolgreich! Bitte melde dich an.");
      document.getElementById("register-form").classList.add("hidden");
      showLoginForm();
    } else {
      alert(data.error || "Fehler bei der Registrierung");
    }
  } catch (error) {
    console.error("Fehler bei der Registrierung:", error);
    alert("Server nicht erreichbar!");
  }
}

async function login() {
  const username = document.getElementById("login-username")?.value;
  const password = document.getElementById("login-password")?.value;

  if (!username || !password) {
    alert("Bitte fülle alle Felder aus!");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.status === 404) {
      alert("Login-Endpunkt nicht gefunden!");
      return;
    }

    const data = await response.json();
    if (response.ok) {
      currentUser = data.username;
      token = data.token;
      localStorage.setItem("currentUser", currentUser);
      localStorage.setItem("token", token);
      updateUI();
      document.getElementById("login-form").classList.add("hidden");
    } else {
      alert(data.error || "Fehler bei der Anmeldung");
    }
  } catch (error) {
    console.error("Fehler bei der Anmeldung:", error);
    alert("Server nicht erreichbar!");
  }
}

function logout() {
  currentUser = null;
  token = null;
  localStorage.removeItem("currentUser");
  localStorage.removeItem("token");
  updateUI();
}

async function fetchThreads() {
  try {
    const response = await fetch("http://localhost:3000/api/threads");
    if (response.status === 404) {
      alert("Threads-Endpunkt nicht gefunden!");
      return;
    }
    const threads = await response.json();
    displayThreads(threads);
  } catch (error) {
    console.error("Fehler beim Abrufen der Threads:", error);
    alert("Server nicht erreichbar!");
  }
}

// Event-Listener
try {
  const showLoginButton = document.getElementById("show-login-button");
  const showRegisterButton = document.getElementById("show-register-button");
  const loginSubmit = document.getElementById("login-submit");
  const registerSubmit = document.getElementById("register-submit");
  const logoutButton = document.getElementById("logout-button");

  if (!showLoginButton || !showRegisterButton || !loginSubmit || !registerSubmit || !logoutButton) {
    console.error("Ein oder mehrere Button-Elemente nicht gefunden!");
  } else {
    showLoginButton.addEventListener("click", showLoginForm);
    showRegisterButton.addEventListener("click", showRegisterForm);
    loginSubmit.addEventListener("click", login);
    registerSubmit.addEventListener("click", register);
    logoutButton.addEventListener("click", logout);
  }
} catch (error) {
  console.error("Fehler beim Hinzufügen der Event-Listener:", error);
}

// Lade Seite
window.onload = () => {
  try {
    displayCategories();
    fetchThreads();
    updateUI();
  } catch (error) {
    console.error("Fehler beim Laden der Seite:", error);
  }
};