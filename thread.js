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

function getThreadIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("threadId");
}

function displayThread(thread) {
  const threadContainer = document.getElementById("thread-container");
  const breadcrumbContainer = document.getElementById("breadcrumb-container");
  if (!threadContainer || !breadcrumbContainer) {
    console.error("Thread-Container oder Breadcrumb-Container nicht gefunden!");
    return;
  }

  // Breadcrumbs rendern
  let breadcrumbHtml = `<a href="index.html" class="text-blue-400 hover:underline">Startseite</a> > `;
  const category = categories.find(cat => cat.subcategories.some(sub => sub.id == thread.subcategoryId));
  if (category) {
    breadcrumbHtml += `<a href="category.html?categoryId=${category.id}" class="text-blue-400 hover:underline">${category.name}</a>`;
    const subcategory = category.subcategories.find(sub => sub.id == thread.subcategoryId);
    if (subcategory) {
      breadcrumbHtml += ` > <a href="category.html?categoryId=${category.id}&subcategoryId=${subcategory.id}" class="text-blue-400 hover:underline">${subcategory.name}</a>`;
    }
  }
  breadcrumbHtml += ` > <span class="text-gray-400">${thread.title}</span>`;
  breadcrumbContainer.innerHTML = breadcrumbHtml;

  // Reaktionen zählen
  const likeCount = thread.reactions ? thread.reactions.filter(r => r.type === "like").length : 0;
  const heartCount = thread.reactions ? thread.reactions.filter(r => r.type === "heart").length : 0;
  const sadCount = thread.reactions ? thread.reactions.filter(r => r.type === "sad").length : 0;

  // Thread rendern
  threadContainer.innerHTML = `
    <div class="flex bg-gray-700 p-4 rounded mb-4">
      <div class="w-32 flex-shrink-0 mr-4">
        <img src="${thread.profilePicture || 'assets/avatar.png'}" alt="Profilbild" class="w-12 h-12 rounded-full mb-2">
        <p class="text-sm font-semibold text-gray-200">${thread.author}</p>
        <p class="text-sm text-gray-400">Mitglied</p>
      </div>
      <div class="flex-1">
        <h2 class="text-2xl font-semibold mb-2">${thread.title}</h2>
        ${thread.content ? `<p>${thread.content.replace(/\n/g, '<br>').replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 p-2 rounded">$1</pre>')}</p>` : "<p class='text-gray-400'>Kein Inhalt verfügbar.</p>"}
        <div class="flex justify-between mt-4">
          <p class="text-gray-400 text-sm">Erstellt am ${thread.date}</p>
          <div class="flex space-x-2 ${currentUser ? '' : 'hidden'}">
            <button class="reaction-btn bg-gray-600 hover:bg-gray-500 text-lg py-1 px-2 rounded" data-type="like">👍 ${likeCount}</button>
            <button class="reaction-btn bg-gray-600 hover:bg-gray-500 text-lg py-1 px-2 rounded" data-type="heart">❤️ ${heartCount}</button>
            <button class="reaction-btn bg-gray-600 hover:bg-gray-500 text-lg py-1 px-2 rounded" data-type="sad">😢 ${sadCount}</button>
          </div>
        </div>
      </div>
    </div>
    <h3 class="text-xl font-semibold mt-8 mb-4">Antworten</h3>
    <div id="replies-container" class="">
      ${thread.reactions && thread.reactions.length === 0 && thread.replies.length === 0 ? "<p class='text-gray-400'>Noch keine Antworten.</p>" : ""}
    </div>
  `;

  const repliesContainer = document.getElementById("replies-container");
  thread.replies.forEach((reply) => {
    repliesContainer.innerHTML += `
      <div class="flex bg-gray-700 p-4 rounded mb-4">
        <div class="w-32 flex-shrink-0 mr-4">
          <img src="${reply.profilePicture || 'assets/avatar.png'}" alt="Profilbild" class="w-12 h-12 rounded-full mb-2">
          <p class="text-sm font-semibold text-gray-200">${reply.author}</p>
          <p class="text-sm text-gray-400">Mitglied</p>
        </div>
        <div class="flex-1">
          <p class="text-gray-400 text-sm mb-2">Antwort von ${reply.author} am ${reply.date}</p>
          <p>${reply.content.replace(/\n/g, '<br>').replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 p-2 rounded">$1</pre>')}</p>
        </div>
      </div>
    `;
  });

  // Reaktions-Event-Listener
  if (currentUser) {
    const reactionButtons = document.querySelectorAll(".reaction-btn");
    reactionButtons.forEach(button => {
      button.addEventListener("click", () => addReaction(button.dataset.type));
    });
  }
}

function updateUI() {
  const replyForm = document.getElementById("reply-form");
  const loginPrompt = document.getElementById("login-prompt");
  const userStatus = document.getElementById("user-status");
  const backButton = document.getElementById("back-button");
  const logoutButton = document.getElementById("logout-button");
  const showLoginButton = document.getElementById("show-login-button");
  const showRegisterButton = document.getElementById("show-register-button");

  if (!replyForm || !loginPrompt || !userStatus || !backButton || !logoutButton || !showLoginButton || !showRegisterButton) {
    console.error("Ein oder mehrere UI-Elemente nicht gefunden!");
    return;
  }

  const profilePicture = localStorage.getItem("profilePicture") || "";
  if (currentUser) {
    replyForm.classList.remove("hidden");
    loginPrompt.classList.add("hidden");
    userStatus.innerHTML = `Angemeldet als ${currentUser}${profilePicture ? `<img src="${profilePicture || 'assets/avatar.png'}" alt="Profilbild" class="inline w-8 h-8 rounded-full ml-2">` : ""}`;
    backButton.classList.remove("hidden");
    logoutButton.classList.remove("hidden");
    showLoginButton.classList.add("hidden");
    showRegisterButton.classList.add("hidden");
  } else {
    replyForm.classList.add("hidden");
    loginPrompt.classList.remove("hidden");
    userStatus.textContent = "Nicht angemeldet";
    backButton.classList.remove("hidden");
    logoutButton.classList.add("hidden");
    showLoginButton.classList.remove("hidden");
    showRegisterButton.classList.remove("hidden");
  }
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

async function fetchThread() {
  const threadId = getThreadIdFromUrl();
  if (!threadId) {
    alert("Kein Thread-ID in der URL!");
    window.location.href = "index.html";
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/threads/${threadId}`);
    console.log("Fetch Thread Status:", response.status);
    if (response.status === 404) {
      alert("Thread nicht gefunden!");
      window.location.href = "index.html";
      return;
    }
    if (!response.ok) {
      throw new Error(`HTTP-Fehler: ${response.status}`);
    }
    const thread = await response.json();
    console.log("Thread geladen:", thread);
    displayThread(thread);
  } catch (error) {
    console.error("Fehler beim Abrufen des Threads:", error);
    alert("Fehler beim Laden des Threads: " + error.message);
    window.location.href = "index.html";
  }
}

async function addReply() {
  if (!currentUser) {
    alert("Bitte melde dich an, um zu antworten!");
    return;
  }

  const threadId = getThreadIdFromUrl();
  const contentInput = document.getElementById("reply-content");
  if (!contentInput || !contentInput.value.trim()) {
    alert("Bitte gib eine Antwort ein!");
    return;
  }

  const reply = { content: contentInput.value };

  try {
    const response = await fetch(`http://localhost:3000/api/threads/${threadId}/replies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(reply),
    });

    if (response.status === 401) {
      alert("Sitzung abgelaufen. Bitte melde dich erneut an.");
      logout();
      window.location.href = "index.html";
      return;
    }

    if (response.status === 404) {
      alert("Thread nicht gefunden!");
      return;
    }

    const data = await response.json();
    if (!response.ok) {
      alert(data.error || "Fehler beim Hinzufügen der Antwort");
      return;
    }

    contentInput.value = "";
    fetchThread();
  } catch (error) {
    console.error("Fehler beim Hinzufügen der Antwort:", error);
    alert("Server nicht erreichbar!");
  }
}

async function addReaction(type) {
  if (!currentUser) {
    alert("Bitte melde dich an, um zu reagieren!");
    return;
  }

  const threadId = getThreadIdFromUrl();
  const reaction = { type };

  try {
    const response = await fetch(`http://localhost:3000/api/threads/${threadId}/reactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(reaction),
    });

    if (response.status === 401) {
      alert("Sitzung abgelaufen. Bitte melde dich erneut an.");
      logout();
      window.location.href = "index.html";
      return;
    }

    if (response.status === 404) {
      alert("Thread nicht gefunden!");
      return;
    }

    const data = await response.json();
    if (!response.ok) {
      alert(data.error || "Fehler beim Hinzufügen der Reaktion");
      return;
    }

    fetchThread();
  } catch (error) {
    console.error("Fehler beim Hinzufügen der Reaktion:", error);
    alert("Server nicht erreichbar!");
  }
}

// Emoji- und Code-Funktionen
function setupEmojiAndCode() {
  const emojiButtons = document.querySelectorAll(".emoji-btn");
  const codeButton = document.getElementById("code-btn");
  const contentInput = document.getElementById("reply-content");

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

// Event-Listener
try {
  const backButton = document.getElementById("back-button");
  const logoutButton = document.getElementById("logout-button");
  const replySubmit = document.getElementById("reply-submit");
  const showLoginButton = document.getElementById("show-login-button");
  const showRegisterButton = document.getElementById("show-register-button");
  const loginSubmit = document.getElementById("login-submit");
  const registerSubmit = document.getElementById("register-submit");

  if (!backButton || !logoutButton || !replySubmit || !showLoginButton || !showRegisterButton || !loginSubmit || !registerSubmit) {
    console.error("Ein oder mehrere Button-Elemente nicht gefunden!");
  } else {
    backButton.addEventListener("click", async () => {
      const threadId = getThreadIdFromUrl();
      try {
        const response = await fetch(`http://localhost:3000/api/threads/${threadId}`);
        if (response.ok) {
          const thread = await response.json();
          const category = categories.find(cat => cat.subcategories.some(sub => sub.id == thread.subcategoryId));
          if (category && thread.subcategoryId) {
            window.location.href = `category.html?categoryId=${category.id}&subcategoryId=${thread.subcategoryId}`;
          } else if (category) {
            window.location.href = `category.html?categoryId=${category.id}`;
          } else {
            window.location.href = "index.html";
          }
        } else {
          window.location.href = "index.html";
        }
      } catch (error) {
        console.error("Fehler beim Abrufen des Threads für Zurück-Navigation:", error);
        window.location.href = "index.html";
      }
    });
    logoutButton.addEventListener("click", logout);
    replySubmit.addEventListener("click", addReply);
    showLoginButton.addEventListener("click", showLoginForm);
    showRegisterButton.addEventListener("click", showRegisterForm);
    loginSubmit.addEventListener("click", login);
    registerSubmit.addEventListener("click", register);
  }
} catch (error) {
  console.error("Fehler beim Hinzufügen der Event-Listener:", error);
}

// Lade Thread beim Start
window.onload = () => {
  try {
    fetchThread();
    updateUI();
    setupEmojiAndCode();
  } catch (error) {
    console.error("Fehler beim Laden der Seite:", error);
  }
};