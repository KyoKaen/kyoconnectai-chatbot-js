class CampingChatbot {

  // =============== Configuration ===============
  static config = {
    PRIMARY_COLOR: '#000000',
    SECONDARY_COLOR: '#F0F4F8',
    USER_MESSAGE_BG: '#28a745', //green
    USER_ICON: 'https://kyoconnectai.com/kyoconnectai_logo.jpg',
    CUSTOMIZED_ICON:'https://kyoconnectai.com/camping-esplanaadi-logo.jpg',
    BOT_ICON: 'https://kyoconnectai.com/camping-esplanaadi-logo.jpg',
    FREQUENT_QUESTIONS: [
      "Check-in and check-out times",
      "Available facilities",
      "Contact Tamara",
      "Site rules",
      "About Parking",
      "Price"
    ],
    COPY: {
      header: "Camping Esplanaadi AI Agent",
      systemMessage: "Please note: You can ask up to <strong>20 questions</strong> about Camping Esplanaadi",
      initialMessage: "Hi! What can I help you with Camping Esplanaadi?",
      inputPlaceholder: "Ask your question...",
      footerHTML: `Powered by <a href="https://kyoconnectai.com/" target="_blank">KyoConnectAI.com</a> |
                   AI can make mistakes. Verify important info with Tamara.`
    },
    behavior: {
      maxQuestions: 20,
      maxContentLength: 1000, // Frontend validation
      limitMessages: {
        lengthExceeded: "Message is too long (max 1000 characters). Please ask a shorter question.",
        questionLimit: "You've reached the daily limit of 20 questions. Please try again tomorrow."
      }
    }
  };

  constructor(config = {}) {

    // Set API endpoint
    this.apiEndpoint = config.apiUrl || window.CAMPING_CHATBOT_API || '/chat';

    this.state = {
      isOpen: false,
      questionCount: 0,
      isProcessing: false // Add processing state
    };

    this.injectStyles();
    this.createDOM();
    this.initEventListeners();
    this.initFrequentQuestions();
    this.loadFontAwesome();
  }

  // =============== Style Injection ===============
  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --primary-color: ${CampingChatbot.config.PRIMARY_COLOR};
        --secondary-color: ${CampingChatbot.config.SECONDARY_COLOR};
        --user-message-bg-color: ${CampingChatbot.config.USER_MESSAGE_BG};
      }

      /* Original container styles preserved */
      #camping-chatbot-container {
        position: fixed;
        bottom: 90px;
        right: 25px;
        width: 420px;
        max-height: 600px;
        background: white;
        border-radius: 15px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 1000;
      }

      #camping-chatbot-header {
        display: flex;
        align-items: center;
        padding: 10px;
        border-bottom: 2px solid var(--secondary-color);
        /* background: var(--primary-color); */
        color: white;
      }


      #camping-chatbot-header h4 {
          margin: 0;
          font-size: 1.1em;
          color: var(--primary-color); //black
      }

      #camping-chatbot-messages {
          flex: 1;
          padding: 10px;
          overflow-y: auto;
          background: var(--secondary-color);
      }

      /* Frequent Questions Section */
      #camping-chatbot-frequent-questions {
          padding: 10px;
          background: #fff;
          border-top: 1px solid var(--secondary-color);
          border-bottom: 1px solid var(--secondary-color);
      }
      #camping-chatbot-frequent-questions h6 {
          // margin-bottom: 6px;
          margin-top: 1px; /* Reduce large space*/
          font-size: 0.9em;
          font-weight: bold;
      }
      #frequentQuestions {
          display: flex;
          flex-wrap: wrap;
      }
      .frequent-question-btn {
          margin: 4px;
          white-space: normal;
          text-align: left;
          font-size: 0.85em;
          border: 1px solid var(--primary-color);
          background: #fff;
          color: var(--primary-color);
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
      }
      .frequent-question-btn:hover {
          background: var(--primary-color);
          color: #fff;
      }

      #camping-chatbot-input-area {
          display: flex;
          padding: 10px;
          border-top: 1px solid var(--secondary-color);
          background: #fff;
      }
      #camping-chatbot-input {
          flex: 1;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
      }
      #camping-chatbot-send {
          background: var(--primary-color);
          color: white;
          border: none;
          padding: 8px 12px;
          margin-left: 8px;
          border-radius: 4px;
          cursor: pointer;
      }

      /* Footer */
      #camping-chatbot-footer {
          text-align: center;
          font-size: 0.8em;
          color: #6c757d;
          padding: 8px;
          border-top: 1px solid var(--secondary-color);
      }
      #camping-chatbot-footer a {
          color: var(--primary-color);
          text-decoration: none;
      }

      /* Floating Toggle Button */
      #chat-toggle {
          position: fixed;
          bottom: 25px;
          right: 25px;
          width: 56px;
          height: 56px;
          background: #000;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          transition: transform 0.3s ease;
          overflow: hidden;
      }
      #chat-toggle img, #chat-toggle i {
          position: absolute;
          transition: opacity 0.3s ease;
      }
      #chat-toggle img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          opacity: 1;
      }
      #chat-toggle i {
          font-size: 1.5em;
          color: white;
          opacity: 0;
      }

      /* Message Styles */
      .system-message {
              background: #fff3cd;
              color: #856404;
              border-radius: 10px;
              padding: 10px;
              margin: 15px 0;
              font-size: 0.9em;
          }
      .message-container {
          display: flex;
          gap: 12px;
          margin: 10px 0;
          max-width: 90%;
      }
      .bot-message-container {
          margin-right: auto;
      }
      .user-message-container {
          margin-left: auto;
          flex-direction: row-reverse;
      }
      .message-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          flex-shrink: 0;
      }
      .message-bubble {
          padding: 8px 12px;
          border-radius: 20px;
          max-width: 80%;
      }
      .bot-message-bubble {
          background: white;
          border: 1px solid #dee2e6;
          font-size: 0.9em;
      }
      .user-message-bubble {
          background: var(--user-message-bg-color);
          color: white;
          font-size: 0.9em;
      }
              /* Loading Animation */
          .loading-dots {
              display: inline-block;
              vertical-align: middle;
          }

          .loading-dots span {
              display: inline-block;
              width: 6px;
              height: 6px;
              margin: 0 2px;
              background-color: #666;
              border-radius: 50%;
              animation: bounce 1.4s infinite ease-in-out;
          }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes bounce {
        0%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-8px); }
      }

      .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
      .loading-dots span:nth-child(2) { animation-delay: -0.16s; }

      .system-message {
    background: #fff3cd;
    color: #856404;
    border-radius: 10px;
    padding: 10px;
    margin: 15px 0;
    font-size: 0.9em;
    animation: fadeIn 0.3s ease;
    }
    `;
    document.head.appendChild(style);
  }

  // =============== DOM Creation ===============
  createDOM() {
    // Main Container
    this.container = document.createElement('div');
    this.container.id = 'camping-chatbot-container';
    this.container.innerHTML = `
      <div id="camping-chatbot-header">
        <img src="${CampingChatbot.config.BOT_ICON}" alt="Chatbot Logo" width="40" height="40" style="border-radius:50%; margin-right:10px;">
        <h4>${CampingChatbot.config.COPY.header}</h4>
      </div>

      <div id="camping-chatbot-messages">
        <div class="system-message">
          ${CampingChatbot.config.COPY.systemMessage}
        </div>
        <div class="message-container bot-message-container">
          <img src="${CampingChatbot.config.BOT_ICON}" class="message-icon" alt="Bot Icon">
          <div class="message-bubble bot-message-bubble">
            ${CampingChatbot.config.COPY.initialMessage}
          </div>
        </div>
      </div>

      <div id="camping-chatbot-frequent-questions">
        <h6>Frequent Questions:</h6>
        <div id="frequentQuestions"></div>
      </div>

      <div id="camping-chatbot-input-area">
        <input type="text" id="camping-chatbot-input" placeholder="${CampingChatbot.config.COPY.inputPlaceholder}">
        <button id="camping-chatbot-send">Send</button>
      </div>

      <div id="camping-chatbot-footer">
        ${CampingChatbot.config.COPY.footerHTML}
      </div>
    `;
    document.body.appendChild(this.container);

    // Toggle Button
    this.toggleButton = document.createElement('button');
    this.toggleButton.id = 'chat-toggle';
    this.toggleButton.innerHTML = `
      <img src="${CampingChatbot.config.CUSTOMIZED_ICON}" alt="Chatbot Logo">
      <i class="fas fa-chevron-down"></i>
    `;
    document.body.appendChild(this.toggleButton);
  }

  // =============== Event Listeners ===============
  initEventListeners() {
    this.toggleButton.addEventListener('click', () => this.toggleChat());
    document.getElementById('camping-chatbot-send').addEventListener('click', () => this.handleSend());
    document.getElementById('camping-chatbot-input').addEventListener('keypress', e => {
      if (e.key === 'Enter') this.handleSend();
    });
  }

  // =============== Core Functionality ===============
  toggleChat() {
    this.state.isOpen = !this.state.isOpen;
    this.container.style.display = this.state.isOpen ? 'flex' : 'none';

    const [img, icon] = this.toggleButton.children;
    img.style.opacity = this.state.isOpen ? '0' : '1';
    icon.style.opacity = this.state.isOpen ? '1' : '0';
  }

  async handleSend() {
    // Prevent concurrent processing
    if (this.state.isProcessing) return;

    const input = document.getElementById('camping-chatbot-input');
    const message = input.value.trim();
    let loading = null; // Declare loading outside try block

    // Frontend validations
    if (!message) return;

    if (message.length > CampingChatbot.config.behavior.maxContentLength) {
      this.addSystemMessage(CampingChatbot.config.behavior.limitMessages.lengthExceeded);
      input.value = '';
      return;
    }

    if (this.state.questionCount >= CampingChatbot.config.behavior.maxQuestions) {
      this.addSystemMessage(CampingChatbot.config.behavior.limitMessages.questionLimit);
      input.value = '';
      return;
    }


    try {
      this.state.isProcessing = true;
      this.toggleUIState(true); // Disable inputs

      // Create loading element after validation
      loading = this.createLoading();
      this.container.querySelector('#camping-chatbot-messages').appendChild(loading);

      this.state.questionCount++;
      this.addMessage(message, 'user');
      input.value = '';

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          session_id: "camping-esplanaadi"
        })
      });

        // Handle non-JSON responses first
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error('Service unavailable - please try again later');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Request failed');
        }

        this.addMessage(data.response, 'bot');

    } catch (error) {
      // Handle network errors or other exceptions
      // Handle different error types
      let userMessage;
      if (error instanceof TypeError) {
        userMessage = 'Connection failed. Please check your network';
      } else if (error.message.includes('Unexpected token')) {
        userMessage = 'Service unavailable, please try again later';
      } else {
        userMessage = error.message;
      }

      this.addSystemMessage(userMessage);

    } finally {
      this.state.isProcessing = false;
      this.toggleUIState(false); // Re-enable inputs
      // Safely remove loading if it exists
      if (loading && loading.parentNode) {
        loading.remove();
      }
    }

  }

  // Add UI state management
  toggleUIState(disabled) {
    const elements = [
      document.getElementById('camping-chatbot-send'),
      ...document.querySelectorAll('.frequent-question-btn')
    ];

    elements.forEach(element => {
      element.disabled = disabled;
      element.style.opacity = disabled ? 0.7 : 1;
      element.style.cursor = disabled ? 'not-allowed' : 'pointer';
    });
  }

  addMessage(text, sender) {
    const messagesDiv = this.container.querySelector('#camping-chatbot-messages');
    const message = document.createElement('div');
    message.className = `message-container ${sender}-message-container`;

    message.innerHTML = `
      <img src="${sender === 'user' ? CampingChatbot.config.USER_ICON : CampingChatbot.config.BOT_ICON}"
           class="message-icon"
           alt="${sender} icon">
      <div class="message-bubble ${sender}-message-bubble">
        ${text}
      </div>
    `;

    messagesDiv.appendChild(message);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  createLoading() {
    const loading = document.createElement('div');
    loading.className = 'message-container bot-message-container';
    loading.innerHTML = `
      <img src="${CampingChatbot.config.BOT_ICON}" class="message-icon" alt="Loading">
      <div class="message-bubble bot-message-bubble loading">
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    return loading;
  }

  // display too long or exceed question limit
  addSystemMessage(text) {
    const messagesDiv = this.container.querySelector('#camping-chatbot-messages');
    const systemMessage = document.createElement('div');
    systemMessage.className = 'system-message';
    systemMessage.innerHTML = text;
    messagesDiv.appendChild(systemMessage);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // =============== Frequent Questions ===============
  // Update frequent questions initialization
  initFrequentQuestions() {
    const container = document.getElementById('frequentQuestions');
    CampingChatbot.config.FREQUENT_QUESTIONS.forEach(question => {
      const button = document.createElement('button');
      button.className = 'frequent-question-btn';
      button.textContent = question;
      button.addEventListener('click', () => {
        if (this.state.isProcessing) return;
        document.getElementById('camping-chatbot-input').value = question;
        this.handleSend();
      });
      container.appendChild(button);
    });
  }

  // =============== Font Awesome Loader ===============
  loadFontAwesome() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
      document.head.appendChild(link);
    }
  }
}

// Initialization
if (document.readyState === 'complete') {
  new CampingChatbot({
    apiUrl: 'https://camping-chatbot-1096582767898.europe-west1.run.app/chat'
  });

} else {
  window.addEventListener('DOMContentLoaded', () => new CampingChatbot({ apiUrl: 'https://camping-chatbot-1096582767898.europe-west1.run.app/chat'}));
}
