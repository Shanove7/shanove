/**
 * Xyon AI
 * Made by Kasan
 * IG: @shnvnkonv_
 */

// =====================================
// CONFIG
// =====================================
// System prompt ditanam langsung untuk menjaga persona gua-lu dan watermark wajib.
const SYSTEM_PROMPT = `
Kamu adalah Xyon AI, asisten cerdas dengan gaya santai dan gaul (pakai gua–lu) buatan Kasan.

⚠️ ATURAN KODE (WAJIB):
Setiap kali lu bikin kode (fitur Bot WA, script Node.js, dll), lu WAJIB taruh watermark ini di paling atas:

/**
 * Xyon AI
 * Made by Kasan
 * IG: @shnvnkonv_
 */

🎭 GAYA BICARA:
- Pakai "gua" dan "lu".
- Santai, gak kaku, langsung ke inti.
- Kalau ditanya IG/Sosmed, jawab: IG gua @shnvnkonv_.

📱 WHATSAPP BOT:
Gunakan struktur handler, help, tags, command, dan module.exports sesuai standar.
`;

// =====================================
// THEME & NAV SYSTEM
// =====================================
const body = document.body;
const savedTheme = localStorage.getItem('theme') || 'light';
body.setAttribute('data-theme', savedTheme); // Mengatur tema awal berdasarkan penyimpanan lokal.

function toggleTheme() {
    const t = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', t);
    localStorage.setItem('theme', t); // Menyimpan preferensi tema pengguna.
}

function switchTab(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active'); // Navigasi antar halaman portfolio.
    
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const navs = document.querySelectorAll('.nav-item');
    const map = {'info':0,'sewabot':1,'chatai':2,'payment':3,'contact':4};
    if(navs[map[pageId]]) navs[map[pageId]].classList.add('active'); // Menandai tab aktif di navbar.
}

// =====================================
// TYPING EFFECTS
// =====================================
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
    loop(); // Animasi ketik pada bagian profil portfolio.
}

function initHeaderTyping() {
    const el = document.getElementById('typing-header');
    if (!el) return;

    const text = "Powered by Llama 3.3";
    let i = 0;
    el.textContent = "";

    (function type() {
        if (i <= text.length) {
            el.textContent = text.slice(0, i++);
            setTimeout(type, 80);
        }
    })(); // Efek typing pada sub-header di area chat.
}

// =====================================
// CHAT STATE & SIDEBAR
// =====================================
let chats = JSON.parse(localStorage.getItem('kasan_chats')) || [];
let currentChatId = null;

const aiInput = document.getElementById('ai_input');
const sendBtn = document.getElementById('send_button');
const chatContainer = document.getElementById('chat_container');
const chatScrollArea = document.getElementById('chat_scroll_area');
const chatSidebar = document.getElementById('ai_sidebar');
const sidebarBg = document.getElementById('sidebar_background');
const sidebarBody = document.getElementById('ai_sidebar_body');

function renderSidebar() {
    sidebarBody.innerHTML = '';
    chats.forEach(c => {
        const div = document.createElement('div');
        div.className = `conversation_item ${c.id === currentChatId ? 'active' : ''}`;
        div.innerHTML = `
            <span style="flex:1" onclick="loadChat('${c.id}')">${c.title}</span>
            <i class="fas fa-pen" onclick="renameSession('${c.id}')"></i>
            <i class="fas fa-trash" onclick="deleteSession('${c.id}')"></i>
        `;
        sidebarBody.appendChild(div);
    }); // Merender riwayat sesi chat ke dalam sidebar.
}

function openChatSidebar() {
    chatSidebar.classList.add('active');
    sidebarBg.classList.add('active');
    sidebarBg.style.pointerEvents = 'auto'; // Mengaktifkan sidebar dan overlay.
}

function closeChatSidebar() {
    chatSidebar.classList.remove('active');
    sidebarBg.classList.remove('active');
    sidebarBg.style.pointerEvents = 'none'; // Menutup sidebar dan overlay.
}

// =====================================
// CHAT LOGIC (RESTORED)
// =====================================
function startNewChat() {
    currentChatId = Date.now().toString();
    chats.unshift({ id: currentChatId, title: 'New Chat', messages: [] });
    saveChats();
    loadChat(currentChatId);
    closeChatSidebar();
}

function loadChat(id) {
    currentChatId = id;
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    chatContainer.innerHTML = '';
    if (!chat.messages.length) {
        appendAIMessage("Woi! Gua Xyon AI. Ada yang bisa gua bantu?", false);
    } else {
        chat.messages.forEach(m =>
            m.sender === 'user' ? appendUserMessage(m.text) : appendAIMessage(m.text, false)
        );
    }
    renderSidebar();
    scrollToBottom();
}

function appendUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'msg-row user';
    div.innerHTML = `
        <div class="chat-bubble user">
            <div class="bubble-content">${text.replace(/\n/g,'<br>')}</div>
        </div>`;
    chatContainer.appendChild(div);
    scrollToBottom(); // Menambahkan pesan user ke UI.
}

function appendAIMessage(text, loading = false) {
    const div = document.createElement('div');
    div.className = 'msg-row bot';
    const content = loading ? '<i class="fas fa-circle-notch fa-spin"></i> Lagi mikir...' : marked.parse(text);
    
    div.innerHTML = `
        <div class="bot-avatar-container"><i class="fas fa-robot"></i></div>
        <div class="chat-bubble bot">
            <div class="bubble-content">${content}</div>
        </div>`;
    chatContainer.appendChild(div);

    if (!loading) {
        div.querySelectorAll('pre code').forEach(hljs.highlightElement);
        addCodeWrapper(div); // Memproses blok kode setelah AI selesai merespon.
    }
    scrollToBottom();
    return div;
}

function addCodeWrapper(div) {
    div.querySelectorAll('pre').forEach(pre => {
        if (pre.parentElement.classList.contains('code-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'code-wrapper';
        const header = document.createElement('div');
        header.className = 'code-header';
        
        const codeEl = pre.querySelector('code');
        const lang = codeEl?.className.replace('hljs language-', '') || 'Code';
        
        header.innerHTML = `<span class="code-lang">${lang}</span><button class="copy-code-btn">Salin</button>`;
        
        const btn = header.querySelector('.copy-code-btn');
        btn.onclick = () => {
            navigator.clipboard.writeText(pre.innerText);
            btn.innerText = 'Berhasil!';
            setTimeout(() => btn.innerText = 'Salin', 1500);
        };

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre); // Membungkus blok kode dengan container solid anti-crash.
    });
}

// =====================================
// SEND MESSAGE (VERCEL SERVERLESS)
// =====================================
async function sendMessage() {
    const text = aiInput.value.trim();
    if (!text) return;
    if (!currentChatId) startNewChat();

    aiInput.value = '';
    sendBtn.classList.add('disabled');
    appendUserMessage(text);

    const chat = chats.find(c => c.id === currentChatId);
    chat.messages.push({ sender:'user', text });
    saveChats();

    const loading = appendAIMessage('', true); // Menampilkan shimmer loading ala Gemini.

    try {
        // Lu pake env di serverless Vercel, jadi kita tembak endpoint lokal project lu.
        const res = await axios.post('/api/chat', {
            model: 'llama-3.3-70b', 
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...chat.messages.slice(-6).map(m => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.text
                }))
            ],
            temperature: 0.7
        });

        const reply = res.data.choices[0].message.content;
        loading.remove();
        appendAIMessage(reply, false);
        chat.messages.push({ sender:'bot', text: reply });
        saveChats();

    } catch (e) {
        loading.remove();
        appendAIMessage("⚠️ Waduh error bos, coba refresh yak!", false);
    } finally {
        sendBtn.classList.remove('disabled');
    }
}

// =====================================
// UTIL & HELPERS
// =====================================
function saveChats() { localStorage.setItem('kasan_chats', JSON.stringify(chats)); }
function scrollToBottom() { setTimeout(() => chatScrollArea.scrollTop = chatScrollArea.scrollHeight, 100); }

function copyToClip(text) {
    navigator.clipboard.writeText(text).then(() => {
        Swal.fire({ icon: 'success', title: 'Tersalin!', text: text, timer: 1500, showConfirmButton: false });
    });
}

function orderWa(paket, harga) {
    window.open(`https://wa.me/6285185032092?text=Halo+Kasan,+Saya+mau+sewa+bot+paket+${paket}`, '_blank');
}

// =====================================
// INITIALIZATION
// =====================================
document.addEventListener('DOMContentLoaded', () => {
    initTyping();
    initHeaderTyping();
    renderSidebar(); // Inisialisasi semua komponen UI saat DOM siap.
});

if (sendBtn) sendBtn.onclick = sendMessage;
if (aiInput) aiInput.onkeydown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
};

