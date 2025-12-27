// =====================================
// CONFIG & DATA
// =====================================
const SYSTEM_PROMPT = "Anda adalah Kasan (Xyon AI), asisten yang santai, gaul, tapi tetap membantu. Gunakan bahasa Indonesia sehari-hari (lu/gua) yang akrab.";
let chats = JSON.parse(localStorage.getItem('kasan_chats')) || [];
let currentChatId = null;

// =====================================
// UI LOGIC (NAVIGATION & THEME)
// =====================================
function switchTab(tabId) {
    // 1. Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // 2. Remove active state from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // 3. Show selected page
    const targetPage = document.getElementById(`page-${tabId}`);
    if (targetPage) {
        targetPage.classList.add('active');
        // Scroll to top when switching
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 4. Highlight Nav Item
    // Note: index map: info(0), sewabot(1), chatai(2), payment(3), contact(4)
    const navItems = document.querySelectorAll('.nav-menu .nav-item');
    const indexMap = { 'info': 0, 'sewabot': 1, 'chatai': 2, 'payment': 3, 'contact': 4 };
    
    if (indexMap[tabId] !== undefined && navItems[indexMap[tabId]]) {
        navItems[indexMap[tabId]].classList.add('active');
    }

    // Special logic for Chat AI page (Fullscreen mode)
    if (tabId === 'chatai') {
        document.body.style.overflow = 'hidden'; // Lock body scroll
    } else {
        document.body.style.overflow = ''; // Unlock
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Load Theme on Start
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// =====================================
// TYPING EFFECT (Halaman Info)
// =====================================
function initTyping() {
    const textElement = document.querySelector('.typing-text');
    const words = ["Web Developer", "Bot Creator", "Freelancer", "Bug Hunter"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            textElement.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            textElement.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }

        if (!isDeleting && charIndex === currentWord.length) {
            isDeleting = true;
            typeSpeed = 2000; // Pause at end
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }
    
    if(textElement) type();
}

// =====================================
// UTILS
// =====================================
function orderWa(paket, harga) {
    const phone = "6285185032092";
    const text = `Halo Kasan, saya mau order paket Bot *${paket}* seharga Rp ${harga}. Mohon infonya.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
}

function copyToClip(text) {
    navigator.clipboard.writeText(text).then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Disalin!',
            text: text,
            timer: 1500,
            showConfirmButton: false,
            background: getComputedStyle(document.body).getPropertyValue('--bg-card'),
            color: getComputedStyle(document.body).getPropertyValue('--text-main')
        });
    });
}

// =====================================
// CHAT AI LOGIC
// =====================================
// Initialize UI Elements
const chatSidebar = document.getElementById('saann-sidebar');
const chatOverlay = document.getElementById('chat-overlay');
const chatContainer = document.getElementById('chat_container');
const aiInput = document.getElementById('ai_input');
const sendBtn = document.getElementById('send_button');
const loadingIndicator = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const historyList = document.getElementById('history-list');

// Markdown
marked.setOptions({ breaks: true });

function toggleChatSidebar() {
    if(!chatSidebar) return;
    chatSidebar.classList.toggle('active');
    chatOverlay.classList.toggle('active');
}

function startNewChat() {
    currentChatId = Date.now().toString();
    const newChat = { id: currentChatId, title: "New Chat", messages: [] };
    chats.push(newChat);
    saveChats();
    loadChat(currentChatId);
    
    // Auto close sidebar on mobile after new chat
    if(window.innerWidth < 768) {
        chatSidebar.classList.remove('active');
        chatOverlay.classList.remove('active');
    }
}

function renderSidebar() {
    if(!historyList) return;
    historyList.innerHTML = '';
    
    // Sort by newest
    const sortedChats = [...chats].reverse();
    
    sortedChats.forEach(chat => {
        const item = document.createElement('div');
        item.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
        item.innerHTML = `<i class="far fa-comment-alt"></i> <span>${chat.title}</span>`;
        item.onclick = () => {
            loadChat(chat.id);
            if(window.innerWidth < 768) toggleChatSidebar(); // Auto close on click
        };
        historyList.appendChild(item);
    });
}

function loadChat(id) {
    currentChatId = id;
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    // Clear Container
    const msgElements = document.querySelectorAll('.message');
    msgElements.forEach(el => el.remove());
    
    // Show/Hide Empty State
    if (chat.messages.length === 0) {
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
        chat.messages.forEach(m => {
            appendMessage(m.text, m.sender, false);
        });
    }
    
    renderSidebar();
}

function appendMessage(text, sender, saveToHistory = true) {
    emptyState.style.display = 'none';

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = `avatar ${sender}`;
    avatar.innerHTML = sender === 'ai' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

    const bubble = document.createElement('div');
    bubble.className = 'bubble markdown-content';
    
    if (sender === 'ai') {
        bubble.innerHTML = marked.parse(text);
        // Highlight Code
        bubble.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    } else {
        bubble.textContent = text;
    }

    if(sender === 'user') {
        msgDiv.appendChild(bubble);
        // User doesn't strictly need avatar displayed, but consistent structure is fine
    } else {
        msgDiv.appendChild(avatar);
        msgDiv.appendChild(bubble);
    }
    
    document.getElementById('chat-container').appendChild(msgDiv);
    document.getElementById('chat-container').scrollTop = document.getElementById('chat-container').scrollHeight;

    if(saveToHistory && currentChatId) {
        const chat = chats.find(c => c.id === currentChatId);
        if(chat) {
            chat.messages.push({ sender, text });
            if(chat.title === 'New Chat' && sender === 'user') {
                chat.title = text.substring(0, 20);
            }
            saveChats();
            renderSidebar();
        }
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

    try {
        const chat = chats.find(c => c.id === currentChatId);
        const history = chat ? chat.messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
        })) : [];

        // Simulasi API (Ganti URL ini dengan backend aslimu)
        // const res = await axios.post('/api/chat', ...);
        
        // --- MOCK RESPONSE UNTUK DEMO (HAPUS BAGIAN INI JIKA SUDAH ADA BACKEND) ---
        await new Promise(r => setTimeout(r, 1500)); // Simulasi delay
        const mockReply = "Halo! Gua Xyon AI. Backend belum connect nih, tapi UI udah fix lancar jaya! 😎";
        // ------------------------------------------------------------------------

        loadingIndicator.style.display = 'none';
        appendMessage(mockReply, 'ai');

    } catch (e) {
        loadingIndicator.style.display = 'none';
        appendMessage("Error: Gagal terhubung ke server.", 'ai');
    } finally {
        aiInput.disabled = false;
        sendBtn.disabled = false;
        aiInput.focus();
    }
}

function saveChats() { localStorage.setItem('kasan_chats', JSON.stringify(chats)); }

// =====================================
// INIT APP
// =====================================
document.addEventListener('DOMContentLoaded', () => {
    initTyping();
    // Load halaman pertama (Info)
    switchTab('info');
    
    // Load Chat history if exists
    if(chats.length > 0) {
        renderSidebar();
    } else {
        startNewChat();
    }
});

// Event Listeners
if(sendBtn) sendBtn.onclick = handleSend;
if(aiInput) aiInput.onkeydown = e => { if(e.key === 'Enter') handleSend(); };
        
