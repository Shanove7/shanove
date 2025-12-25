// --- CONFIGURATION ---
// API key dipindah ke Vercel Serverless (AMAN)

// --- SYSTEM PROMPT (PERSONA BARU: GUA-LU & WATERMARK) ---
const SYSTEM_PROMPT = `
Lu Xyon, AI gua Kasan, santai & gaul, singkat padat jelas. Kalau ada yg nanya IG jawab @shnvnkonv_, owner lu kasan.

⚠️ ATURAN KODE (SANGAT PENTING):
Setiap kali kamu membuat kode (terutama fitur Bot WhatsApp), WAJIB sertakan watermark ini di baris paling atas:

/**
 * Xyon AI
 * Made by Kasan
 * IG: @shnvnkonv_
 */
...
📱 STRUKTUR BOT WHATSAPP:
Jika diminta fitur bot, gunakan format standar ini:
1. Handler function (m, { conn, text, ... })
2. Metadata (handler.help, handler.tags, handler.command)
3. module.exports = handler

🧾 IDENTITAS:
- Nama: Xyon
- Creator: Kasan
- IG: @shnvnkonv_ (Kasih tau ini kalau ditanya sosmed).
`;

// --- THEME & NAV SYSTEM ---
const body = document.body;
const savedTheme = localStorage.getItem('theme') || 'light';
body.setAttribute('data-theme', savedTheme);

function toggleTheme() {
    const current = body.getAttribute('data-theme');
    const newTheme = current === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function switchTab(tabId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${tabId}`).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${tabId}"]`)?.classList.add('active');
}

// --- CHAT STATE ---
let chats = JSON.parse(localStorage.getItem('kasan_chats')) || [];
let currentChatId = null;

const aiInput = document.getElementById('ai_input');
const sendBtn = document.getElementById('send_button');
const chatContainer = document.getElementById('chat_container');
const chatScrollArea = document.getElementById('chat_scroll_area');

// --- UTIL ---
function saveChats() {
    localStorage.setItem('kasan_chats', JSON.stringify(chats));
}

function scrollBottom() {
    setTimeout(() => {
        chatScrollArea.scrollTop = chatScrollArea.scrollHeight;
    }, 50);
}

function timeNow() {
    const d = new Date();
    return d.getHours().toString().padStart(2, '0') + ':' +
           d.getMinutes().toString().padStart(2, '0');
}

// --- UI MESSAGE ---
function appendUserMessage(text) {
    const el = document.createElement('div');
    el.className = 'msg-row user';
    el.innerHTML = `
      <div class="chat-bubble user">
        <div class="bubble-content">${text.replace(/\n/g, '<br>')}</div>
        <span class="msg-time">${timeNow()}</span>
      </div>`;
    chatContainer.appendChild(el);
    scrollBottom();
}

function appendAIMessage(text, loading = false) {
    const el = document.createElement('div');
    el.className = 'msg-row bot';
    el.innerHTML = `
      <div class="bot-avatar-container"><i class="fas fa-robot"></i></div>
      <div class="chat-bubble bot">
        <div class="bubble-content">
          ${loading ? 'Lagi mikir…' : marked.parse(text)}
        </div>
        ${loading ? '' : `<span class="msg-time">${timeNow()}</span>`}
      </div>`;
    chatContainer.appendChild(el);

    if (!loading) {
        el.querySelectorAll('pre code').forEach(hljs.highlightElement);
    }
    scrollBottom();
    return el;
}

// --- SEND MESSAGE (PATCHED API) ---
async function sendMessage() {
    const text = aiInput.value.trim();
    if (!text) return;

    if (!currentChatId) {
        currentChatId = Date.now().toString();
        chats.unshift({
            id: currentChatId,
            title: text.slice(0, 20),
            messages: []
        });
    }

    aiInput.value = '';
    appendUserMessage(text);

    const chat = chats.find(c => c.id === currentChatId);
    chat.messages.push({ role: 'user', content: text });
    saveChats();

    const loading = appendAIMessage('', true);

    try {
        const apiMsgs = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...chat.messages
        ];

        // 🔐 API AMAN VIA SERVERLESS
        const res = await axios.post('/api/chat', {
            messages: apiMsgs
        });

        loading.remove();
        const reply = res.data.choices[0].message.content;
        appendAIMessage(reply);
        chat.messages.push({ role: 'assistant', content: reply });
        saveChats();
    } catch (e) {
        loading.remove();
        appendAIMessage('⚠️ Terjadi error. Coba refresh.');
    }
}

sendBtn.onclick = sendMessage;
aiInput.onkeydown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
};
