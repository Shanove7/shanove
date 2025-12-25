// ... (Bagian Config, Theme, Typing Effect biarkan sama) ...

// =====================================
// CHAT LOGIC (FIXED)
// =====================================
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

// ... (Bagian renderSidebar, toggleChatSidebar, startNewChat, deleteSession tetap sama) ...

function loadChat(id) {
    currentChatId = id;
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    // Reset Chat UI
    const msgElements = chatContainer.querySelectorAll('.message');
    msgElements.forEach(el => el.remove());
    
    // Tampilkan Empty State jika chat kosong
    if (chat.messages.length === 0) {
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
        chat.messages.forEach(m => {
            appendMessage(m.text, m.sender === 'user' ? 'user' : 'ai', false);
        });
    }
    
    renderSidebar();
}

function appendMessage(text, sender, saveToHistory = true) {
    // Sembunyikan Empty State begitu ada pesan
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
        
        // Render Markdown Aman
        try {
            bubbleDiv.innerHTML = marked.parse(text);
        } catch (e) {
            bubbleDiv.textContent = text; // Fallback jika markdown gagal
        }

        // Highlight Code Block
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
    
    if(sender === 'user') {
        chatContainer.appendChild(msgDiv); // User message tanpa avatar div wrapper
    } else {
        chatContainer.appendChild(msgDiv);
    }
    
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Save Logic
    if(saveToHistory && currentChatId) {
        const chat = chats.find(c => c.id === currentChatId);
        if(chat) {
            chat.messages.push({ sender, text });
            // Auto rename title jika masih "New Chat"
            if(chat.title === 'New Chat' && sender === 'user') {
                chat.title = text.substring(0, 20);
                renderSidebar();
            }
            saveChats();
        }
    }
}

async function handleSend() {
    const text = aiInput.value.trim();
    if (!text) return;
    
    // Pastikan session aktif
    if (!currentChatId) startNewChat();

    // UI Update: Tampilkan pesan user & Loading
    appendMessage(text, 'user');
    aiInput.value = '';
    aiInput.disabled = true;
    sendBtn.disabled = true;
    
    // Tampilkan loader di chat area
    loadingIndicator.style.display = 'flex';
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const chat = chats.find(c => c.id === currentChatId);

    try {
        console.log("Mengirim request ke /api/chat..."); // Debug Log
        
        const res = await axios.post('/api/chat', {
            model: 'llama3.1-70b', // Pastikan model ini sesuai di backend
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...chat.messages.slice(-6).map(m => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.text
                }))
            ]
        });

        console.log("Response API:", res.data); // Debug Log

        if (!res.data || !res.data.choices) {
            throw new Error("Format respons API tidak valid");
        }

        const reply = res.data.choices[0].message.content;
        loadingIndicator.style.display = 'none';
        appendMessage(reply, 'ai');

    } catch (e) {
        console.error("Error Detail:", e); // Log error lengkap ke console
        loadingIndicator.style.display = 'none';
        
        let errorMsg = "⚠️ Waduh error bos. Coba refresh yak!";
        if (e.response) {
            // Error dari server (500, 404, dll)
            errorMsg = `⚠️ Server Error (${e.response.status}): ${e.response.statusText}`;
        } else if (e.request) {
            // Tidak ada respon dari server
            errorMsg = "⚠️ Koneksi bermasalah. Cek internet lu bos.";
        }
        
        appendMessage(errorMsg, 'ai');
    } finally {
        aiInput.disabled = false;
        sendBtn.disabled = false;
        aiInput.focus();
    }
}

function saveChats() { localStorage.setItem('kasan_chats', JSON.stringify(chats)); }

// =====================================
// INIT
// =====================================
document.addEventListener('DOMContentLoaded', () => {
    initTyping();
    startNewChat();
});

sendBtn.onclick = handleSend;
aiInput.onkeydown = e => { if(e.key === 'Enter') handleSend(); };

