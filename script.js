// --- THEME ---
const body = document.body;
const savedTheme = localStorage.getItem('theme') || 'light';
body.setAttribute('data-theme', savedTheme);

function toggleTheme() {
    const current = body.getAttribute('data-theme');
    const newTheme = current === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// --- NAV ---
function switchTab(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const navs = document.querySelectorAll('.nav-item');
    const map = {'info':0,'sewabot':1,'chatai':2,'donasi':3,'contact':4};
    if(navs[map[pageId]]) navs[map[pageId]].classList.add('active');
}

// --- CHAT SYSTEM ---
let chats = JSON.parse(localStorage.getItem('xyon_chats')) || [];
let activeChatId = null;

const chatContainer = document.getElementById('chatContainer');
const chatHistoryList = document.getElementById('chatHistoryList');
const chatTitle = document.getElementById('chatTitle');
const aiInput = document.getElementById('aiInput');
const sendBtn = document.getElementById('sendBtn');

renderHistory();

// Fungsi dipanggil saat user klik "New Chat" di sidebar
function userClickNewChat() {
    startNewChat();
    toggleSidebar(); // Tutup sidebar hanya jika diklik manual
}

function startNewChat() {
    activeChatId = Date.now().toString();
    const newChat = { id: activeChatId, title: 'New Chat', messages: [] };
    chats.unshift(newChat);
    saveChats();
    loadChat(activeChatId);
}

function loadChat(id) {
    activeChatId = id;
    const chat = chats.find(c => c.id === id);
    if (!chat) return;
    chatTitle.innerText = chat.title;
    renderHistory();
    chatContainer.innerHTML = '';
    
    if (chat.messages.length === 0) {
        chatContainer.innerHTML = `
            <div class="empty-state">
                <div class="ai-logo-glow floating"><i class="fas fa-robot"></i></div>
                <h3>Halo, Saya Xyon!</h3>
                <p>Mulai percakapan baru sekarang.</p>
            </div>`;
    } else {
        chat.messages.forEach(msg => renderBubble(msg.text, msg.sender, false));
        scrollToBottom();
    }
}

function renderHistory() {
    chatHistoryList.innerHTML = '';
    chats.forEach(chat => {
        const div = document.createElement('div');
        div.className = `hist-item ${chat.id === activeChatId ? 'active' : ''}`;
        div.onclick = () => {
            loadChat(chat.id);
            toggleSidebar(); // Tutup sidebar saat pilih chat
        };
        div.innerHTML = `<i class="far fa-comment-alt"></i> <span>${chat.title}</span>`;
        chatHistoryList.appendChild(div);
    });
}

// Escape HTML untuk mencegah kode dieksekusi browser
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function sendMessage() {
    const text = aiInput.value.trim();
    if (!text) return;
    
    if (!activeChatId) startNewChat(); // Logic ini TIDAK membuka sidebar
    
    const chat = chats.find(c => c.id === activeChatId);

    if (chat.title === 'New Chat') {
        chat.title = text.substring(0, 20);
        saveChats(); renderHistory(); chatTitle.innerText = chat.title;
    }

    chat.messages.push({ sender: 'user', text: text });
    renderBubble(text, 'user');
    aiInput.value = '';
    saveChats();
    
    const loadingId = renderLoading();
    scrollToBottom();

    try {
        const apiKey = 'csk-mwxrfk94v8txn2nw2ym538hk38j6cm9vketfxrd9xcf6jc4t';
        const apiMsgs = [{role:"system", content:"Kamu adalah Xyon Bot. Programmer ahli."}];
        chat.messages.forEach(m => apiMsgs.push({role: m.sender==='user'?'user':'assistant', content: m.text}));

        const response = await axios.post('https://api.cerebras.ai/v1/chat/completions', {
            model: 'llama-3.3-70b', messages: apiMsgs
        }, { headers: { 'Authorization': `Bearer ${apiKey}` } });

        document.getElementById(loadingId).remove();
        const reply = response.data.choices[0].message.content;
        chat.messages.push({ sender: 'bot', text: reply });
        renderBubble(reply, 'bot');
        saveChats(); scrollToBottom();
    } catch (e) {
        document.getElementById(loadingId).remove();
        renderBubble("Error koneksi.", 'bot');
    }
}

function renderBubble(text, sender, anim=true) {
    const empty = document.querySelector('.empty-state');
    if(empty) empty.remove();
    
    const div = document.createElement('div');
    div.className = `msg-row ${sender === 'user' ? 'user-row' : 'bot-row'}`;
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    
    // 1. Escape HTML dulu (biar tag <html> jadi teks)
    let safeText = escapeHtml(text);
    
    // 2. Format Markdown Code Block (```code```)
    safeText = safeText.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // 3. Format Inline Code (`code`)
    safeText = safeText.replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.1);padding:2px 4px;border-radius:4px;">$1</code>');
    
    // 4. Bold
    safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    div.innerHTML = `<div class="chat-bubble ${sender === 'user' ? 'b-user' : 'b-bot'}">${safeText}<span class="msg-time">${time}</span></div>`;
    chatContainer.appendChild(div);
    if(anim) scrollToBottom();
}

function renderLoading() {
    const div = document.createElement('div');
    div.className = 'msg-row bot-row'; div.id = 'loading';
    div.innerHTML = `<div class="chat-bubble b-bot"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
    chatContainer.appendChild(div); return 'loading';
}

function saveChats() { localStorage.setItem('xyon_chats', JSON.stringify(chats)); }
function scrollToBottom() { chatContainer.scrollTop = chatContainer.scrollHeight; }
function toggleSidebar() { document.getElementById('aiSidebar').classList.toggle('active'); document.querySelector('.overlay').classList.toggle('active'); }
function orderWa(p, h) { window.open(`https://wa.me/6285185032092?text=Order%20${p}`, '_blank'); }
function copyToClip(t) { navigator.clipboard.writeText(t).then(() => Swal.fire({title:'Copied!', text:t, icon:'success', timer:1500, showConfirmButton:false})); }
function deleteChat() {
    if(!activeChatId) return;
    Swal.fire({ title: 'Hapus Chat?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' }).then((res) => {
        if(res.isConfirmed) {
            chats = chats.filter(c => c.id !== activeChatId);
            saveChats();
            if(chats.length > 0) loadChat(chats[0].id);
            else { activeChatId = null; renderHistory(); chatContainer.innerHTML = '<div class="empty-state"><div class="ai-logo-glow floating"><i class="fas fa-robot"></i></div><h3>Halo, Saya Xyon!</h3></div>'; }
        }
    });
}
function renameChat() {
    if(!activeChatId) return;
    Swal.fire({ title: 'Rename Chat', input: 'text', showCancelButton: true }).then((res) => {
        if(res.value) { chats.find(c => c.id === activeChatId).title = res.value; saveChats(); renderHistory(); chatTitle.innerText = res.value; }
    });
}

if(sendBtn) sendBtn.addEventListener('click', sendMessage);
if(aiInput) aiInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage() });
