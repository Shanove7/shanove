// --- SYSTEM PROMPT ---
const SYSTEM_PROMPT = `
Kamu adalah Xyon AI, asisten cerdas dengan gaya santai dan gaul (pakai gua–lu).
Xyon dibuat oleh Kasan.

Setiap kali membuat kode bot WA, WAJIB sertakan watermark:
 /**
  * Xyon AI
  * Made by Kasan
  * IG: @shnvnkonv_
  */
`;

// --- THEME ---
const body = document.body;
const savedTheme = localStorage.getItem('theme') || 'light';
body.setAttribute('data-theme', savedTheme);

function toggleTheme() {
  const t = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  body.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}

// --- NAV ---
function switchTab(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${pageId}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const map = {info:0,sewabot:1,chatai:2,payment:3,contact:4};
  document.querySelectorAll('.nav-item')[map[pageId]]?.classList.add('active');
}

// --- CHAT STATE ---
let chats = JSON.parse(localStorage.getItem('kasan_chats')) || [];
let currentChatId = null;

const aiInput = document.getElementById('ai_input');
const sendBtn = document.getElementById('send_button');
const chatContainer = document.getElementById('chat_container');
const chatScrollArea = document.getElementById('chat_scroll_area');
const sidebarBody = document.getElementById('ai_sidebar_body');

// --- HELPERS ---
function saveChats() {
  localStorage.setItem('kasan_chats', JSON.stringify(chats));
}
function scrollToBottom() {
  setTimeout(() => chatScrollArea.scrollTop = chatScrollArea.scrollHeight, 100);
}
function getTime() {
  const d = new Date();
  return d.getHours().toString().padStart(2,'0') + '.' + d.getMinutes().toString().padStart(2,'0');
}

// --- CHAT UI ---
function appendUserMessage(text) {
  const div = document.createElement('div');
  div.className = 'msg-row user';
  div.innerHTML = `
    <div class="chat-bubble user">
      <div class="bubble-content">${text.replace(/\n/g,'<br>')}</div>
      <span class="msg-time">${getTime()}</span>
    </div>`;
  chatContainer.appendChild(div);
  scrollToBottom();
}

function appendAIMessage(text, loading=false) {
  const div = document.createElement('div');
  div.className = 'msg-row bot';
  div.innerHTML = `
    <div class="bot-avatar-container"><i class="fas fa-robot"></i></div>
    <div class="chat-bubble bot">
      <div class="bubble-content">
        ${loading ? 'Lagi mikir…' : marked.parse(text)}
      </div>
      ${loading ? '' : `<span class="msg-time">${getTime()}</span>`}
    </div>`;
  chatContainer.appendChild(div);
  if (!loading) {
    div.querySelectorAll('pre code').forEach(hljs.highlightElement);
  }
  scrollToBottom();
  return div;
}

// --- CHAT LOGIC (API AMAN) ---
async function sendMessage() {
  const text = aiInput.value.trim();
  if (!text) return;

  if (!currentChatId) {
    currentChatId = Date.now().toString();
    chats.unshift({ id: currentChatId, title: text.slice(0,20), messages: [] });
  }

  aiInput.value = '';
  appendUserMessage(text);

  const chat = chats.find(c => c.id === currentChatId);
  chat.messages.push({ role: 'user', content: text });
  saveChats();

  const loading = appendAIMessage('', true);

  try {
    const apiMsgs = [{ role: "system", content: SYSTEM_PROMPT }, ...chat.messages];
    const res = await axios.post("/api/chat", { messages: apiMsgs });
    loading.remove();
    const reply = res.data.choices[0].message.content;
    appendAIMessage(reply);
    chat.messages.push({ role: 'assistant', content: reply });
    saveChats();
  } catch {
    loading.remove();
    appendAIMessage("⚠️ Error. Coba refresh.");
  }
}

sendBtn.onclick = sendMessage;
aiInput.onkeydown = e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};