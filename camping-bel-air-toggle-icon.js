const campingName = "Camping Bel Air"; // You can still change this easily

class CampingChatbot {

 // =============== Configuration ===============
 static config = {
   PRIMARY_COLOR: '#000000', // black
   SECONDARY_COLOR: '#F0F4F8',
   USER_MESSAGE_BG: '#e8b444', // orange
   // USER_ICON: 'https://kyoconnectai.com/kyoconnectai_logo.jpg', // Keep this if needed elsewhere, not used for user messages anymore
   CUSTOMIZED_ICON: 'https://www.belairpornichet.fr/images/favicons/Belair/favicon-32x32.png',
   BOT_ICON: 'https://www.belairpornichet.fr/images/favicons/Belair/favicon-32x32.png',

   // --- Define the campsite name once here ---
   CAMPING_NAME: campingName,
   // ------------------------------------------

   FREQUENT_QUESTIONS: [
     "Check-in and check-out times",
     "Available facilities",
     "Contact",
     "Site rules",
     "Location",
     "Parking Policy",
     "The story of Camping Bel Air"
   ],
   COPY: {
     header: `${campingName} AI assistant`,
     systemMessage: `Please note: You can ask up to <strong>20 questions</strong> about ${campingName}`,
     initialMessage: `Hi! What can I help you with ${campingName}?`,
     inputPlaceholder: "Ask your question...",
     footerHTML: `Powered by <a href="https://kyoconnectai.com/" target="_blank">KyoConnectAI.com</a> |
                  AI can make mistakes. Verify important information.`
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
     // Add dependency loader first
   this.loadDependencies().then(() => {

   // Set API endpoint
   this.apiEndpoint = config.apiUrl || window.CHATBOT_API || '/chat';

   this.state = {
     isOpen: false,
     questionCount: 0,
     isProcessing: false // Add processing state
   };

   this.injectStyles();
   this.createDOM();
   this.initEventListeners();
   this.initFrequentQuestions();
   this.loadFontAwesome(); // Ensure Font Awesome is loaded
   });
 }


 async loadDependencies() {
 return new Promise((resolve) => {
   if (window.marked && window.DOMPurify) {
     return resolve();
   }

   let loadedCount = 0;
   const checkLoaded = () => ++loadedCount === 2 && resolve();

   // Load marked
   const markedScript = document.createElement('script');
   markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
   markedScript.onload = checkLoaded;
   document.head.appendChild(markedScript);

   // Load DOMPurify
   const purifyScript = document.createElement('script');
   purifyScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.5/purify.min.js';
   purifyScript.onload = checkLoaded;
   document.head.appendChild(purifyScript);
 });
}

 // Modified parseMarkdown method
 parseMarkdown(content) {
   try {
     const unsafeHtml = window.marked.parse(content);
     return window.DOMPurify.sanitize(unsafeHtml, {
       ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'h3', 'h4', 'a', 'table', 'tr', 'td', 'th', 'thead', 'tbody'],
       ALLOWED_ATTR: ['href', 'target']
     });
   } catch (error) {
     console.error('Markdown parsing error:', error);
     return content; // Fallback to raw text
   }
 }


 // =============== Style Injection ===============
 injectStyles() {
   const style = document.createElement('style');
   style.textContent = `
     :root {
       --primary-color: ${CampingChatbot.config.PRIMARY_COLOR};
       --secondary-color: ${CampingChatbot.config.SECONDARY_COLOR};
       --user-message-bg-color: ${CampingChatbot.config.USER_MESSAGE_BG}; // end user message color
     }

     /* Original container styles preserved */
     #chatbot-container {
       position: fixed;
       bottom: 90px; /* Adjusted to leave space below button */
       right: 25px;
       width: 420px;
       height: 650px;
       background: white;
       border-radius: 15px;
       box-shadow: 0 2px 10px rgba(0,0,0,0.1);
       display: none;
       flex-direction: column;
       overflow: hidden;
       z-index: 1000;
     }

     #chatbot-header {
       display: flex;
       align-items: center;
       padding: 10px;
       border-bottom: 2px solid var(--secondary-color);
       color: var(--primary-color); /* Make header text primary color */
     }


     #chatbot-header h4 {
         margin: 0;
         font-size: 1.1em;
         /* color: var(--primary-color); // Already set on parent */
     }

     #chatbot-messages {
         flex: 1;
         padding: 10px;
         overflow-y: auto;
         background: var(--secondary-color);
     }

     /* Frequent Questions Section */
     #chatbot-frequent-questions {
         padding: 10px;
         background: #fff;
         border-top: 1px solid var(--secondary-color);
         border-bottom: 1px solid var(--secondary-color);
     }
     #chatbot-frequent-questions h6 {
         margin-top: 1px; /* Reduce large space*/
         margin-bottom: 6px;
         font-size: 0.9em;
         font-weight: bold;
         color: var(--primary-color);
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
         transition: background-color 0.2s, color 0.2s;
     }
     .frequent-question-btn:hover {
         background: var(--primary-color);
         color: #fff;
     }
     .frequent-question-btn:disabled {
          background: #eee;
          border-color: #ccc;
          color: #999;
          cursor: not-allowed;
      }


     #chatbot-input-area {
         display: flex;
         padding: 10px;
         border-top: 1px solid var(--secondary-color);
         background: #fff;
     }
     #chatbot-input {
         flex: 1;
         padding: 8px;
         border: 1px solid #ccc;
         border-radius: 4px;
     }
     #chatbot-send {
         background: var(--user-message-bg-color); /* Send button matches user message bg */
         color: white;
         border: none;
         padding: 8px 12px;
         margin-left: 8px;
         border-radius: 4px;
         cursor: pointer;
         transition: filter 0.2s;
     }
      #chatbot-send:hover {
          filter: brightness(90%);
      }
      #chatbot-send:disabled {
          background: #ccc;
          cursor: not-allowed;
      }


     /* Footer */
     #chatbot-footer {
         text-align: center;
         font-size: 0.8em;
         color: #6c757d;
         padding: 8px;
         border-top: 1px solid var(--secondary-color);
         background: #fff; /* Ensure footer has white bg */
     }
     #chatbot-footer a {
         color: var(--primary-color);
         text-decoration: none;
     }
      #chatbot-footer a:hover {
          text-decoration: underline;
      }


     /* --- Floating Toggle Button - REVISED CSS --- */
     #chat-toggle {
       position: fixed;
       bottom: 25px;
       right: 25px;
       /* Use 60px width/height */
       width: 60px;
       height: 60px;
       background-color: var(--user-message-bg-color); /* Match send button/user msg color */
       border-radius: 50%;
       border: none;
       cursor: pointer;
       box-shadow: 0 4px 12px rgba(0,0,0,0.15);
       display: flex;
       align-items: center;
       justify-content: center;
       z-index: 1001; /* Ensure it's above chat window */
       transition: background-color 0.3s ease; /* Keep hover transition */
       overflow: hidden;
     }

     /* Style for BOTH icons inside the toggle button */
     #chat-toggle .chat-toggle-closed-icon,
     #chat-toggle .chat-toggle-open-icon {
          position: absolute; /* Stack them */
          transition: opacity 0.3s ease; /* Keep transition for swapping */
          font-size: 1.8em; /* Use consistent size */
          color: white;
     }

     /* Style for the 'closed' icon (comment dots) */
     #chat-toggle .chat-toggle-closed-icon {
          opacity: 1; /* Starts visible */
     }

     /* Style for the 'open' icon (chevron down) */
     #chat-toggle .chat-toggle-open-icon {
          opacity: 0; /* Starts hidden */
     }

     /* Hover effect */
     #chat-toggle:hover {
       filter: brightness(90%);
     }
     /* --- End Floating Toggle Button CSS --- */


     /* Message Styles */
     .system-message {
             background: #fff3cd;
             color: #856404;
             border-radius: 10px;
             padding: 10px;
             margin: 15px 0;
             font-size: 0.9em;
             animation: fadeIn 0.3s ease;
         }
     .message-container {
         display: flex;
         gap: 12px;
         margin: 10px 0;
         max-width: 90%;
         animation: fadeIn 0.3s ease; /* Add fade in to messages */
     }
     .bot-message-container {
         margin-right: auto;
     }
     .user-message-container {
         margin-left: auto;
         flex-direction: row-reverse;
     }
     .message-icon { /* Only used by bot now */
         width: 40px;
         height: 40px;
         border-radius: 50%;
         flex-shrink: 0;
     }
     .message-bubble {
         padding: 8px 12px;
         border-radius: 20px;
         max-width: 80%;
         word-wrap: break-word; /* Ensure long words break */
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


     /* Markdown Element Styling inside bot messages */
     .bot-message-bubble h3,
     .bot-message-bubble h4 {
       color: var(--primary-color);
       font-size: 1.1em;
       margin: 15px 0 10px;
     }

     .bot-message-bubble ul,
     .bot-message-bubble ol {
       padding-left: 25px;
       margin: 10px 0;
     }

     .bot-message-bubble li {
       margin-bottom: 8px;
       line-height: 1.5;
     }

     .bot-message-bubble table {
       border-collapse: collapse;
       margin: 15px 0;
       width: 100%;
       font-size: 0.85em;
     }
     .bot-message-bubble th {
       background-color: #f8f9fa;
       font-weight: 600;
     }

     .bot-message-bubble td,
     .bot-message-bubble th {
       border: 1px solid #dee2e6;
       padding: 8px 10px;
       text-align: left;
     }

     .bot-message-bubble a {
       color: var(--primary-color);
       text-decoration: underline;
       word-break: break-all;
     }
      .bot-message-bubble a:hover {
          text-decoration: none;
      }


     .bot-message-bubble strong,
     .bot-message-bubble b { /* Add 'b' tag */
       /* color: var(--primary-color); */ /* Keep default black or inherit */
       font-weight: 600;
     }

      .bot-message-bubble em,
      .bot-message-bubble i { /* Add 'i' tag */
          font-style: italic;
      }
   `;
   document.head.appendChild(style);
 }

 // =============== DOM Creation ===============
 createDOM() {
   // Main Container
   this.container = document.createElement('div');
   this.container.id = 'chatbot-container';
   this.container.innerHTML = `
     <div id="chatbot-header">
       <img src="${CampingChatbot.config.BOT_ICON}" alt="Chatbot Logo" width="40" height="40" style="border-radius:50%; margin-right:10px;">
       <h4>${CampingChatbot.config.COPY.header}</h4>
     </div>

     <div id="chatbot-messages">
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

     <div id="chatbot-frequent-questions">
       <h6>Frequent Questions:</h6>
       <div id="frequentQuestions"></div>
     </div>

     <div id="chatbot-input-area">
       <input type="text" id="chatbot-input" placeholder="${CampingChatbot.config.COPY.inputPlaceholder}">
       <button id="chatbot-send">Send</button>
     </div>

     <div id="chatbot-footer">
       ${CampingChatbot.config.COPY.footerHTML}
     </div>
   `;
   document.body.appendChild(this.container);

   // --- Toggle Button - REVISED HTML ---
   this.toggleButton = document.createElement('button');
   this.toggleButton.id = 'chat-toggle';
   // Add both icons, give them specific classes to target
   this.toggleButton.innerHTML = `
     <i class="fas fa-comment-dots chat-toggle-closed-icon"></i>
     <i class="fas fa-chevron-down chat-toggle-open-icon"></i>
   `;
   document.body.appendChild(this.toggleButton);
   // --- End Toggle Button HTML ---
 }

 // =============== Event Listeners ===============
 initEventListeners() {
   this.toggleButton.addEventListener('click', () => this.toggleChat());
   document.getElementById('chatbot-send').addEventListener('click', () => this.handleSend());
   document.getElementById('chatbot-input').addEventListener('keypress', e => {
     if (e.key === 'Enter') this.handleSend();
   });
 }

 // =============== Core Functionality ===============
 toggleChat() {
   this.state.isOpen = !this.state.isOpen;
   this.container.style.display = this.state.isOpen ? 'flex' : 'none';

   // --- REVISED: Select icons by class and swap opacity ---
   const closedIcon = this.toggleButton.querySelector('.chat-toggle-closed-icon');
   const openIcon = this.toggleButton.querySelector('.chat-toggle-open-icon');

   // Ensure elements exist before trying to access style
   if (closedIcon && openIcon) {
      closedIcon.style.opacity = this.state.isOpen ? '0' : '1'; // Hide closed icon when open
      openIcon.style.opacity = this.state.isOpen ? '1' : '0';   // Show open icon when open
   }
   // --- End Revision ---
 }

 async handleSend() {
   // Prevent concurrent processing
   if (this.state.isProcessing) return;

   const input = document.getElementById('chatbot-input');
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

     //Add user message first
     this.state.questionCount++;
     this.addMessage(message, 'user');
     input.value = '';

     // then Create loading element after validation
     loading = this.createLoading();
     this.container.querySelector('#chatbot-messages').appendChild(loading);
     // Scroll down immediately after adding loading message
     const messagesDiv = this.container.querySelector('#chatbot-messages');
     messagesDiv.scrollTop = messagesDiv.scrollHeight;

     const response = await fetch(this.apiEndpoint, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, // Add Accept header
       body: JSON.stringify({
         message: message,
         session_id: "chatbot" // Consider making this dynamic if needed
       })
     });

       // Handle non-JSON responses first
       const contentType = response.headers.get('content-type') || '';
       if (!response.ok || !contentType.includes('application/json')) {
           // Attempt to get text error if possible
           let errorText = 'Service unavailable or unexpected response';
           try {
               errorText = await response.text();
               // Try to parse if it's secretly JSON error
               const jsonData = JSON.parse(errorText);
               errorText = jsonData.detail || errorText;
           } catch (e) { /* Ignore parsing errors, stick with text */ }
           throw new Error(errorText);
       }

       const data = await response.json();
       // Assuming successful JSON response has 'response' key
       if (data.response === undefined) {
           throw new Error('Invalid response format from server');
       }

       this.addMessage(data.response, 'bot');

   } catch (error) {
     // Handle network errors or other exceptions
     let userMessage;
     if (error instanceof TypeError) { // Network error likely
       userMessage = 'Connection failed. Please check your network';
     } else { // Other errors (server, parsing etc.)
       // Display the error message thrown (or default)
       userMessage = error.message || 'An unknown error occurred';
     }
     console.error("Chatbot Error:", error); // Log the full error for debugging
     this.addSystemMessage(`Error: ${userMessage}`); // Make it clear it's an error

   } finally {
     this.state.isProcessing = false;
     this.toggleUIState(false); // Re-enable inputs
     // Safely remove loading if it exists
     if (loading && loading.parentNode) {
       loading.remove();
     }
     // Scroll down again after potentially adding error or final response
     const messagesDiv = this.container.querySelector('#chatbot-messages');
     if(messagesDiv) { // Ensure messagesDiv exists
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
     }
   }

 }

 // Add UI state management
 toggleUIState(disabled) {
   const inputEl = document.getElementById('chatbot-input');
   const sendBtn = document.getElementById('chatbot-send');
   const freqBtns = document.querySelectorAll('.frequent-question-btn');

    if (inputEl) inputEl.disabled = disabled;
    if (sendBtn) sendBtn.disabled = disabled;

   freqBtns.forEach(element => {
     element.disabled = disabled;
   });
 }

 addMessage(text, sender) {
   const messagesDiv = this.container.querySelector('#chatbot-messages');
   // Check if messagesDiv exists before proceeding
   if (!messagesDiv) {
       console.error("Chatbot messages container not found!");
       return;
   }

   const message = document.createElement('div');
   message.className = `message-container ${sender}-message-container`;

    // Conditionally create the icon HTML only for the bot
   const iconHtml = sender === 'bot'
       ? `<img src="${CampingChatbot.config.BOT_ICON}" class="message-icon" alt="Bot icon">`
       : ''; // Empty string for user, so no icon is rendered

   const formattedText = sender === 'bot' ? this.parseMarkdown(text) : text;

   // Use the iconHtml variable which is empty for the user
   message.innerHTML = `
     ${iconHtml}
     <div class="message-bubble ${sender}-message-bubble">
       ${formattedText}
     </div>
   `;


   messagesDiv.appendChild(message);
   messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll after adding
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

 // display system messages (errors, limits)
 addSystemMessage(text) {
   const messagesDiv = this.container.querySelector('#chatbot-messages');
    if (!messagesDiv) return; // Guard clause

   const systemMessage = document.createElement('div');
   systemMessage.className = 'system-message';
   systemMessage.innerHTML = text; // text is already HTML or plain text
   messagesDiv.appendChild(systemMessage);
   messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll after adding
 }

 // =============== Frequent Questions ===============
 initFrequentQuestions() {
   const container = document.getElementById('frequentQuestions');
   if (!container) return; // Guard clause

   CampingChatbot.config.FREQUENT_QUESTIONS.forEach(question => {
     const button = document.createElement('button');
     button.className = 'frequent-question-btn';
     button.textContent = question;
     button.addEventListener('click', () => {
       // Use already defined state check and input setting
       if (this.state.isProcessing) return;
       const inputEl = document.getElementById('chatbot-input');
       if (inputEl) {
           inputEl.value = question;
           this.handleSend(); // Directly call send handler
       }
     });
     container.appendChild(button);
   });
 }

 // =============== Font Awesome Loader ===============
 loadFontAwesome() {
   // Check if Font Awesome is already loaded (check for a common class)
    if (document.querySelector('.fas') || document.querySelector('link[href*="fontawesome"]')) {
        return; // Already loaded or likely loaded
    }
   // If not, load it
   const link = document.createElement('link');
   link.rel = 'stylesheet';
   // Use a reliable Font Awesome CDN link (check version if specific icons needed)
   link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
   link.integrity = 'sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg=='; // Add integrity check
   link.crossOrigin = 'anonymous'; // Add crossorigin attribute
   link.referrerPolicy = 'no-referrer'; // Add referrerpolicy
   document.head.appendChild(link);
 }
}

// ================== Initialization ==================
// Define API URL (ensure SERVICE_NAME matches your Cloud Run service)
const SERVICE_NAME="elp-new-venture-demo-freeze-june"; // Example service name
const API_SUFFIX = "-1096582767898.europe-west1.run.app/chat"; // Your specific suffix
const apiUrl = `https://${SERVICE_NAME}${API_SUFFIX}`;

// Initialize after DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
 new CampingChatbot({ apiUrl });
} else {
 window.addEventListener('DOMContentLoaded', () => new CampingChatbot({ apiUrl }));
}
