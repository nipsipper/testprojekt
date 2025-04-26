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

function getCategoryIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("categoryId");
}

function getSubcategoryIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("subcategoryId");
}

function displaySubcategories(category) {
  const subcategoryContainer = document.getElementById("subcategory-container");
  if (!subcategoryContainer) {
    console.error("Subcategory-Container nicht gefunden!");
    return;
  }
  subcategoryContainer.innerHTML = "";
  category.subcategories.forEach((subcategory) => {
    const subcategoryCard = `
      <div class="bg-gray-800 p-4 rounded-lg shadow-md">
        <a href="category.html?categoryId=${category.id}&subcategoryId=${subcategory.id}" class="text-xl font-semibold text-blue-400 hover:underline">${subcategory.name}</a>
        <p class="text-gray-400">${subcategory.description}</p>
      </div>
    `;
    subcategoryContainer.innerHTML += subcategoryCard;
  });
}

function displayThreads(threads) {
  const threadContainer = document.getElementById("thread-container");
  if (!threadContainer) {
    console.error("Thread-Container nicht gefunden!");
    return;
  }
  console.log("Threads empfangen:", threads);
  threadContainer.innerHTML = "";
  if (!threads || threads.length === 0) {
    threadContainer.innerHTML = "<p class='text-gray-400'>Keine Threads gefunden.</p>";
    return;
  }
  threads.sort((a, b) => new Date(b.date) - new Date(a.date));
  threads.forEach((thread) => {
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

    const previewText = thread.content
      ? thread.content
          .replace(/```[\s\S]*?```/g, '')
          .replace(/\n/g, ' ')
          .trim()
          .substring(0, 50) + (thread.content.length > 50 ? '...' : '')
      : 'Kein Inhalt';
    const threadRow = `
      <div class="flex justify-between p-4 border-b border-gray-700">
        <div>
          <p class="text-sm text-gray-400 mb-1">${categoryName} > ${subcategoryName}</p>
          <a href="thread.html?threadId=${thread._id}" class="text-blue-400 font-medium">${thread.title}</a>
          <p class="text-sm text-gray-400">
            von ${thread.author}
            <img src="${thread.profilePicture || 'assets/avatar.png'}" alt="Profilbild" class="inline w-6 h-6 rounded-full ml-1">
          </p>
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
  const threadForm = document.getElementById("thread-form");
  const loginPrompt = document.getElementById("login-prompt");
  const userStatus = document.getElementById("user-status");
  const showLoginButton = document.getElementById("show-login-button");
  const showRegisterButton = document.getElementById("show-register-button");
  const logoutButton = document.getElementById("logout-button");

  if (!threadForm || !loginPrompt || !userStatus || !showLoginButton || !showRegisterButton || !logoutButton) {
    console.error("Ein oder mehrere UI-Elemente nicht gefunden!");
    return;
  }

  const subcategoryId = getSubcategoryIdFromUrl();
  if (currentUser && subcategoryId) {
    threadForm.classList.remove("hidden");
    loginPrompt.classList.add("hidden");
  } else if (subcategoryId && !currentUser) {
    threadForm.classList.add("hidden");
    loginPrompt.classList.remove("hidden");
  } else {
    threadForm.classList.add("hidden");
    loginPrompt.classList.add("hidden");
  }

  const profilePicture = localStorage.getItem("profilePicture") || "";
  userStatus.innerHTML = currentUser
    ? `Angemeldet als ${currentUser}${profilePicture ? `<img src="${profilePicture || 'assets/avatar.png'}" alt="Profilbild" class="inline w-8 h-8 rounded-full ml-2">` : ""}`
    : "Nicht angemeldet";
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
      headers: {
        "Content-Type": "application/json",
      },
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
      headers: {
        "Content-Type": "application/json",
      },
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
      localStorage.setItem("profilePicture", data.profilePicture || "");
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
  localStorage.removeItem("profilePicture");
  updateUI();
}

async function fetchThreads() {
  const categoryId = getCategoryIdFromUrl();
  const subcategoryId = getSubcategoryIdFromUrl();
  try {
    let url = "http://localhost:3000/api/threads";
    if (subcategoryId) {
      url += `?subcategoryId=${subcategoryId}`;
    } else if (categoryId) {
      const category = categories.find(cat => cat.id == categoryId);
      if (category) {
        const subcategoryIds = category.subcategories.map(sub => sub.id);
        url += `?categoryId=${categoryId}&subcategoryIds=${subcategoryIds.join(",")}`;
      }
    }
    console.log("Fetch Threads URL:", url);
    const response = await fetch(url);
    console.log("Fetch Threads Status:", response.status);
    if (response.status === 404) {
      alert("Threads-Endpunkt nicht gefunden!");
      return;
    }
    if (!response.ok) {
      throw new Error(`HTTP-Fehler: ${response.status}`);
    }
    const threads = await response.json();
    console.log("Threads geladen:", threads);
    displayThreads(threads);
  } catch (error) {
    console.error("Fehler beim Abrufen der Threads:", error);
    alert("Fehler beim Laden der Threads: " + error.message);
  }
}

async function addThread() {
  const titleInput = document.getElementById("thread-title");
  const contentInput = document.getElementById("thread-content");
  if (!titleInput || !contentInput) {
    console.error("Thread-Titel oder -Inhalt nicht gefunden!");
    return;
  }

  if (!currentUser) {
    alert("Bitte melde dich an, um einen Thread zu erstellen!");
    return;
  }

  if (titleInput.value.trim() === "") {
    alert("Bitte gib einen Titel ein!");
    return;
  }

  const subcategoryId = getSubcategoryIdFromUrl();
  const newThread = {
    title: titleInput.value,
    content: contentInput.value,
    subcategoryId: subcategoryId || null,
  };

  try {
    const response = await fetch("http://localhost:3000/api/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(newThread),
    });

    if (response.status === 401) {
      alert("Sitzung abgelaufen. Bitte melde dich erneut an.");
      logout();
      window.location.href = "index.html";
      return;
    }

    if (response.status === 404) {
      alert("Threads-Endpunkt nicht gefunden!");
      return;
    }

    const data = await response.json();
    if (!response.ok) {
      alert(data.error || "Fehler beim Erstellen des Threads");
      return;
    }

    titleInput.value = "";
    contentInput.value = "";
    fetchThreads();
  } catch (error) {
    console.error("Fehler beim Erstellen des Threads:", error);
    alert("Server nicht erreichbar!");
  }
}

// Emoji- und Code-Funktionen
function setupEmojiAndCode() {
  const emojiButtons = document.querySelectorAll(".emoji-btn");
  const codeButton = document.getElementById("code-btn");
  const contentInput = document.getElementById("thread-content");

  if (!contentInput || !codeButton) {
    console.error("Emoji- oder Code-Elemente nicht gefunden!");
    return;
  }

  emojiButtons.forEach(button => {
    button.addEventListener("click", () => {
      contentInput.value += button.dataset.emoji;
      contentInput.focus();
    });
  });

  codeButton.addEventListener("click", () => {
    const code = prompt("Füge deinen Code ein:");
    if (code) {
      contentInput.value += `\n\`\`\`\n${code}\n\`\`\`\n`;
      contentInput.focus();
    }
  });
}

// Lade Kategorie und Unterkategorien
function loadCategory() {
  const categoryId = getCategoryIdFromUrl();
  const subcategoryId = getSubcategoryIdFromUrl();
  const categoryTitle = document.getElementById("category-title");
  const breadcrumbContainer = document.getElementById("breadcrumb-container");

  if (!categoryTitle || !breadcrumbContainer) {
    console.error("Category-Title oder Breadcrumb-Container nicht gefunden!");
    return;
  }

  const category = categories.find(cat => cat.id == categoryId);
  if (!category) {
    console.log("Setze Titel: Kategorie nicht gefunden");
    categoryTitle.textContent = "Kategorie nicht gefunden";
    breadcrumbContainer.innerHTML = '<p class="text-gray-400">Startseite</p>';
    return;
  }

  let breadcrumbHtml = `<a href="index.html" class="text-blue-400 hover:underline">Startseite</a> > `;
  breadcrumbHtml += `<a href="category.html?categoryId=${category.id}" class="text-blue-400 hover:underline">${category.name}</a>`;

  if (subcategoryId) {
    const subcategory = category.subcategories.find(sub => sub.id == subcategoryId);
    console.log("Setze Titel:", subcategory ? subcategory.name : "Unterkategorie nicht gefunden");
    categoryTitle.textContent = subcategory ? subcategory.name : "Unterkategorie nicht gefunden";
    if (subcategory) {
      breadcrumbHtml += ` > <span class="text-gray-400">${subcategory.name}</span>`;
    }
  } else {
    console.log("Setze Titel:", category.name);
    categoryTitle.textContent = category.name;
    displaySubcategories(category);
  }

  breadcrumbContainer.innerHTML = breadcrumbHtml;
}

// Event-Listener
try {
  const backButton = document.getElementById("back-button");
  const showLoginButton = document.getElementById("show-login-button");
  const showRegisterButton = document.getElementById("show-register-button");
  const loginSubmit = document.getElementById("login-submit");
  const registerSubmit = document.getElementById("register-submit");
  const logoutButton = document.getElementById("logout-button");
  const threadSubmit = document.getElementById("thread-submit");

  if (!backButton || !showLoginButton || !showRegisterButton || !loginSubmit || !registerSubmit || !logoutButton || !threadSubmit) {
    console.error("Ein oder mehrere Button-Elemente nicht gefunden!");
  } else {
    backButton.addEventListener("click", () => {
      const categoryId = getCategoryIdFromUrl();
      const subcategoryId = getSubcategoryIdFromUrl();
      if (subcategoryId) {
        window.location.href = `category.html?categoryId=${categoryId}`;
      } else {
        window.location.href = "index.html";
      }
    });
    showLoginButton.addEventListener("click", showLoginForm);
    showRegisterButton.addEventListener("click", showRegisterForm);
    loginSubmit.addEventListener("click", login);
    registerSubmit.addEventListener("click", register);
    logoutButton.addEventListener("click", logout);
    threadSubmit.addEventListener("click", addThread);
  }
} catch (error) {
  console.error("Fehler beim Hinzufügen der Event-Listener:", error);
}

// Lade Seite
window.onload = () => {
  try {
    loadCategory();
    fetchThreads();
    updateUI();
    setupEmojiAndCode();
  } catch (error) {
    console.error("Fehler beim Laden der Seite:", error);
  }
};