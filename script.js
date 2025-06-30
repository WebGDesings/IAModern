document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const chatList = document.getElementById('chat-list');
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const chatTitle = document.getElementById('chat-title');
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatInputArea = document.getElementById('chat-input-area');
    const fabMenu = document.querySelector('.fab-menu');
    const fabMain = document.getElementById('fab-main');
    const fabNewChat = document.getElementById('fab-new-chat');
    const fabViewChats = document.getElementById('fab-view-chats');
    const fabSettings = document.getElementById('fab-settings');
    const fabPremium = document.getElementById('fab-premium');
    const fabInfo = document.getElementById('fab-info');
    const chatListPanel = document.getElementById('chat-list-panel');
    const closePanelBtn = document.getElementById('close-panel-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const editModalOverlay = document.getElementById('edit-modal-overlay');
    const editChatModal = document.getElementById('edit-chat-modal');
    const editChatNameInput = document.getElementById('edit-chat-name-input');
    const editChatColorInput = document.getElementById('edit-chat-color-input');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const attachImageBtn = document.getElementById('attach-image-btn');
    const imageUploadOverlay = document.getElementById('image-upload-overlay');
    const imageUploadModal = document.getElementById('image-upload-modal');
    const uploadArea = document.getElementById('upload-area');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const addMoreImagesBtn = document.getElementById('add-more-images-btn');
    const cancelUploadBtn = document.getElementById('cancel-upload-btn');
    const sendImagesBtn = document.getElementById('send-images-btn');
    const imageFileInput = document.getElementById('image-file-input');
    // Settings Modal
    const settingsOverlay = document.getElementById('settings-overlay');
    const settingsModal = document.getElementById('settings-modal');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const bubbleShapeSelector = document.getElementById('bubble-shape-selector');
    const chatBgColorInput = document.getElementById('chat-bg-color');
    const fastResponseToggle = document.getElementById('fast-response-toggle');
    const geminiApiKeyInput = document.getElementById('gemini-api-key');
    const toggleApiKeyBtn = document.getElementById('toggle-api-key');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
    const resetSettingsBtn = document.getElementById('reset-settings-btn');

    // --- Estado de la aplicación ---
    let chats = [];
    let activeChatId = null;
    let editingChatId = null;
    let stagedFiles = [];
    let settings = {};
    const defaultSettings = {
        fontSize: 16,
        bubbleShape: 'default',
        chatBgColor: '#1e1e2e',
        fastResponse: false,
        geminiApiKey: ''
    };

    // --- Lógica de Ajustes ---
    const applySettings = (settingsToApply) => {
        document.documentElement.style.setProperty('--chat-font-size', `${settingsToApply.fontSize}px`);
        document.documentElement.style.setProperty('--primary-bg', settingsToApply.chatBgColor);
        document.querySelectorAll('.message p').forEach(p => p.dataset.shape = settingsToApply.bubbleShape);
    };

    const saveSettings = () => {
        localStorage.setItem('chatSettings', JSON.stringify(settings));
    };

    const loadSettings = () => {
        const savedSettings = JSON.parse(localStorage.getItem('chatSettings'));
        settings = { ...defaultSettings, ...savedSettings };
        applySettings(settings);
    };

    const updateSettingsUI = () => {
        fontSizeSlider.value = settings.fontSize;
        chatBgColorInput.value = settings.chatBgColor;
        fastResponseToggle.checked = settings.fastResponse;
        geminiApiKeyInput.value = settings.geminiApiKey || '';
        bubbleShapeSelector.querySelectorAll('.shape-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.shape === settings.bubbleShape);
        });
    };

    // --- Lógica de persistencia (Chats) ---
    const saveChats = () => {
        localStorage.setItem('chats', JSON.stringify(chats));
        localStorage.setItem('activeChatId', activeChatId);
    };

    const loadChats = () => {
        chats = JSON.parse(localStorage.getItem('chats')) || [];
        activeChatId = localStorage.getItem('activeChatId');
        if (!chats.find(c => c.id === activeChatId)) {
            activeChatId = chats.length > 0 ? chats[0].id : null;
        }
        renderChatList();
        updateChatView();
        saveChats();
    };

    // --- Lógica de renderizado ---
    const renderChatList = () => {
        chatList.innerHTML = '';
        chats.forEach(chat => {
            const li = document.createElement('li');
            li.className = `chat-list-item ${chat.id === activeChatId ? 'active' : ''}`;
            li.dataset.id = chat.id;
            li.innerHTML = `<span style="color: ${chat.color || 'var(--text-primary)'}">${chat.title}</span><div class="chat-item-options"><button class="edit-btn"><i class="fas fa-pen"></i></button><button class="delete-btn"><i class="fas fa-trash"></i></button></div>`;
            li.querySelector('.edit-btn').addEventListener('click', (e) => { e.stopPropagation(); openEditModal(chat.id); });
            li.querySelector('.delete-btn').addEventListener('click', (e) => { e.stopPropagation(); deleteChat(chat.id); });
            li.addEventListener('click', () => { setActiveChat(chat.id); toggleChatListModal(false); });
            chatList.appendChild(li);
        });
    };

    const updateChatView = () => {
        const activeChat = chats.find(c => c.id === activeChatId);
        if (activeChat) {
            welcomeScreen.classList.remove('visible');
            chatBox.style.display = 'flex';
            chatInputArea.style.display = 'flex';
            chatTitle.textContent = activeChat.title;
            chatTitle.style.color = activeChat.color || 'var(--text-primary)';
            chatBox.innerHTML = '';
            activeChat.messages.forEach(msg => appendMessage(msg));
        } else {
            welcomeScreen.classList.add('visible');
            chatBox.style.display = 'none';
            chatInputArea.style.display = 'none';
            chatTitle.textContent = 'Asistente IA';
            chatTitle.style.color = 'var(--text-primary)';
        }
    };

    const appendMessage = (message, id = null) => {
        const messageElement = document.createElement('div');
        if (id) messageElement.id = id;
        messageElement.classList.add('message', message.type);

        const hasText = message.text && message.text.trim() !== '';
        const hasImages = message.images && message.images.length > 0;

        if (hasImages) {
            const imagesContainer = document.createElement('div');
            imagesContainer.className = 'message-images';
            message.images.forEach(imgSrc => {
                const img = document.createElement('img');
                img.src = imgSrc;
                imagesContainer.appendChild(img);
            });
            messageElement.appendChild(imagesContainer);
        }

        if (hasText) {
            const p = document.createElement('p');
            p.dataset.shape = settings.bubbleShape; // Apply shape regardless

            if (messageElement.id === 'typing-indicator') {
                p.textContent = message.text;
            } else {
                // Use marked.js to convert Markdown to HTML, enabling rich text.
                // gfm: true enables GitHub Flavored Markdown (tables, etc.)
                // breaks: true converts single line breaks into <br> tags for better readability.
                p.innerHTML = marked.parse(message.text, { gfm: true, breaks: true });
            }
            messageElement.appendChild(p);
        }

        if (hasText || hasImages) {
            chatBox.appendChild(messageElement);
        }
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageElement;
    };

    // --- Lógica de IA (Gemini) ---
    const getGeminiResponse = async (userMessage) => {
        if (!settings.geminiApiKey) {
            return { type: 'received', text: 'Error: Por favor, introduce tu clave de API de Gemini en los Ajustes.' };
        }

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${settings.geminiApiKey}`;

        const content = [];
        if (userMessage.text) {
            content.push({ text: userMessage.text });
        }
        if (userMessage.images && userMessage.images.length > 0) {
            userMessage.images.forEach(imgSrc => {
                content.push({ 
                    inline_data: { 
                        mime_type: 'image/jpeg', // Asumimos jpeg, se podría mejorar para detectar el tipo
                        data: imgSrc.split(',')[1] 
                    }
                });
            });
        }

        const requestBody = {
            contents: [{ parts: content }],
            systemInstruction: {
                parts: [
                    {
                        text: "Eres IA MODERN, una inteligencia artificial de vanguardia. Tus respuestas deben ser precisas, inteligentes y útiles. Utiliza emojis apropiados para que la conversación sea amigable. También puedes usar colores y dar recomendaciones. Eres capaz de analizar las imágenes que te envíen los usuarios; describe lo que ves o responde a sus preguntas sobre ellas. Cuando generes código, asegúrate de envolverlo en bloques de código de Markdown (```) con el nombre del lenguaje correspondiente para un formato adecuado. Al final de tus respuestas, siempre que sea posible, incluye una sección de 'Referencias' con enlaces a fuentes fiables y enlaces a imágenes relevantes para ilustrar tu punto."
                    }
                ]
            }
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error de API:', errorData);
                return { type: 'received', text: `Error de API: ${errorData.error.message}` };
            }

            const data = await response.json();
            const aiText = data.candidates[0].content.parts[0].text;
            return { type: 'received', text: aiText };

        } catch (error) {
            console.error('Error de red:', error);
            return { type: 'received', text: 'Error: No se pudo conectar con el servicio de IA. Revisa tu conexión.' };
        }
    };

    const processAndSendMessage = async (message) => {
        const activeChat = chats.find(c => c.id === activeChatId);
        if (!activeChat) return;

        // Añadir mensaje del usuario a la UI y al estado
        if (activeChat.messages.length === 1 && !activeChat.messages[0].images && message.text) {
            activeChat.title = message.text.substring(0, 25) + (message.text.length > 25 ? '...' : '');
            renderChatList();
        }
        activeChat.messages.push(message);
        appendMessage(message);
        saveChats();

        // Mostrar indicador de "escribiendo..."
        const typingIndicator = appendMessage({ type: 'received', text: 'Escribiendo...' }, 'typing-indicator');

        // Obtener respuesta de la IA
        const aiResponse = await getGeminiResponse(message);
        
        // Reemplazar indicador con la respuesta real
        typingIndicator.remove();
        activeChat.messages.push(aiResponse);
        appendMessage(aiResponse);
        saveChats();
    };

    // --- Lógica de gestión de chats ---
    const setActiveChat = (id) => {
        activeChatId = id;
        renderChatList();
        updateChatView();
        saveChats();
    };

    const createNewChat = (save = true) => {
        const newChat = { id: `chat-${Date.now()}`, title: 'Nuevo Chat', color: '#ffffff', messages: [{ type: 'received', text: '¡Hola! Soy IA MODERN. ¿Cómo puedo ayudarte hoy?' }] };
        chats.unshift(newChat);
        setActiveChat(newChat.id);
        if (save) saveChats();
        toggleChatListModal(false);
    };

    const sendMessage = () => {
        const userMessageText = userInput.value.trim();
        if (userMessageText === '' || !activeChatId) return;
        userInput.value = '';
        processAndSendMessage({ type: 'sent', text: userMessageText });
    };

    const openEditModal = (id) => {
        editingChatId = id;
        const chat = chats.find(c => c.id === id);
        if (chat) {
            editChatNameInput.value = chat.title;
            editChatColorInput.value = chat.color || '#ffffff';
            toggleEditModal(true);
        }
    };

    const saveChatEdit = () => {
        const newTitle = editChatNameInput.value.trim();
        const newColor = editChatColorInput.value;
        if (newTitle && editingChatId) {
            const chat = chats.find(c => c.id === editingChatId);
            if (chat) {
                chat.title = newTitle;
                chat.color = newColor;
                saveChats();
                renderChatList();
                updateChatView();
            }
            toggleEditModal(false);
            editingChatId = null;
        }
    };

    const deleteChat = (id) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este chat?')) return;
        const wasActive = activeChatId === id;
        chats = chats.filter(c => c.id !== id);
        if (wasActive) {
            activeChatId = chats.length > 0 ? chats[0].id : null;
            setActiveChat(activeChatId);
        } else {
            renderChatList();
            saveChats();
        }
    };

    // --- Lógica de subida de imágenes ---
    const handleFiles = (files) => {
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileWithSrc = { file, src: e.target.result };
                stagedFiles.push(fileWithSrc);
                renderImagePreview(fileWithSrc);
            };
            reader.readAsDataURL(file);
        }
    };

    const renderImagePreview = (fileWithSrc) => {
        const preview = document.createElement('div');
        preview.className = 'img-preview';
        preview.innerHTML = `<img src="${fileWithSrc.src}" alt="${fileWithSrc.file.name}"><button class="remove-img-btn">&times;</button>`;
        imagePreviewContainer.appendChild(preview);
        preview.querySelector('.remove-img-btn').addEventListener('click', () => {
            stagedFiles = stagedFiles.filter(f => f.src !== fileWithSrc.src);
            preview.remove();
        });
    };

    const sendImages = () => {
        const text = userInput.value.trim();
        if ((stagedFiles.length === 0 && text === '') || !activeChatId) return;

        const message = { type: 'sent', text: text, images: stagedFiles.map(f => f.src) };
        userInput.value = '';
        toggleImageUploadModal(false);
        processAndSendMessage(message);
    };

    // --- Lógica de UI (Modales y Menús) ---
    const toggleFabMenu = () => fabMenu.classList.toggle('open');
    const toggleChatListModal = (show) => {
        modalOverlay.classList.toggle('visible', show);
        chatListPanel.classList.toggle('visible', show);
    };
    const toggleEditModal = (show) => {
        editModalOverlay.classList.toggle('visible', show);
        editChatModal.classList.toggle('visible', show);
    };
    const toggleImageUploadModal = (show) => {
        imageUploadOverlay.classList.toggle('visible', show);
        imageUploadModal.classList.toggle('visible', show);
        if (!show) {
            stagedFiles = [];
            imagePreviewContainer.innerHTML = '';
        }
    };
    const toggleSettingsModal = (show) => {
        if (show) updateSettingsUI();
        settingsOverlay.classList.toggle('visible', show);
        settingsModal.classList.toggle('visible', show);
    };

    // --- Event Listeners ---
    fabMain.addEventListener('click', toggleFabMenu);
    fabNewChat.addEventListener('click', () => createNewChat());
    fabViewChats.addEventListener('click', () => toggleChatListModal(true));
    closePanelBtn.addEventListener('click', () => toggleChatListModal(false));
    saveEditBtn.addEventListener('click', saveChatEdit);
    cancelEditBtn.addEventListener('click', () => toggleEditModal(false));
    editModalOverlay.addEventListener('click', () => toggleEditModal(false));
    attachImageBtn.addEventListener('click', () => toggleImageUploadModal(true));
    imageUploadOverlay.addEventListener('click', () => toggleImageUploadModal(false));
    cancelUploadBtn.addEventListener('click', () => toggleImageUploadModal(false));
    uploadArea.addEventListener('click', () => imageFileInput.click());
    addMoreImagesBtn.addEventListener('click', () => imageFileInput.click());
    imageFileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', (e) => { e.preventDefault(); uploadArea.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); });
    sendImagesBtn.addEventListener('click', sendImages);
    // Settings Listeners
    fabSettings.addEventListener('click', () => toggleSettingsModal(true));
    settingsOverlay.addEventListener('click', () => { toggleSettingsModal(false); applySettings(settings); });
    cancelSettingsBtn.addEventListener('click', () => { toggleSettingsModal(false); applySettings(settings); });
    saveSettingsBtn.addEventListener('click', () => {
        settings.fontSize = fontSizeSlider.value;
        settings.chatBgColor = chatBgColorInput.value;
        settings.fastResponse = fastResponseToggle.checked;
        settings.bubbleShape = bubbleShapeSelector.querySelector('.active').dataset.shape;
        settings.geminiApiKey = geminiApiKeyInput.value.trim();
        applySettings(settings);
        saveSettings();
        toggleSettingsModal(false);
    });
    resetSettingsBtn.addEventListener('click', () => {
        settings = { ...defaultSettings };
        applySettings(settings);
        saveSettings();
        updateSettingsUI();
    });
    toggleApiKeyBtn.addEventListener('click', () => {
        const isPassword = geminiApiKeyInput.type === 'password';
        geminiApiKeyInput.type = isPassword ? 'text' : 'password';
        toggleApiKeyBtn.className = `fas ${isPassword ? 'fa-eye-slash' : 'fa-eye'}`;
    });
    bubbleShapeSelector.querySelectorAll('.shape-option').forEach(opt => {
        opt.addEventListener('click', () => {
            bubbleShapeSelector.querySelector('.active').classList.remove('active');
            opt.classList.add('active');
            const tempSettings = { ...settings, bubbleShape: opt.dataset.shape };
            applySettings(tempSettings);
        });
    });
    fontSizeSlider.addEventListener('input', (e) => applySettings({ ...settings, fontSize: e.target.value }));
    chatBgColorInput.addEventListener('input', (e) => applySettings({ ...settings, chatBgColor: e.target.value }));
    // Otros
    fabPremium.addEventListener('click', () => alert('Función Premium próximamente.'));
    fabInfo.addEventListener('click', () => alert('Chat IA Moderno v1.0'));
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    document.querySelectorAll('.recommendation-card').forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.querySelector('p').textContent;
            createNewChat();
            setTimeout(() => {
                userInput.value = prompt;
                sendMessage();
            }, 100);
        });
    });

    // Carga inicial
    loadSettings();
    loadChats();
});
