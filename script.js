// =====================================
// 1. CONFIGURATION
// =====================================
const CEREBRAS_API_KEY = "csk-mwxrfk94v8txn2nw2ym538hk38j6cm9vketfxrd9xcf6jc4t"; 

const SYSTEM_PROMPT = `
Role: Kamu adalah Kasan (Xyon AI), asisten pribadi Kasan.
Style: Gaul, santai, pake lo/gue, tapi jenius coding.
Context: User sedang di website portofolio Kasan.
Task: Jawab pertanyaan coding, sewa bot, atau tentang Kasan.
Format: Gunakan Markdown rapi untuk kode.
`;

let chats = JSON.parse(localStorage.getItem('kasan_chats')) || [];
let currentChatId = null;

// =====================================
// 2. MARKDOWN & UTILS
// =====================================
const renderer = new marked.Renderer();
renderer.code = function(code, language) {
    const validLang = !!(language && hljs.getLanguage(language)) ? language : 'plaintext';
    const highlighted = hljs.highlight(code, { language: validLang }).value;
    const randomId = 'code-' + Math.random().toString(36).substr(2, 9);
    
    return `
    <div class="code-wrapper">
        <div class="code-header">
            <div class="code-controls">
                <div class="code-dot dot-red"></div>
                <div class="code-dot dot-yellow"></div>
                <div class="code-dot dot-green"></div>
            </div>
            <span class="code-lang">${validLang}</span>
            <button class="copy-code-btn" onclick="copyCode('${randomId}', this)">
                <i class="fas fa-copy"></i> Copy
            </button>
        </div>
        <pre><code id="${randomId}" class="hljs ${validLang}">${highlighted}</code></pre>
    </div>`;
};
marked.setOptions({ renderer: renderer, breaks: true });

function copyCode(id, btn) {
    const codeBlock = document.getElementById(id);
    if(codeBlock) {
        navigator.clipboard.writeText(codeBlock.innerText).then(() => {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            btn.style.color = '#4ade80';
            setTimeout(() => { btn.innerHTML = originalHTML; btn.style.color = ''; }, 2000);
        });
    }
}

// Fungsi Copy Wallet (DANA/GOPAY)
function copyToClip(text) {
    navigator.clipboard.writeText(text);
    Swal.fire({ 
        icon: 'success', 
        title: 'Disalin!', 
        text: text,
        timer: 1000, 
        showConfirmButton: false 
    });
}

// =====================================
// 3. UI NAVIGATION
// =====================================
function switchTab(tabId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

    const target = document.getElementById(`page-${tabId}`);
    if (target) target.classList.add('active');

    const idxMap = { 'info':0, 'sewabot':1, 'chatai':2, 'payment':3, 'contact':4 };
    const navs = document.querySelectorAll('.nav-menu .nav-item');
    if (navs[idxMap[tabId]]) navs[idxMap[tabId]].classList.add('active');

    if (tabId === 'chatai') {
        document.body.style.overflow = 'hidden';
        const emptyState = document.getElementById('empty-state');
        if(emptyState && emptyState.style.display !== 'none') triggerRobotGreeting();
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
    const words = ["Web Developer", "Bot Creator", "Xyon Founder"];
    let i=0, j=0, isDeleting=false;
    function type() {
        const cur = words[i];
        el.textContent = cur.substring(0, j);
        if(!isDeleting && j < cur.length) { j++; setTimeout(type, 100); }
        else if(isDeleting && j > 0) { j--; setTimeout(type, 50); }
        else {
            if(!isDeleting) { isDeleting = true; setTimeout(type, 2000); }
            else { isDeleting = false; i=(i+1)%words.length; setTimeout(type, 500); }
        }
    }
    type();
}

function orderWa(pkt, hrg) { window.open(`https://wa.me/6285185032092?text=Halo%20Kasan,%20mau%20order%20${pkt}%20${hrg}`, '_blank'); }

// =====================================
// 4. CHAT LOGIC
// =====================================
const chatSidebar = document.getElementById('saann-sidebar');
const chatOverlay = document.getElementById('chat-overlay');
const aiInput = document.getElementById('ai_input');
const sendBtn = document.getElementById('send_button');
const emptyState = document.getElementById('empty-state');
const historyList = document.getElementById('history-list');

function toggleChatSidebar() { chatSidebar.classList.toggle('active'); chatOverlay.classList.toggle('active'); }

function startNewChat() {
    currentChatId = Date.now().toString();
    chats.push({ id: currentChatId, title: "New Chat", messages: [] });
    saveChats();
    loadChat(currentChatId);
    if(window.innerWidth < 768) { chatSidebar.classList.remove('active'); chatOverlay.classList.remove('active'); }
}

function loadChat(id) {
    currentChatId = id;
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    document.querySelectorAll('.message').forEach(el => el.remove());
    if (chat.messages.length === 0) {
        emptyState.style.display = 'flex';
        triggerRobotGreeting();
    } else {
        emptyState.style.display = 'none';
        chat.messages.forEach(m => appendMessage(m.text, m.sender, false));
    }
    renderSidebar();
}

function triggerRobotGreeting() {
    const robotIcon = document.querySelector('.empty-state i');
    if(robotIcon) {
        robotIcon.className = "fas fa-robot robot-bounce";
        setTimeout(() => {
            const title = document.querySelector('.empty-state h3');
            if(title) title.innerText = "Halo! Xyon AI Siap Bantu 🤖";
        }, 500);
    }
}

function appendMessage(text, sender, saveToHistory = true) {
    emptyState.style.display = 'none';
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    const contentHTML = sender === 'ai' ? marked.parse(text) : text;
    let html = '';
    if(sender === 'ai') {
        html = `<div class="avatar ai"><i class="fas fa-robot"></i></div><div class="bubble markdown-content">${contentHTML}</div>`;
    } else {
        html = `<div class="bubble">${contentHTML}</div>`;
    }
    msgDiv.innerHTML = html;
    const container = document.getElementById('chat-container');
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;

    if(saveToHistory && currentChatId) {
        const chat = chats.find(c => c.id === currentChatId);
        if(chat) {
            chat.messages.push({ sender, text });
            if(chat.title === 'New Chat' && sender === 'user') chat.title = text.substring(0, 15) + '...';
            saveChats();
            renderSidebar();
        }
    }
}

function renderSidebar() {
    historyList.innerHTML = '';
    [...chats].reverse().forEach(chat => {
        const item = document.createElement('div');
        item.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
        item.innerHTML = `<i class="far fa-comment-dots"></i> ${chat.title}`;
        item.onclick = () => loadChat(chat.id);
        historyList.appendChild(item);
    });
}

async function handleSend() {
    const text = aiInput.value.trim();
    if (!text) return;
    if (!currentChatId) startNewChat();

    appendMessage(text, 'user');
    aiInput.value = '';
    aiInput.disabled = true;
    sendBtn.disabled = true;
    
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai';
    loadingDiv.id = loadingId;
    loadingDiv.innerHTML = `<div class="avatar ai"><i class="fas fa-robot fa-bounce"></i></div><div class="bubble" style="color:#a1a1aa; font-style:italic;">Sedang mengetik...</div>`;
    document.getElementById('chat-container').appendChild(loadingDiv);
    document.getElementById('chat-container').scrollTop = document.getElementById('chat-container').scrollHeight;

    try {
        const chat = chats.find(c => c.id === currentChatId);
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...chat.messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: "user", content: text }
        ];

        const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${CEREBRAS_API_KEY}` },
            body: JSON.stringify({ model: "llama3.1-70b", messages: messages, max_tokens: 2000, temperature: 0.7 })
        });

        const data = await response.json();
        document.getElementById(loadingId).remove();

        if (data.choices && data.choices[0]) {
            appendMessage(data.choices[0].message.content, 'ai');
        } else { throw new Error('No response'); }

    } catch (e) {
        if(document.getElementById(loadingId)) document.getElementById(loadingId).remove();
        console.error(e);
        appendMessage("Error: Cek API Key.", 'ai');
    } finally {
        aiInput.disabled = false;
        sendBtn.disabled = false;
        aiInput.focus();
    }
}

function saveChats() { localStorage.setItem('kasan_chats', JSON.stringify(chats)); }

document.addEventListener('DOMContentLoaded', () => {
    initTyping();
    switchTab('info');
    if(chats.length > 0) renderSidebar();
    sendBtn.onclick = handleSend;
    aiInput.onkeydown = e => { if(e.key === 'Enter') handleSend(); };
});

