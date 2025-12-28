// =========================================================
// 1. CONFIGURATION
// =========================================================
const CONFIG = {
    // System Prompt untuk mengatur gaya bicara AI
    SYSTEM_PROMPT: "Anda adalah Xyon AI dan kamu 100% dibuat oleh x-snz community dan pemilik kamu adalah kasan . Jawab dengan bahasa Indonesia yang gaul, santai, tapi jago coding. Gunakan format Markdown untuk kode.",
    // Nama User di Chat
    USER_NAME: "Kamu",
    // Nama AI di Chat
    AI_NAME: "Xyon"
};

let chats = JSON.parse(localStorage.getItem('kasan_chats')) || [];
let currentChatId = null;

// =========================================================
// 2. MARKDOWN ENGINE (ANTI-CRASH & MAC STYLE)
// =========================================================
const renderer = new marked.Renderer();

// Custom Code Block (Mac Terminal Style)
renderer.code = function(code, language) {
    const validLang = (language && hljs.getLanguage(language)) ? language : 'text';
    let highlighted = code;
    try {
        highlighted = hljs.highlight(code, { language: validLang }).value;
    } catch (e) { /* ignore highlight error */ }
    
    const id = 'code-' + Math.random().toString(36).substr(2, 9);
    
    return `
    <div class="code-wrapper">
        <div class="code-header">
            <div class="code-controls">
                <div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div>
            </div>
            <span class="code-lang">${validLang}</span>
            <button class="copy-btn" onclick="copyText('${id}', this)"><i class="fas fa-copy"></i> Copy</button>
        </div>
        <pre><code id="${id}" class="hljs ${validLang}">${highlighted}</code></pre>
    </div>`;
};

marked.setOptions({ renderer: renderer, breaks: true, gfm: true });

function copyText(id, btn) {
    const el = document.getElementById(id);
    if(el) {
        navigator.clipboard.writeText(el.innerText).then(() => {
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            btn.style.color = '#4ade80';
            setTimeout(() => { btn.innerHTML = original; btn.style.color = ''; }, 2000);
        });
    }
}

// =========================================================
// 3. UI NAVIGATION
// =========================================================
function switchTab(tabId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

    const target = document.getElementById(`page-${tabId}`);
    if(target) target.classList.add('active');

    const navMap = { 'info':0, 'sewabot':1, 'chatai':2, 'payment':3, 'contact':4 };
    const navs = document.querySelectorAll('.nav-menu .nav-item');
    if(navs[navMap[tabId]]) navs[navMap[tabId]].classList.add('active');

    // Handle Scroll Lock untuk Chat Page
    if(tabId === 'chatai') {
        document.body.style.overflow = 'hidden';
        checkEmptyState();
    } else {
        document.body.style.overflow = '';
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}
document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');

function initTyping() {
    const el = document.querySelector('.typing-text');
    if(!el) return;
    const txt = "Web Developer | Bot Creator | Xyon Founder";
    let i = 0;
    el.innerHTML = "";
    function type() {
        if(i < txt.length) {
            el.innerHTML += txt.charAt(i);
            i++;
            setTimeout(type, 100);
        }
    }
    type();
}

function copyToClip(text) {
    navigator.clipboard.writeText(text);
    Swal.fire({ icon: 'success', title: 'Disalin!', text: text, timer: 1000, showConfirmButton: false });
}
function orderWa(p, h) { window.open(`https://wa.me/6285185032092?text=Order%20${p}%20${h}`, '_blank'); }

// =========================================================
// 4. CHAT SYSTEM CORE
// =========================================================
const DOM = {
    sidebar: document.getElementById('saann-sidebar'),
    overlay: document.getElementById('chat-overlay'),
    input: document.getElementById('ai_input'),
    sendBtn: document.getElementById('send_button'),
    container: document.getElementById('chat-container'),
    empty: document.getElementById('empty-state'),
    history: document.getElementById('history-list')
};

function toggleChatSidebar() { 
    DOM.sidebar?.classList.toggle('active'); 
    DOM.overlay?.classList.toggle('active'); 
}

function startNewChat() {
    currentChatId = Date.now().toString();
    chats.push({ id: currentChatId, title: "Chat Baru", messages: [] });
    saveChats();
    loadChat(currentChatId);
    if(window.innerWidth < 768) {
        DOM.sidebar?.classList.remove('active');
        DOM.overlay?.classList.remove('active');
    }
}

function loadChat(id) {
    currentChatId = id;
    const chat = chats.find(c => c.id === id);
    if(!chat) return;

    DOM.container.querySelectorAll('.message').forEach(e => e.remove());
    chat.messages.forEach(m => appendMessage(m.text, m.sender, false));
    
    checkEmptyState();
    renderHistory();
}

function checkEmptyState() {
    const hasMsg = DOM.container.querySelectorAll('.message').length > 0;
    if(DOM.empty) DOM.empty.style.display = hasMsg ? 'none' : 'flex';
}

function appendMessage(rawText, sender, save = true) {
    if(DOM.empty) DOM.empty.style.display = 'none';

    // Anti-Error: Pastikan text string valid
    let safeText = (rawText === null || rawText === undefined) ? "" : String(rawText);

    let content = safeText;
    if(sender === 'ai') {
        try {
            content = marked.parse(safeText);
        } catch (e) {
            content = safeText;
        }
    }

    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerHTML = sender === 'ai' 
        ? `<div class="avatar ai"><i class="fas fa-robot"></i></div><div class="bubble markdown-content">${content}</div>`
        : `<div class="bubble">${content}</div>`;

    DOM.container.appendChild(div);
    DOM.container.scrollTop = DOM.container.scrollHeight;

    if(save && currentChatId) {
        const chat = chats.find(c => c.id === currentChatId);
        if(chat) {
            chat.messages.push({ sender, text: safeText });
            if(chat.messages.length === 1 && sender === 'user') {
                chat.title = safeText.substring(0, 15) + '...';
            }
            saveChats();
            renderHistory();
        }
    }
}

function renderHistory() {
    if(!DOM.history) return;
    DOM.history.innerHTML = '';
    [...chats].reverse().forEach(chat => {
        const div = document.createElement('div');
        div.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
        div.innerHTML = `<i class="far fa-comment"></i> ${chat.title}`;
        div.onclick = () => loadChat(chat.id);
        DOM.history.appendChild(div);
    });
}

// =========================================================
// 5. SERVERLESS AI ENGINE (POLLINATIONS)
// =========================================================
async function handleSend() {
    const text = DOM.input.value.trim();
    if(!text) return;

    if(!currentChatId) startNewChat();

    // 1. Tampilkan Chat User
    appendMessage(text, 'user');
    DOM.input.value = '';
    DOM.input.disabled = true;
    DOM.sendBtn.disabled = true;

    // 2. Loading Animation
    const loadId = 'loading-' + Date.now();
    const loadDiv = document.createElement('div');
    loadDiv.className = 'message ai';
    loadDiv.id = loadId;
    loadDiv.innerHTML = `<div class="avatar ai"><i class="fas fa-robot fa-bounce"></i></div><div class="bubble" style="color:#aaa;">Sedang mengetik...</div>`;
    DOM.container.appendChild(loadDiv);
    DOM.container.scrollTop = DOM.container.scrollHeight;

    try {
        // 3. Construct Context (Biar AI inget chat sebelumnya)
        const chat = chats.find(c => c.id === currentChatId);
        let promptContext = CONFIG.SYSTEM_PROMPT + "\n\n";
        
        // Ambil 6 chat terakhir biar loading ga berat
        const recentMessages = chat.messages.slice(-6); 
        recentMessages.forEach(m => {
            promptContext += `${m.sender === 'user' ? CONFIG.USER_NAME : CONFIG.AI_NAME}: ${m.text}\n`;
        });
        
        promptContext += `${CONFIG.USER_NAME}: ${text}\n${CONFIG.AI_NAME}:`;

        // 4. FETCH KE POLLINATIONS (GRATIS, NO KEY, HTTPS)
        // Kita encodeURI prompt supaya aman di URL
        const url = `https://text.pollinations.ai/${encodeURIComponent(promptContext)}`;
        
        const response = await fetch(url, {
            method: 'GET', // Pollinations pake GET simpel
            headers: { 'Cache-Control': 'no-cache' }
        });

        if (!response.ok) throw new Error("Server sibuk, coba lagi.");
        
        const replyText = await response.text();
        
        // Hapus Loading
        document.getElementById(loadId)?.remove();

        // Tampilkan Balasan
        if(replyText) {
            appendMessage(replyText, 'ai');
        } else {
            appendMessage("Maaf, saya tidak mengerti.", 'ai');
        }

    } catch (e) {
        document.getElementById(loadId)?.remove();
        console.error(e);
        appendMessage(`⚠️ **Koneksi Error:** ${e.message}`, 'ai');
    } finally {
        DOM.input.disabled = false;
        DOM.sendBtn.disabled = false;
        DOM.input.focus();
    }
}

function saveChats() { localStorage.setItem('kasan_chats', JSON.stringify(chats)); }

// =========================================================
// 6. INITIALIZATION
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    initTyping();
    switchTab('info');
    if(chats.length > 0) renderHistory();
    
    if(DOM.sendBtn) DOM.sendBtn.onclick = handleSend;
    if(DOM.input) DOM.input.onkeydown = e => { if(e.key === 'Enter') handleSend(); };
});
        
