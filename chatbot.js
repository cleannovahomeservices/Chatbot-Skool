const WEBHOOK_URL =
  "https://n8n-n8n.3asuar.easypanel.host/webhook/d220a64c-e44f-40b6-b54f-fc6dfef2ebf3/chat";

document.addEventListener("DOMContentLoaded", () => {
  const chatToggle = document.getElementById("chat-toggle");
  const chatWidget = document.getElementById("chat-widget");
  const chatClose = document.getElementById("chat-close");
  const chatMessages = document.getElementById("chat-messages");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const openChatCta = document.getElementById("open-chat-cta");
  const currentYearEl = document.getElementById("current-year");

  if (currentYearEl) {
    currentYearEl.textContent = String(new Date().getFullYear());
  }

  const state = {
    isOpen: false,
    hasWelcomed: false,
    isSending: false,
    typingEl: null,
  };

  function openChat() {
    if (state.isOpen) return;
    state.isOpen = true;
    chatWidget.classList.add("chat-widget--open");
    chatWidget.setAttribute("aria-hidden", "false");

    if (!state.hasWelcomed) {
      addMessage(
        "Hola, soy tu asistente virtual de Skool. ¿En qué puedo ayudarte hoy?",
        "bot"
      );
      state.hasWelcomed = true;
    }

    chatInput.focus();
  }

  function closeChat() {
    if (!state.isOpen) return;
    state.isOpen = false;
    chatWidget.classList.remove("chat-widget--open");
    chatWidget.setAttribute("aria-hidden", "true");
  }

  function toggleChat() {
    if (state.isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  function scrollToBottom() {
    if (!chatMessages) return;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addMessage(text, sender) {
    if (!chatMessages || !text) return;

    const row = document.createElement("div");
    row.className =
      "chat-message-row " +
      (sender === "user"
        ? "chat-message-row--user"
        : "chat-message-row--bot");

    const bubble = document.createElement("div");
    bubble.className =
      "chat-message " +
      (sender === "user" ? "chat-message--user" : "chat-message--bot");
    bubble.textContent = text;

    row.appendChild(bubble);
    chatMessages.appendChild(row);
    scrollToBottom();
  }

  function setTyping(isTyping) {
    if (!chatMessages) return;

    if (isTyping) {
      if (state.typingEl) return;
      const typing = document.createElement("div");
      typing.className = "chat-typing";
      typing.textContent = "El asistente está escribiendo...";
      state.typingEl = typing;
      chatMessages.appendChild(typing);
      scrollToBottom();
    } else if (state.typingEl) {
      chatMessages.removeChild(state.typingEl);
      state.typingEl = null;
    }
  }

  async function sendMessage(text) {
    if (!text || state.isSending) return;
    state.isSending = true;

    chatInput.value = "";
    chatInput.focus();

    addMessage(text, "user");
    setTyping(true);
    toggleFormDisabled(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        data = {};
      }

      const replyText =
        data.reply ||
        data.message ||
        data.text ||
        "Gracias, hemos recibido tu mensaje.";

      addMessage(replyText, "bot");
    } catch (error) {
      console.error("Error enviando mensaje al webhook:", error);
      addMessage(
        "Ha ocurrido un error al conectar con el asistente. Intenta de nuevo en unos minutos.",
        "bot"
      );
    } finally {
      setTyping(false);
      state.isSending = false;
      toggleFormDisabled(false);
    }
  }

  function toggleFormDisabled(disabled) {
    if (!chatInput) return;
    const submitButton = chatForm.querySelector("button[type='submit']");
    chatInput.disabled = disabled;
    if (submitButton) {
      submitButton.disabled = disabled;
    }
  }

  if (chatToggle) {
    chatToggle.addEventListener("click", () => {
      toggleChat();
    });
  }

  if (chatClose) {
    chatClose.addEventListener("click", () => {
      closeChat();
    });
  }

  if (openChatCta) {
    openChatCta.addEventListener("click", () => {
      openChat();
    });
  }

  if (chatForm) {
    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = chatInput.value.trim();
      if (!value) return;
      openChat();
      sendMessage(value);
    });
  }
});

