// --- CONFIGURATION ---
const SYSTEM_PROMPT = `
Kamu adalah Xyon AI, asisten cerdas gaya santai (gua-lu).
Xyon dibuat oleh Kasan.
WAJIB: Setiap kode harus ada watermark ini paling atas:
/**
 * Xyon AI
 * Made by Kasan
 * IG: @shnvnkonv_
 */
`;

// --- THEME & NAV ---
const body = document.body;
const savedTheme = localStorage.getItem('theme') || 'light';
body.setAttribute('data-theme', savedTheme);

function toggleTheme() {
    const current = body.getAttribute('data-theme');
    const newTheme = current === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function switchTab(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const navs = document.querySelectorAll('.nav-item');
    const map = {'info':0,'sewabot':1,'chatai':2,'payment':3,'contact':4};
    if(navs[map[pageId]]) navs[map[pageId]].classList.add('active');
}

// RESTORED: BUTTONS
function orderWa(paket, harga) {
    window.open(`https://wa.me/6285185032092?text=Halo+Kasan,+Saya+mau+sewa+bot+paket+${paket}`, '_blank');
}
function copyToClip(text) {
    navigator.clipboard.writeText(text).then(() => {
        Swal.fire({ icon: 'success', title: 'Tersalin!', text: text, timer: 1500, showConfirmButton: false });
    });
}

// --- TYPING EFFECTS ---
function initTyping() {
    const el = document.querySelector('.typing-text');
    if (!el) return;
    const words = ["Founder Xyon", "JavaScript Dev", "Tech Enthusiast"];
    let i = 0, j = 0, del = false;
    function loop() {
        const w = words[i];
        el.textContent = del ? w.slice(0, j--) : w.slice(0, j++);
        let speed = del ? 50 : 100;
        if (!del && j === w.length + 1) { del = true; speed = 1200; }
        if (del && j === 0) { del = false; i = (i + 1) % words.length; speed = 400; }
        setTimeout(loop, speed);
    }
    loop();
}

// --- CHAT LOGIC (UI BARU + VERCEL API) ---
let chats = JSON.parse(localStorage.getItem('kasan_chats')) || [];
let currentChatId = null;

const aiInput = document.getElementById('ai_input');
const sendBtn = document.getElementById('send_button');
const chatContainer = document.getElementById('chat_container');
const loadingIndicator = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const sidebar = document.getElementById('saann-sidebar');
const overlay = document.getElementById('chat-overlay');
const historyList = document.getElementById('history-list');

// Markdown Options
marked.setOptions({ breaks: true, highlight: function(code) { return code; } });

function renderSidebar() {
    historyList.innerHTML = '';
    chats.forEach(c => {
        const div = document.createElement('div');
        div.className = `history-item ${c.id === currentChatId ? 'active' : ''}`;
        div.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis">${c.title}</span>
            <i class="fas fa-trash" style="font-size:0.8rem; opacity:0.6;" onclick="deleteSession('${c.id}', event)"></i>
        `;
        div.onclick = () => loadChat(c.id);
        historyList.appendChild(div);
    });
}

function toggleChatSidebar() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function startNewChat() {
    currentChatId = Date.now().toString();
    chats.unshift({ id: currentChatId, title: 'Chat Baru', messages: [] });
    saveChats();
    loadChat(currentChatId);
    if(window.innerWidth <= 768) toggleChatSidebar();
}

function deleteSession(id, e) {
    e.stopPropagation();
    Swal.fire({
        title: 'Hapus Chat?', text: "Riwayat ini akan hilang.", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya'
    }).then((r) => {
        if(r.isConfirmed) {
            chats = chats.filter(c => c.id !== id);
            saveChats();
            if(currentChatId == id) startNewChat();
            else renderSidebar();
        }
    });
}

function loadChat(id) {
    currentChatId = id;
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    const msgElements = chatContainer.querySelectorAll('.message');
    msgElements.forEach(el => el.remove());
    
    emptyState.style.display = chat.messages.length === 0 ? 'flex' : 'none';

    chat.messages.forEach(m => {
        appendMessage(m.text, m.sender === 'user' ? 'user' : 'ai', false);
    });
    
    renderSidebar();
}

function appendMessage(text, sender, saveToHistory = true) {
    emptyState.style.display = 'none';

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);

    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('avatar', sender);
    if(sender === 'ai') {
        avatarDiv.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`;
    } else {
        avatarDiv.innerHTML = `You`; 
    }

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bubble');
    
    if (sender === 'user') {
        bubbleDiv.textContent = text;
        msgDiv.appendChild(bubbleDiv);
    } else {
        bubbleDiv.classList.add('markdown-content');
        msgDiv.appendChild(avatarDiv);
        msgDiv.appendChild(bubbleDiv);
        
        bubbleDiv.innerHTML = marked.parse(text);

        bubbleDiv.querySelectorAll('pre code').forEach((block) => {
            const pre = block.parentElement;
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper';
            const header = document.createElement('div');
            header.className = 'code-header';
            
            const lang = block.className.replace('language-', '') || 'Code';
            header.innerHTML = `<span>${lang}</span><button class="copy-btn">Copy</button>`;
            
            const btn = header.querySelector('button');
            btn.onclick = () => {
                navigator.clipboard.writeText(block.innerText);
                btn.innerHTML = 'Copied!';
                setTimeout(()=>btn.innerHTML='Copy', 1500);
            };

            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(header);
            wrapper.appendChild(pre);
            hljs.highlightElement(block);
        });
    }
    
    if(sender === 'user' && !msgDiv.querySelector('.avatar')) {
        chatContainer.appendChild(msgDiv);
    } else {
        chatContainer.appendChild(msgDiv);
    }
    
    chatContainer.scrollTop = chatContainer.scrollHeight;

    if(saveToHistory && currentChatId) {
        const chat = chats.find(c => c.id === currentChatId);
        chat.messages.push({ sender, text });
        if(chat.title === 'Chat Baru' && sender === 'user') {
            chat.title = text.substring(0, 20);
            renderSidebar();
        }
        saveChats();
    }
}

async function handleSend() {
    const text = aiInput.value.trim();
    if (!text) return;
    if (!currentChatId) startNewChat();

    appendMessage(text, 'user');
    aiInput.value = '';
    aiInput.disabled = true;
    sendBtn.disabled = true;
    loadingIndicator.style.display = 'flex';
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const chat = chats.find(c => c.id === currentChatId);

    try {
        const res = await axios.post('/api/chat', {
            model: 'llama-3.3-70b', 
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...chat.messages.slice(-6).map(m => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.text
                }))
            ]
        });

        const reply = res.data.choices[0].message.content;
        loadingIndicator.style.display = 'none';
        appendMessage(reply, 'ai');

    } catch (e) {
        loadingIndicator.style.display = 'none';
        appendMessage("⚠️ Waduh error bos, coba refresh yak!", 'ai');
    } finally {
        aiInput.disabled = false;
        sendBtn.disabled = false;
        aiInput.focus();
    }
}

function saveChats() { localStorage.setItem('kasan_chats', JSON.stringify(chats)); }

document.addEventListener('DOMContentLoaded', () => {
    initTyping();
    startNewChat();
});

sendBtn.onclick = handleSend;
aiInput.onkeydown = e => { if(e.key === 'Enter') handleSend(); };
    
