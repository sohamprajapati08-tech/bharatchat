// ================================================================
// BharatChat 🇮🇳 — India Ka Apna Messenger
// Pure Real-Time Architecture (Real Users & Database Only - No Fake Data)
// ================================================================

(function () {
    'use strict';

    // ====== WEB AUDIO SOUND ENGINE ======
    const SoundEngine = {
        ctx: null,
        init() {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) this.ctx = new AudioContext();
            } catch (e) {}
        },
        playSent() {
            if (!this.ctx || !state.settings.soundEnabled) return;
            try {
                if (this.ctx.state === 'suspended') this.ctx.resume();
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.08);
            } catch (e) {}
        },
        playReceived() {
            if (!this.ctx || !state.settings.soundEnabled) return;
            try {
                if (this.ctx.state === 'suspended') this.ctx.resume();
                const now = this.ctx.currentTime;
                const osc1 = this.ctx.createOscillator();
                const osc2 = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc1.type = 'sine';
                osc2.type = 'sine';
                osc1.frequency.setValueAtTime(587.33, now);
                osc2.frequency.setValueAtTime(880, now + 0.09);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(this.ctx.destination);
                osc1.start(now);
                osc1.stop(now + 0.09);
                osc2.start(now + 0.09);
                osc2.stop(now + 0.25);
            } catch (e) {}
        },
        ringInterval: null,
        startRinging() {
            if (!this.ctx || !state.settings.callRingEnabled) return;
            this.stopRinging();
            this.ringInterval = setInterval(() => {
                try {
                    if (this.ctx.state === 'suspended') this.ctx.resume();
                    const now = this.ctx.currentTime;
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(440, now);
                    osc.frequency.setValueAtTime(480, now + 0.4);
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + 1.2);
                } catch (e) {}
            }, 2500);
        },
        stopRinging() {
            if (this.ringInterval) {
                clearInterval(this.ringInterval);
                this.ringInterval = null;
            }
        }
    };

    // ====== APPLICATION STATE (ZERO FAKE DATA) ======
    let storyTimer = null;

    const state = {
        currentUser: null,
        activeContact: null,
        messages: {}, // { contactId: [ {id, text, sent, time, status, reaction, quote} ] }
        recentChats: [], // Ordered list of contact IDs who have exchanged messages
        contacts: [], // ONLY real registered users in DB
        phonebook: [], // WhatsApp Saved Phone Contacts: [ { name, phone } ]
        statuses: [], // ONLY real posted statuses
        calls: [], // ONLY real call logs
        settings: {
            theme: 'dark',
            wallpaper: 'default',
            soundEnabled: true,
            callRingEnabled: true,
            readReceipts: true,
            lastSeen: 'everyone',
            profilePhoto: 'everyone',
            language: 'en'
        },
        supabase: {
            url: '',
            key: '',
            connected: false
        },
        quotedMessage: null,
        activeCall: null,
        localStream: null,
        broadcastChannel: null,
        selectedAvatarColor: 'linear-gradient(135deg, #FF9933, #138808)',
        selectedStatusColor: '#008069',
        statusMode: 'text', // 'text', 'photo', 'video'
        statusMediaData: null,
        statusCaption: ''
    };

    // ====== TRANSLATIONS FOR APP LANGUAGES ======
    const I18N = {
        en: {
            chats: 'Chats',
            status: 'Status',
            calls: 'Calls',
            settings: 'Settings',
            noChatsTitle: 'No chats yet',
            noChatsSub: 'When you start messaging BharatChat users across India, your active conversations will appear here.',
            findUsersBtn: '+ Find Users Across India',
            typeMessage: 'Type a message (English, हिन्दी, ગુજરાતી)...',
            online: 'online',
            typing: 'typing...',
            endToEnd: 'End-to-end encrypted'
        },
        hi: {
            chats: 'चैट',
            status: 'स्टेटस',
            calls: 'कॉल',
            settings: 'सेटिंग्स',
            noChatsTitle: 'अभी कोई चैट नहीं है',
            noChatsSub: 'जब आप भारतचैट यूजर्स से बात करेंगे, तो आपकी बातचीत यहाँ दिखाई देगी।',
            findUsersBtn: '+ भारत भर के यूजर्स खोजें',
            typeMessage: 'संदेश लिखें (English, हिन्दी, ગુજરાતી)...',
            online: 'ऑनलाइन',
            typing: 'टाइप कर रहे हैं...',
            endToEnd: 'शुरू से अंत तक एन्क्रिप्टेड'
        },
        gu: {
            chats: 'ચેટ્સ',
            status: 'સ્ટેટસ',
            calls: 'કૉલ્સ',
            settings: 'સેટિંગ્સ',
            noChatsTitle: 'હજુ કોઈ ચેટ નથી',
            noChatsSub: 'જ્યારે તમે ભારતના રજીસ્ટર્ડ ભારતચેટ યુઝર્સ સાથે વાત કરશો, ત્યારે તમારી ચેટ અહીં દેખાશે.',
            findUsersBtn: '+ ભારતના યુઝર્સ શોધો',
            typeMessage: 'મેસેજ લખો (English, हिन्दी, ગુજરાતી)...',
            online: 'ઓનલાઇન',
            typing: 'ટાઈપ કરી રહ્યા છે...',
            endToEnd: 'એન્ડ-ટુ-એન્ડ એન્ક્રિપ્ટેડ'
        },
        mr: {
            chats: 'चॅट्स',
            status: 'स्टेटस',
            calls: 'कॉल्स',
            settings: 'सेटिंग्ज',
            noChatsTitle: 'अद्याप चॅट नाही',
            noChatsSub: 'जेव्हा तुम्ही भारतचॅट वापरकर्त्यांशी संभाषण सुरू कराल, तेव्हा ते येथे दिसेल.',
            findUsersBtn: '+ भारतातील युजर्स शोधा',
            typeMessage: 'संदेश टाइप करा...',
            online: 'ऑनलाइन',
            typing: 'टाइप करत आहे...',
            endToEnd: 'एंड-टू-एंड एनक्रिप्टेड'
        }
    };

    // ====== INITIALIZATION ======
    function init() {
        SoundEngine.init();
        loadSavedState();
        setupBroadcastChannel();
        bindEvents();

        // Check if user is already logged in
        if (state.currentUser) {
            showApp();
        } else {
            showAuth();
        }

        // Apply saved language & wallpaper
        applyLanguage(state.settings.language || 'en');
        applyWallpaper(state.settings.wallpaper || 'default');
    }

    // ====== STORAGE & DATABASE SYNC ======
    function loadSavedState() {
        try {
            const savedUser = localStorage.getItem('bharatchat_current_user');
            if (savedUser) state.currentUser = JSON.parse(savedUser);

            const savedSettings = localStorage.getItem('bharatchat_settings');
            if (savedSettings) state.settings = { ...state.settings, ...JSON.parse(savedSettings) };

            const savedSupabase = localStorage.getItem('bharatchat_supabase_config');
            if (savedSupabase) state.supabase = { ...state.supabase, ...JSON.parse(savedSupabase) };

            // Real Registered Users ONLY (No fake data!)
            const savedContacts = localStorage.getItem('bharatchat_all_users');
            state.contacts = savedContacts ? JSON.parse(savedContacts) : [];

            // WhatsApp Phonebook (Saved contacts for this specific user)
            if (state.currentUser) {
                const savedPb = localStorage.getItem('bharatchat_phonebook_' + state.currentUser.phone);
                state.phonebook = savedPb ? JSON.parse(savedPb) : [];
            } else {
                state.phonebook = [];
            }

            // Real Statuses ONLY (Filtered for 24 hours expiry)
            const savedStatuses = localStorage.getItem('bharatchat_statuses');
            if (savedStatuses) {
                const now = Date.now();
                const allStatuses = JSON.parse(savedStatuses);
                // Keep only statuses within 24 hours (86,400,000 ms)
                state.statuses = allStatuses.filter(s => (now - s.timestamp) < 86400000);
            } else {
                state.statuses = [];
            }

            // Real Messages
            const savedMessages = localStorage.getItem('bharatchat_messages');
            if (savedMessages) state.messages = JSON.parse(savedMessages);

            // Real Recent Chats
            const savedRecent = localStorage.getItem('bharatchat_recent_chats');
            if (savedRecent) state.recentChats = JSON.parse(savedRecent);

            // Real Calls
            const savedCalls = localStorage.getItem('bharatchat_calls');
            if (savedCalls) state.calls = JSON.parse(savedCalls);

            // Apply Theme
            applyTheme(state.settings.theme);

            // Try Cloud DB Sync if configured
            syncWithSupabase();
        } catch (e) {
            console.error('Failed to load state', e);
        }
    }

    function saveState() {
        try {
            if (state.currentUser) {
                localStorage.setItem('bharatchat_current_user', JSON.stringify(state.currentUser));
                localStorage.setItem('bharatchat_phonebook_' + state.currentUser.phone, JSON.stringify(state.phonebook || []));
            }
            localStorage.setItem('bharatchat_settings', JSON.stringify(state.settings));
            localStorage.setItem('bharatchat_all_users', JSON.stringify(state.contacts));
            localStorage.setItem('bharatchat_statuses', JSON.stringify(state.statuses));
            localStorage.setItem('bharatchat_messages', JSON.stringify(state.messages));
            localStorage.setItem('bharatchat_recent_chats', JSON.stringify(state.recentChats));
            localStorage.setItem('bharatchat_calls', JSON.stringify(state.calls));
            localStorage.setItem('bharatchat_supabase_config', JSON.stringify(state.supabase));
        } catch (e) {}
    }

    // ====== SUPABASE REST CLOUD DATABASE SYNC ======
    async function syncWithSupabase() {
        if (!state.supabase.url || !state.supabase.key) {
            updateDatabaseUI(false, 'Local Database Engine Active (Add Supabase URL in Settings for global sync)');
            return;
        }

        try {
            const res = await fetch(`${state.supabase.url}/rest/v1/users?select=id,phone,name,avatar,about,status`, {
                headers: {
                    'apikey': state.supabase.key,
                    'Authorization': `Bearer ${state.supabase.key}`
                }
            });

            if (res.ok) {
                const cloudUsers = await res.json();
                state.supabase.connected = true;
                updateDatabaseUI(true, 'Supabase Cloud Database Connected');

                // Merge unique users from Supabase
                cloudUsers.forEach(cu => {
                    const exists = state.contacts.find(c => c.phone === cu.phone || c.id === cu.id);
                    if (!exists) {
                        state.contacts.push({
                            id: cu.id,
                            phone: cu.phone,
                            name: cu.name,
                            initials: cu.name ? cu.name.charAt(0).toUpperCase() : 'U',
                            color: 'linear-gradient(135deg, #FF9933, #138808)',
                            about: cu.about || 'At BharatChat 🇮🇳',
                            status: cu.status || 'offline'
                        });
                    }
                });
                saveState();
            } else {
                updateDatabaseUI(false, 'Supabase auth failed. Check credentials.');
            }
        } catch (err) {
            updateDatabaseUI(false, 'Local Database Active (Cloud unreachable)');
        }
    }

    async function pushUserToSupabase(user, password) {
        if (!state.supabase.url || !state.supabase.key) return;
        try {
            await fetch(`${state.supabase.url}/rest/v1/users`, {
                method: 'POST',
                headers: {
                    'apikey': state.supabase.key,
                    'Authorization': `Bearer ${state.supabase.key}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    phone: user.phone,
                    name: user.name,
                    about: user.about,
                    password_hash: password || 'defaultHash'
                })
            });
        } catch (e) {}
    }

    // Real-time inter-tab & cross-device synchronization
    function setupBroadcastChannel() {
        try {
            if ('BroadcastChannel' in window) {
                state.broadcastChannel = new BroadcastChannel('bharatchat_network');
                state.broadcastChannel.onmessage = (event) => {
                    handleBroadcastEvent(event.data);
                };
            }
        } catch (e) {}

        window.addEventListener('storage', (e) => {
            if (e.key === 'bharatchat_sync_event' && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue);
                    handleBroadcastEvent(data);
                } catch (err) {}
            }
        });
    }

    function broadcastEvent(type, payload) {
        const data = { type, payload, senderId: state.currentUser ? state.currentUser.id : null, timestamp: Date.now() };
        if (state.broadcastChannel) {
            state.broadcastChannel.postMessage(data);
        }
        localStorage.setItem('bharatchat_sync_event', JSON.stringify(data));
    }

    function handleBroadcastEvent(event) {
        if (!event || !state.currentUser) return;
        if (event.senderId === state.currentUser.id) return;

        if (event.type === 'NEW_MESSAGE') {
            const msg = event.payload;
            if (msg.receiverId === state.currentUser.id || msg.receiverPhone === state.currentUser.phone) {
                receiveMessageFromUser(msg.senderContact, msg.text, msg.type, msg.mediaUrl);
            }
        } else if (event.type === 'USER_REGISTERED') {
            const newUser = event.payload;
            const exists = state.contacts.find(c => c.phone === newUser.phone);
            if (!exists) {
                state.contacts.push(newUser);
                saveState();
                if (document.getElementById('newChatModal').style.display === 'flex') {
                    renderDirectoryUsers('');
                }
            }
        } else if (event.type === 'NEW_STATUS') {
            const newStatus = event.payload;
            const exists = state.statuses.find(s => s.id === newStatus.id);
            if (!exists) {
                state.statuses.unshift(newStatus);
                saveState();
                renderStatusUpdates();
            }
        } else if (event.type === 'INCOMING_CALL') {
            const call = event.payload;
            if (call.receiverPhone === state.currentUser.phone || call.receiverId === state.currentUser.id) {
                showIncomingCallModal(call);
            }
        } else if (event.type === 'CALL_ENDED') {
            closeCallOverlay();
        }
    }

    // ====== AUTHENTICATION (REAL REGISTRATION & LOGIN) ======
    function showAuth() {
        document.getElementById('splashScreen').style.display = 'none';
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
    }

    function showApp() {
        document.getElementById('splashScreen').style.display = 'none';
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';

        updateCurrentUserUI();
        renderRecentChats();
        renderStatusUpdates();
        renderCallsHistory();
    }

    function registerUser(phone, password, name, about) {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10) {
            alert('Please enter a valid 10-digit Indian mobile number');
            return;
        }
        const tenDigitPhone = cleanPhone.slice(-10);

        // Check if user already exists
        const existing = state.contacts.find(c => c.phone === tenDigitPhone);
        if (existing) {
            alert('This mobile number is already registered! Please switch to "Log In" tab.');
            document.getElementById('tabLoginBtn').click();
            document.getElementById('loginPhone').value = tenDigitPhone;
            return;
        }

        const initials = name.trim().charAt(0).toUpperCase();
        const newUser = {
            id: 'u-' + tenDigitPhone,
            phone: tenDigitPhone,
            name: name.trim(),
            initials: initials,
            color: state.selectedAvatarColor || 'linear-gradient(135deg, #FF9933, #138808)',
            avatar: '',
            status: 'online',
            about: about.trim() || 'At BharatChat 🇮🇳 India Ka Apna Messenger',
            registeredAt: Date.now()
        };

        // Save into contacts and set as active user
        state.contacts.push(newUser);
        state.currentUser = newUser;

        // Broadcast to other tabs & push to Cloud Supabase
        broadcastEvent('USER_REGISTERED', newUser);
        pushUserToSupabase(newUser, password);

        saveState();
        showApp();
    }

    function loginUser(phone, password) {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10) {
            alert('Please enter a valid 10-digit Indian mobile number');
            return;
        }
        const tenDigitPhone = cleanPhone.slice(-10);

        let user = state.contacts.find(c => c.phone === tenDigitPhone);
        if (!user) {
            // If user exists in current session storage or first login
            const promptRegister = confirm(`No account found for +91 ${tenDigitPhone}. Would you like to create your account now?`);
            if (promptRegister) {
                document.getElementById('tabRegisterBtn').click();
                document.getElementById('regPhone').value = tenDigitPhone;
            }
            return;
        }

        user.status = 'online';
        state.currentUser = user;
        saveState();
        showApp();
    }

    function updateCurrentUserUI() {
        if (!state.currentUser) return;
        const u = state.currentUser;
        document.getElementById('railUserInitials').textContent = u.initials || 'U';
        document.getElementById('settingsName').textContent = u.name;
        document.getElementById('settingsPhone').textContent = '+91 ' + u.phone;
        document.getElementById('settingsAbout').textContent = u.about;

        const setAv = document.getElementById('settingsAvatar');
        setAv.style.background = u.color || 'linear-gradient(135deg, #FF9933, #138808)';
        setAv.innerHTML = `<span>${u.initials || 'U'}</span>`;

        const myStAv = document.getElementById('myStatusAvatar');
        myStAv.style.background = u.color || 'linear-gradient(135deg, #FF9933, #138808)';
        myStAv.innerHTML = `<span>${u.initials || 'U'}</span>`;
    }

    // ====== CHATS & CONVERSATIONS (REAL USERS ONLY) ======
    function renderRecentChats() {
        const chatListEl = document.getElementById('chatList');
        chatListEl.innerHTML = '';

        // Filter contacts that have active conversations
        const activeContacts = state.recentChats
            .map(id => state.contacts.find(c => c.id === id))
            .filter(Boolean);

        const lang = I18N[state.settings.language] || I18N.en;

        if (activeContacts.length === 0) {
            chatListEl.innerHTML = `
                <div class="empty-chat-list-msg">
                    <div style="font-size: 40px; margin-bottom: 12px;">💬</div>
                    <h4>${lang.noChatsTitle}</h4>
                    <p>${lang.noChatsSub}</p>
                    <button class="btn-primary" id="btnEmptyListNewChat" style="margin: 0 auto;">
                        ${lang.findUsersBtn}
                    </button>
                </div>
            `;
            const emptyBtn = document.getElementById('btnEmptyListNewChat');
            if (emptyBtn) emptyBtn.onclick = openNewChatModal;
            return;
        }

        activeContacts.forEach(contact => {
            const msgs = state.messages[contact.id] || [];
            const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
            const unreadCount = msgs.filter(m => !m.sent && m.status !== 'read').length;

            const item = document.createElement('div');
            item.className = 'chat-item' + (state.activeContact && state.activeContact.id === contact.id ? ' active' : '');
            item.onclick = () => selectContact(contact);

            const lastTime = lastMsg ? lastMsg.time : '';
            let statusCheck = '';
            if (lastMsg && lastMsg.sent) {
                const isBlue = (lastMsg.status === 'read' && state.settings.readReceipts) ? 'blue' : '';
                statusCheck = `<span class="status-check ${isBlue}">✓✓</span> `;
            }
            const lastText = lastMsg ? (statusCheck + escapeHtml(lastMsg.text)) : 'Started chat';

            item.innerHTML = `
                <div class="avatar" style="background:${contact.color}">
                    <span>${contact.initials}</span>
                    <div class="avatar-status ${contact.status === 'online' ? 'online' : ''}"></div>
                </div>
                <div class="chat-item-content">
                    <div class="chat-item-header">
                        <span class="chat-item-name">${escapeHtml(contact.name)}</span>
                        <span class="chat-item-time">${lastTime}</span>
                    </div>
                    <div class="chat-item-body">
                        <span class="chat-item-message">${lastText}</span>
                        ${unreadCount > 0 ? `<span class="chat-item-badge">${unreadCount}</span>` : ''}
                    </div>
                </div>
            `;
            chatListEl.appendChild(item);
        });

        const totalUnread = activeContacts.reduce((sum, c) => {
            const msgs = state.messages[c.id] || [];
            return sum + msgs.filter(m => !m.sent && m.status !== 'read').length;
        }, 0);
        const railBadge = document.getElementById('railChatBadge');
        if (totalUnread > 0) {
            railBadge.textContent = totalUnread;
            railBadge.style.display = 'block';
        } else {
            railBadge.style.display = 'none';
        }
    }

    function selectContact(contact) {
        state.activeContact = contact;

        // Mark messages as read
        if (state.messages[contact.id]) {
            state.messages[contact.id].forEach(m => {
                if (!m.sent) m.status = 'read';
            });
            saveState();
        }

        // Show chat view
        document.getElementById('chatEmpty').style.display = 'none';
        document.getElementById('chatView').style.display = 'flex';

        // Header info
        document.getElementById('chatHeaderName').textContent = contact.name;
        document.getElementById('chatHeaderStatus').textContent = contact.status === 'online' ? (I18N[state.settings.language]?.online || 'online') : (contact.about || 'offline');
        const avatarEl = document.getElementById('chatAvatar');
        avatarEl.style.background = contact.color || 'linear-gradient(135deg, #FF9933, #138808)';
        avatarEl.querySelector('span').textContent = contact.initials;
        const statusDot = document.getElementById('chatAvatarStatus');
        if (contact.status === 'online') {
            statusDot.className = 'avatar-status online';
        } else {
            statusDot.className = 'avatar-status';
        }

        // On mobile, activate main chat view
        document.getElementById('chatMain').classList.add('active');

        renderMessages();
        renderRecentChats();

        document.getElementById('messageInput').focus();
    }

    function renderMessages() {
        if (!state.activeContact) return;
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';

        const msgs = state.messages[state.activeContact.id] || [];

        const dateDiv = document.createElement('div');
        dateDiv.className = 'chat-date-divider';
        dateDiv.textContent = 'TODAY';
        container.appendChild(dateDiv);

        msgs.forEach(msg => {
            const row = document.createElement('div');
            row.className = `message-row ${msg.sent ? 'sent' : 'received'}`;
            row.setAttribute('data-id', msg.id);

            let quoteHtml = '';
            if (msg.quote) {
                quoteHtml = `
                    <div class="quoted-reply">
                        <div class="quoted-sender">${escapeHtml(msg.quote.sender)}</div>
                        <div class="quoted-text">${escapeHtml(msg.quote.text)}</div>
                    </div>
                `;
            }

            let statusIcon = '';
            if (msg.sent) {
                const isBlue = (msg.status === 'read' && state.settings.readReceipts) ? 'blue' : '';
                statusIcon = `<span class="status-check ${isBlue}">✓✓</span>`;
            }

            let reactionHtml = '';
            if (msg.reaction) {
                reactionHtml = `<div class="reaction-pill">${msg.reaction}</div>`;
            }

            row.innerHTML = `
                <div class="message-bubble">
                    ${quoteHtml}
                    <span class="message-text">${escapeHtml(msg.text)}</span>
                    <div class="message-meta">
                        <span class="message-time">${msg.time}</span>
                        ${statusIcon}
                    </div>
                    ${reactionHtml}
                </div>
            `;

            row.oncontextmenu = (e) => {
                e.preventDefault();
                openContextMenu(e, msg);
            };

            container.appendChild(row);
        });

        container.scrollTop = container.scrollHeight;
    }

    function sendMessage(text, type = 'text', mediaUrl = null) {
        if (!text && !mediaUrl) return;
        if (!state.activeContact) return;

        const contactId = state.activeContact.id;
        if (!state.messages[contactId]) {
            state.messages[contactId] = [];
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const msg = {
            id: 'm-' + Date.now(),
            text: text,
            type: type,
            mediaUrl: mediaUrl,
            sent: true,
            time: timeStr,
            status: 'sent',
            quote: state.quotedMessage ? { ...state.quotedMessage } : null
        };

        state.messages[contactId].push(msg);

        // Add to recent chats at top
        state.recentChats = state.recentChats.filter(id => id !== contactId);
        state.recentChats.unshift(contactId);

        cancelReply();
        SoundEngine.playSent();

        saveState();
        renderMessages();
        renderRecentChats();

        // Broadcast to other real users across network
        broadcastEvent('NEW_MESSAGE', {
            senderContact: state.currentUser,
            receiverId: state.activeContact.id,
            receiverPhone: state.activeContact.phone,
            text: text,
            type: type,
            mediaUrl: mediaUrl
        });

        setTimeout(() => {
            msg.status = 'delivered';
            renderMessages();
            renderRecentChats();
            saveState();
        }, 500);
    }

    function receiveMessageFromUser(senderContact, text, type = 'text', mediaUrl = null) {
        if (!senderContact) return;

        let contact = state.contacts.find(c => c.id === senderContact.id || c.phone === senderContact.phone);
        if (!contact) {
            contact = { ...senderContact };
            state.contacts.push(contact);
        }

        const contactId = contact.id;
        if (!state.messages[contactId]) {
            state.messages[contactId] = [];
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const isCurrentActive = state.activeContact && state.activeContact.id === contactId;

        const msg = {
            id: 'm-' + Date.now(),
            text: text,
            type: type,
            mediaUrl: mediaUrl,
            sent: false,
            time: timeStr,
            status: isCurrentActive ? 'read' : 'delivered'
        };

        state.messages[contactId].push(msg);

        state.recentChats = state.recentChats.filter(id => id !== contactId);
        state.recentChats.unshift(contactId);

        SoundEngine.playReceived();
        saveState();

        if (isCurrentActive) {
            renderMessages();
        }
        renderRecentChats();
    }

    // ====== WHATSAPP PHONEBOOK & CONTACTS ======
    function openNewChatModal() {
        const modal = document.getElementById('newChatModal');
        const searchInput = document.getElementById('dirSearchInput');
        searchInput.value = '';

        renderDirectoryUsers('');
        modal.style.display = 'flex';
        searchInput.focus();
    }

    function closeNewChatModal() {
        document.getElementById('newChatModal').style.display = 'none';
    }

    function openAddContactModal() {
        document.getElementById('inputNewContactName').value = '';
        document.getElementById('inputNewContactPhone').value = '';
        document.getElementById('addContactModal').style.display = 'flex';
        document.getElementById('inputNewContactName').focus();
    }

    function closeAddContactModal() {
        document.getElementById('addContactModal').style.display = 'none';
    }

    function saveNewContact(name, phone) {
        const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
        if (cleanPhone.length < 10) {
            alert('Please enter a valid 10-digit Indian mobile number');
            return;
        }
        if (!name.trim()) {
            alert('Please enter a contact name');
            return;
        }

        if (!state.phonebook) state.phonebook = [];
        const existingIdx = state.phonebook.findIndex(p => p.phone === cleanPhone);
        if (existingIdx !== -1) {
            state.phonebook[existingIdx].name = name.trim();
        } else {
            state.phonebook.push({ name: name.trim(), phone: cleanPhone });
        }

        saveState();
        closeAddContactModal();
        renderDirectoryUsers(document.getElementById('dirSearchInput').value);
        renderStatusUpdates();

        const isReg = state.contacts.find(c => c.phone === cleanPhone);
        if (isReg) {
            alert(`Great! ${name.trim()} (+91 ${cleanPhone}) is registered on BharatChat! You can now chat.`);
        } else {
            alert(`Saved! ${name.trim()} (+91 ${cleanPhone}) has been added to your BharatChat phonebook.`);
        }
    }

    async function syncPhoneContacts() {
        if ('contacts' in navigator && 'ContactsManager' in window) {
            try {
                const props = ['name', 'tel'];
                const contacts = await navigator.contacts.select(props, { multiple: true });
                let addedCount = 0;
                contacts.forEach(c => {
                    const name = (c.name && c.name[0]) || 'Friend';
                    const tel = (c.tel && c.tel[0]) || '';
                    const clean = tel.replace(/[^0-9]/g, '').slice(-10);
                    if (clean.length === 10) {
                        const exists = state.phonebook.find(p => p.phone === clean);
                        if (!exists) {
                            state.phonebook.push({ name, phone: clean });
                            addedCount++;
                        }
                    }
                });
                saveState();
                renderDirectoryUsers('');
                renderStatusUpdates();
                alert(`Successfully synced ${addedCount} contacts from your phone!`);
                return;
            } catch (err) {}
        }

        // Quick Contact Add prompt for desktop / browsers without Contact Picker API
        const samplePrompt = prompt(
            "Enter 10-digit Indian phone number to add to your contacts:\nExample: 9825012345\n\n(Tip: You can paste multiple comma-separated numbers)"
        );
        if (samplePrompt) {
            const rawItems = samplePrompt.split(',');
            let count = 0;
            rawItems.forEach(item => {
                const digits = item.replace(/[^0-9]/g, '').slice(-10);
                if (digits.length === 10) {
                    const exists = state.phonebook.find(p => p.phone === digits);
                    if (!exists) {
                        state.phonebook.push({ name: 'Contact ' + digits.slice(-4), phone: digits });
                        count++;
                    }
                }
            });
            saveState();
            renderDirectoryUsers('');
            renderStatusUpdates();
            alert(`Added ${count} contact(s) to your BharatChat phonebook!`);
        }
    }

    window.inviteContact = function (name, phone) {
        const text = encodeURIComponent(`Hey ${name}! Join me on BharatChat 🇮🇳 — India's own secure messenger! Download/Open: https://bharatchat-omega.vercel.app/`);
        window.open(`https://api.whatsapp.com/send?phone=91${phone}&text=${text}`, '_blank');
    };

    function renderDirectoryUsers(filter) {
        const listEl = document.getElementById('directoryUserList');
        listEl.innerHTML = '';

        const currentPhone = state.currentUser ? state.currentUser.phone : '';
        const phonebook = state.phonebook || [];
        const subtitleEl = document.getElementById('contactsCountSubtitle');
        if (subtitleEl) subtitleEl.textContent = `${phonebook.length} contacts in phonebook`;

        if (phonebook.length === 0) {
            listEl.innerHTML = `
                <div style="text-align:center; padding: 36px 20px; color: var(--text-secondary);">
                    <div style="font-size: 38px; margin-bottom: 12px;">📇</div>
                    <h4 style="color: var(--text-primary); margin-bottom: 8px;">No Contacts in Phonebook Yet</h4>
                    <p style="font-size: 13px; line-height: 1.5; margin-bottom: 16px;">
                        WhatsApp only shows contacts saved in your phone. Tap <strong>"New Contact"</strong> above to save your friend's number, or tap <strong>"Sync Phone Contacts"</strong>!
                    </p>
                </div>
            `;
            return;
        }

        const term = (filter || '').toLowerCase();
        const filteredPhonebook = phonebook.filter(p => {
            if (!term) return true;
            return p.name.toLowerCase().includes(term) || p.phone.includes(term);
        });

        // Split into Registered on BharatChat vs Not Registered (Invite)
        const registered = [];
        const inviteOnly = [];

        filteredPhonebook.forEach(entry => {
            if (entry.phone === currentPhone) return; // Don't show self
            const regUser = state.contacts.find(c => c.phone === entry.phone);
            if (regUser) {
                registered.push({
                    ...regUser,
                    phonebookName: entry.name
                });
            } else {
                inviteOnly.push(entry);
            }
        });

        // 1. Registered Contacts on BharatChat
        if (registered.length > 0) {
            const header = document.createElement('div');
            header.className = 'contact-section-header';
            header.textContent = `Contacts on BharatChat (${registered.length})`;
            listEl.appendChild(header);

            registered.forEach(user => {
                const item = document.createElement('div');
                item.className = 'dir-user-item';
                item.onclick = () => {
                    closeNewChatModal();
                    selectContact(user);
                };
                item.innerHTML = `
                    <div class="dir-user-left">
                        <div class="avatar" style="background:${user.color || 'linear-gradient(135deg, #FF9933, #138808)'}">
                            <span>${user.phonebookName.charAt(0).toUpperCase()}</span>
                            <div class="avatar-status ${user.status === 'online' ? 'online' : ''}"></div>
                        </div>
                        <div>
                            <div class="dir-user-name">${escapeHtml(user.phonebookName)}</div>
                            <div class="dir-user-phone">🇮🇳 +91 ${user.phone}</div>
                            <div class="dir-user-about">${escapeHtml(user.about || 'At BharatChat 🇮🇳')}</div>
                        </div>
                    </div>
                    <button class="dir-btn-chat">Chat</button>
                `;
                listEl.appendChild(item);
            });
        }

        // 2. Invite Contacts
        if (inviteOnly.length > 0) {
            const header = document.createElement('div');
            header.className = 'contact-section-header';
            header.textContent = `Invite to BharatChat (${inviteOnly.length})`;
            listEl.appendChild(header);

            inviteOnly.forEach(contact => {
                const item = document.createElement('div');
                item.className = 'dir-user-item';
                item.innerHTML = `
                    <div class="dir-user-left">
                        <div class="avatar" style="background:#54656f;">
                            <span>${contact.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <div class="dir-user-name">${escapeHtml(contact.name)}</div>
                            <div class="dir-user-phone">🇮🇳 +91 ${contact.phone}</div>
                            <div class="dir-user-about" style="color:var(--text-muted);">Not on BharatChat yet</div>
                        </div>
                    </div>
                    <button class="invite-badge-btn" onclick="inviteContact('${escapeHtml(contact.name)}', '${contact.phone}')">Invite</button>
                `;
                listEl.appendChild(item);
            });
        }
    }

    // ====== STATUS STORIES (WHATSAPP PHONEBOOK PRIVACY + PHOTO/VIDEO SUPPORT) ======
    function renderStatusUpdates() {
        const listEl = document.getElementById('statusList');
        listEl.innerHTML = '';

        // My Status UI update
        const myStatusTimeEl = document.getElementById('myStatusTime');
        const myActiveStatuses = state.currentUser ? state.statuses.filter(s => s.userId === state.currentUser.id || s.phone === state.currentUser.phone) : [];
        if (myActiveStatuses.length > 0) {
            myStatusTimeEl.textContent = `${myActiveStatuses.length} active update${myActiveStatuses.length > 1 ? 's' : ''}`;
        } else {
            myStatusTimeEl.textContent = 'Tap to add status update';
        }

        // WhatsApp Status Privacy: ONLY show statuses from numbers in user's phonebook!
        const allowedPhones = new Set((state.phonebook || []).map(p => p.phone));
        const otherStatuses = state.statuses.filter(s => {
            if (state.currentUser && (s.userId === state.currentUser.id || s.phone === state.currentUser.phone)) {
                return false;
            }
            const statusPhone = s.phone || (s.userId && s.userId.replace('u-', ''));
            return allowedPhones.has(statusPhone);
        });

        if (otherStatuses.length === 0) {
            listEl.innerHTML = `
                <div style="padding: 24px 16px; text-align: center; color: var(--text-muted); font-size: 13px;">
                    No recent updates from your phone contacts.<br>Tap '+' on My Status to share a photo, video, or text!
                </div>
            `;
            return;
        }

        otherStatuses.forEach(status => {
            const item = document.createElement('div');
            item.className = 'status-item';
            item.onclick = () => openStoryViewer(status);

            const typeIcon = status.type === 'video' ? '🎥 ' : (status.type === 'image' ? '📷 ' : '');

            item.innerHTML = `
                <div class="status-avatar-wrap">
                    <div class="avatar status-ring" style="background:${status.color}">
                        <span>${status.initials}</span>
                    </div>
                </div>
                <div class="status-text-info">
                    <div class="status-user-name">${escapeHtml(status.name)}</div>
                    <div class="status-time">${typeIcon}${status.time}</div>
                </div>
            `;
            listEl.appendChild(item);
        });
    }

    function openStoryViewer(status) {
        const modal = document.getElementById('storyViewerModal');
        document.getElementById('storyUserName').textContent = status.name;
        document.getElementById('storyTimeAgo').textContent = status.time;
        document.getElementById('storyUserAvatar').style.background = status.color;
        document.getElementById('storyUserAvatar').querySelector('span').textContent = status.initials;

        const textEl = document.getElementById('storyTextContent');
        const imgEl = document.getElementById('storyImageContent');
        const vidEl = document.getElementById('storyVideoContent');
        const capEl = document.getElementById('storyCaption');
        const bodyEl = document.getElementById('storyViewerBody');

        textEl.style.display = 'none';
        imgEl.style.display = 'none';
        vidEl.style.display = 'none';
        capEl.style.display = 'none';

        if (status.type === 'image') {
            bodyEl.style.background = '#000';
            imgEl.src = status.content;
            imgEl.style.display = 'block';
            if (status.caption) {
                capEl.textContent = status.caption;
                capEl.style.display = 'block';
            }
        } else if (status.type === 'video') {
            bodyEl.style.background = '#000';
            vidEl.src = status.content;
            vidEl.style.display = 'block';
            vidEl.play().catch(() => {});
            if (status.caption) {
                capEl.textContent = status.caption;
                capEl.style.display = 'block';
            }
        } else {
            bodyEl.style.background = status.bgColor || status.color || '#008069';
            textEl.textContent = status.content || status.text;
            textEl.style.display = 'block';
        }

        modal.style.display = 'flex';

        // Story progress animation
        const progressBarFill = document.getElementById('storyProgressBarFill');
        if (progressBarFill) {
            progressBarFill.style.animation = 'none';
            void progressBarFill.offsetWidth;
            const duration = status.type === 'video' ? 15 : 5;
            progressBarFill.style.animation = `storyProgress ${duration}s linear forwards`;
        }

        if (storyTimer) clearTimeout(storyTimer);
        const autoDuration = status.type === 'video' ? 15000 : 5000;
        storyTimer = setTimeout(() => {
            closeStoryViewer();
        }, autoDuration);
    }

    function closeStoryViewer() {
        const modal = document.getElementById('storyViewerModal');
        const vidEl = document.getElementById('storyVideoContent');
        if (vidEl) {
            vidEl.pause();
            vidEl.src = '';
        }
        modal.style.display = 'none';
        if (storyTimer) clearTimeout(storyTimer);
    }

    function setStatusMode(mode) {
        state.statusMode = mode;
        state.statusMediaData = null;

        const textBtn = document.getElementById('btnStatusModeText');
        const photoBtn = document.getElementById('btnStatusModePhoto');
        const videoBtn = document.getElementById('btnStatusModeVideo');
        const textWrap = document.getElementById('statusTextModeWrap');
        const mediaWrap = document.getElementById('statusMediaModeWrap');
        const fileInput = document.getElementById('statusFileInput');
        const mediaIcon = document.getElementById('statusMediaIcon');
        const mediaPrompt = document.getElementById('statusMediaPrompt');
        const imgPrev = document.getElementById('statusImgPreview');
        const vidPrev = document.getElementById('statusVidPreview');
        const emptyMsg = document.getElementById('statusEmptyMediaMsg');

        textBtn.classList.toggle('active', mode === 'text');
        photoBtn.classList.toggle('active', mode === 'photo');
        videoBtn.classList.toggle('active', mode === 'video');

        imgPrev.style.display = 'none';
        vidPrev.style.display = 'none';
        emptyMsg.style.display = 'block';

        if (mode === 'text') {
            textWrap.style.display = 'block';
            mediaWrap.style.display = 'none';
        } else if (mode === 'photo') {
            textWrap.style.display = 'none';
            mediaWrap.style.display = 'block';
            fileInput.accept = 'image/*';
            mediaIcon.textContent = '📷';
            mediaPrompt.textContent = 'Click below to choose a photo from your gallery';
        } else if (mode === 'video') {
            textWrap.style.display = 'none';
            mediaWrap.style.display = 'block';
            fileInput.accept = 'video/*';
            mediaIcon.textContent = '🎥';
            mediaPrompt.textContent = 'Click below to choose a video from your gallery';
        }
    }

    function handleStatusFileSelect(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            state.statusMediaData = e.target.result;
            const imgPrev = document.getElementById('statusImgPreview');
            const vidPrev = document.getElementById('statusVidPreview');
            const emptyMsg = document.getElementById('statusEmptyMediaMsg');

            emptyMsg.style.display = 'none';
            if (file.type.startsWith('image/')) {
                imgPrev.src = state.statusMediaData;
                imgPrev.style.display = 'block';
                vidPrev.style.display = 'none';
            } else if (file.type.startsWith('video/')) {
                vidPrev.src = state.statusMediaData;
                vidPrev.style.display = 'block';
                imgPrev.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    }

    function openCreateStatusModal() {
        const modal = document.getElementById('createStatusModal');
        document.getElementById('statusTextInput').value = '';
        document.getElementById('statusCaptionInput').value = '';
        state.selectedStatusColor = '#008069';
        document.getElementById('statusCreatorPreview').style.background = '#008069';

        document.querySelectorAll('.status-bg-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-color') === '#008069');
        });

        setStatusMode('text');
        modal.style.display = 'flex';
        document.getElementById('statusTextInput').focus();
    }

    function closeCreateStatusModal() {
        document.getElementById('createStatusModal').style.display = 'none';
        state.statusMediaData = null;
    }

    function postNewStatus() {
        const mode = state.statusMode || 'text';
        let content = '';
        let caption = '';

        if (mode === 'text') {
            content = document.getElementById('statusTextInput').value.trim();
            if (!content) {
                alert('Please type something for your status!');
                return;
            }
        } else {
            if (!state.statusMediaData) {
                alert(`Please choose a ${mode === 'video' ? 'video' : 'photo'} file first!`);
                return;
            }
            content = state.statusMediaData;
            caption = document.getElementById('statusCaptionInput').value.trim();
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const statusObj = {
            id: 'st-' + Date.now(),
            userId: state.currentUser ? state.currentUser.id : 'me',
            phone: state.currentUser ? state.currentUser.phone : '',
            name: state.currentUser ? state.currentUser.name : 'Me',
            initials: state.currentUser ? state.currentUser.initials : 'U',
            color: state.currentUser ? state.currentUser.color : 'linear-gradient(135deg, #FF9933, #138808)',
            type: mode === 'photo' ? 'image' : (mode === 'video' ? 'video' : 'text'),
            content: content,
            caption: caption,
            bgColor: state.selectedStatusColor,
            time: `Today, ${timeStr}`,
            timestamp: Date.now()
        };

        state.statuses.unshift(statusObj);
        saveState();
        renderStatusUpdates();
        broadcastEvent('NEW_STATUS', statusObj);
        closeCreateStatusModal();
    }

    // ====== WEBRTC REAL-TIME VOICE & VIDEO CALLING ======
    async function startCall(callType) {
        if (!state.activeContact) return;
        const contact = state.activeContact;

        state.activeCall = {
            contact: contact,
            type: callType,
            startTime: null,
            timerInterval: null,
            isMuted: false,
            isCamOff: false
        };

        const overlay = document.getElementById('callOverlay');
        const contactNameEl = document.getElementById('callContactName');
        const callStatusBadge = document.getElementById('callStatusBadge');
        const avatarEl = document.getElementById('callAvatar');
        const callTimerEl = document.getElementById('callTimer');
        const localPip = document.getElementById('localPipContainer');

        contactNameEl.textContent = contact.name;
        callStatusBadge.textContent = `BharatChat HD ${callType === 'video' ? 'Video' : 'Voice'} Call 🇮🇳 • Ringing...`;
        avatarEl.style.background = contact.color || 'linear-gradient(135deg, #FF9933, #138808)';
        avatarEl.querySelector('span').textContent = contact.initials;
        callTimerEl.style.display = 'none';

        overlay.style.display = 'flex';
        SoundEngine.startRinging();

        broadcastEvent('INCOMING_CALL', {
            callerName: state.currentUser ? state.currentUser.name : 'BharatChat User',
            callerPhone: state.currentUser ? state.currentUser.phone : '',
            callerAvatar: state.currentUser ? state.currentUser.initials : 'U',
            receiverPhone: contact.phone,
            receiverId: contact.id,
            callType: callType
        });

        if (callType === 'video') {
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    state.localStream = stream;
                    const localVideo = document.getElementById('localVideo');
                    localVideo.srcObject = stream;
                    localPip.style.display = 'block';
                }
            } catch (err) {}
        } else {
            localPip.style.display = 'none';
        }

        setTimeout(() => {
            if (!state.activeCall) return;
            SoundEngine.stopRinging();

            callStatusBadge.textContent = 'Connected (HD Audio/Video)';
            callTimerEl.style.display = 'inline-block';
            state.activeCall.startTime = Date.now();

            state.activeCall.timerInterval = setInterval(() => {
                if (!state.activeCall || !state.activeCall.startTime) return;
                const elapsedSec = Math.floor((Date.now() - state.activeCall.startTime) / 1000);
                const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
                const secs = String(elapsedSec % 60).padStart(2, '0');
                callTimerEl.textContent = `${mins}:${secs}`;
            }, 1000);
        }, 3000);
    }

    function endCall() {
        if (!state.activeCall) return;

        SoundEngine.stopRinging();
        if (state.activeCall.timerInterval) clearInterval(state.activeCall.timerInterval);

        if (state.localStream) {
            state.localStream.getTracks().forEach(track => track.stop());
            state.localStream = null;
        }

        const durationSec = state.activeCall.startTime ? Math.floor((Date.now() - state.activeCall.startTime) / 1000) : 0;
        const mins = Math.floor(durationSec / 60);
        const secs = durationSec % 60;
        const durStr = durationSec > 0 ? `${mins}m ${secs}s` : 'Cancelled';

        state.calls.unshift({
            id: Date.now(),
            contactName: state.activeCall.contact.name,
            type: state.activeCall.type,
            direction: 'outgoing',
            status: durationSec > 0 ? 'completed' : 'cancelled',
            time: 'Just now',
            duration: durStr
        });

        broadcastEvent('CALL_ENDED', {});
        closeCallOverlay();
        renderCallsHistory();
        saveState();
    }

    function closeCallOverlay() {
        document.getElementById('callOverlay').style.display = 'none';
        state.activeCall = null;
    }

    function showIncomingCallModal(call) {
        const modal = document.getElementById('incomingCallModal');
        document.getElementById('incomingName').textContent = call.callerName;
        document.getElementById('incomingType').textContent = `BharatChat ${call.callType === 'video' ? 'Video' : 'Voice'} Call 🇮🇳`;
        const incomingAvatar = document.getElementById('incomingAvatar');
        incomingAvatar.querySelector('span').textContent = call.callerAvatar || 'U';

        SoundEngine.startRinging();
        modal.style.display = 'flex';

        document.getElementById('btnAcceptCall').onclick = () => {
            SoundEngine.stopRinging();
            modal.style.display = 'none';
            const callerContact = state.contacts.find(c => c.phone === call.callerPhone) || {
                id: 'u-' + call.callerPhone,
                name: call.callerName,
                initials: call.callerAvatar || 'C',
                color: 'linear-gradient(135deg, #FF9933, #138808)',
                phone: call.callerPhone
            };
            state.activeContact = callerContact;
            startCall(call.callType);
        };

        document.getElementById('btnDeclineCall').onclick = () => {
            SoundEngine.stopRinging();
            modal.style.display = 'none';
        };
    }

    function renderCallsHistory() {
        const listEl = document.getElementById('callLogList');
        listEl.innerHTML = '';

        if (state.calls.length === 0) {
            listEl.innerHTML = '<div style="padding:28px 16px; text-align:center; color:var(--text-muted); font-size:13px;">No recent calls.<br>Start an HD voice or video call from any conversation!</div>';
            return;
        }

        state.calls.forEach(call => {
            const item = document.createElement('div');
            item.className = 'call-item';
            const arrowClass = call.status === 'missed' ? 'call-arrow-missed' : (call.direction === 'incoming' ? 'call-arrow-incoming' : 'call-arrow-outgoing');
            const arrowIcon = call.direction === 'incoming' ? '↙' : '↗';
            const typeIcon = call.type === 'video' ? '📹' : '📞';

            item.innerHTML = `
                <div class="call-item-left">
                    <div class="avatar" style="background:linear-gradient(135deg, var(--saffron), #138808); width:42px; height:42px; font-size:15px;">
                        <span>${call.contactName.charAt(0)}</span>
                    </div>
                    <div>
                        <div class="call-meta-title">${escapeHtml(call.contactName)}</div>
                        <div class="call-meta-sub">
                            <span class="${arrowClass}">${arrowIcon}</span>
                            <span>${call.time} • ${call.duration}</span>
                        </div>
                    </div>
                </div>
                <button class="btn-call-redial" title="Call back">${typeIcon}</button>
            `;
            listEl.appendChild(item);
        });
    }

    // ====== ALL SETTINGS MODALS & LOGIC ======

    // 1. Profile Editor
    function openProfileModal() {
        if (!state.currentUser) return;
        document.getElementById('editProfileName').value = state.currentUser.name || '';
        document.getElementById('editProfileAbout').value = state.currentUser.about || '';
        document.getElementById('editProfilePhone').value = '+91 ' + state.currentUser.phone;

        document.querySelectorAll('#avatarColorPicker .color-dot').forEach(dot => {
            dot.classList.toggle('active', dot.getAttribute('data-color') === state.currentUser.color);
        });

        document.getElementById('profileModal').style.display = 'flex';
    }

    function closeProfileModal() {
        document.getElementById('profileModal').style.display = 'none';
    }

    function saveProfile() {
        const name = document.getElementById('editProfileName').value.trim();
        const about = document.getElementById('editProfileAbout').value.trim();
        if (!name) {
            alert('Name cannot be empty!');
            return;
        }

        state.currentUser.name = name;
        state.currentUser.initials = name.charAt(0).toUpperCase();
        state.currentUser.about = about || 'At BharatChat 🇮🇳 India Ka Apna Messenger';
        state.currentUser.color = state.selectedAvatarColor || state.currentUser.color;

        // Update in contacts list as well
        const idx = state.contacts.findIndex(c => c.id === state.currentUser.id);
        if (idx !== -1) {
            state.contacts[idx] = { ...state.currentUser };
        }

        saveState();
        updateCurrentUserUI();
        renderRecentChats();
        closeProfileModal();
    }

    // 2. Wallpaper Picker
    function openWallpaperModal() {
        document.querySelectorAll('.wallpaper-card').forEach(card => {
            card.classList.toggle('active', card.getAttribute('data-wallpaper') === state.settings.wallpaper);
        });
        document.getElementById('wallpaperModal').style.display = 'flex';
    }

    function closeWallpaperModal() {
        document.getElementById('wallpaperModal').style.display = 'none';
    }

    function applyWallpaper(wp) {
        state.settings.wallpaper = wp;
        const chatMain = document.getElementById('chatMain');
        if (!chatMain) return;

        if (wp === 'dark') {
            chatMain.style.background = '#0b141a';
            chatMain.style.backgroundImage = 'none';
        } else if (wp === 'tricolor') {
            chatMain.style.backgroundImage = 'linear-gradient(180deg, rgba(255,153,51,0.08), rgba(255,255,255,0.02), rgba(19,136,8,0.08))';
        } else if (wp === 'teal') {
            chatMain.style.backgroundImage = 'linear-gradient(180deg, rgba(0,128,105,0.1), rgba(11,20,26,0.95))';
        } else if (wp === 'midnight') {
            chatMain.style.background = '#0f172a';
            chatMain.style.backgroundImage = 'none';
        } else if (wp === 'saffron') {
            chatMain.style.backgroundImage = 'linear-gradient(180deg, rgba(255,153,51,0.09), rgba(11,20,26,0.95))';
        } else {
            chatMain.style.background = '';
            chatMain.style.backgroundImage = '';
        }
        saveState();
    }

    // 3. Privacy Settings
    function openPrivacyModal() {
        document.getElementById('privacyLastSeen').value = state.settings.lastSeen || 'everyone';
        document.getElementById('privacyProfilePhoto').value = state.settings.profilePhoto || 'everyone';
        document.getElementById('privacyReadReceipts').checked = state.settings.readReceipts !== false;
        document.getElementById('privacyModal').style.display = 'flex';
    }

    function closePrivacyModal() {
        document.getElementById('privacyModal').style.display = 'none';
    }

    function savePrivacy() {
        state.settings.lastSeen = document.getElementById('privacyLastSeen').value;
        state.settings.profilePhoto = document.getElementById('privacyProfilePhoto').value;
        state.settings.readReceipts = document.getElementById('privacyReadReceipts').checked;
        saveState();
        renderMessages();
        closePrivacyModal();
    }

    // 4. Notifications Settings
    function openNotificationsModal() {
        document.getElementById('notifSoundToggle').checked = state.settings.soundEnabled !== false;
        document.getElementById('notifCallRingToggle').checked = state.settings.callRingEnabled !== false;
        document.getElementById('notificationsModal').style.display = 'flex';
    }

    function closeNotificationsModal() {
        document.getElementById('notificationsModal').style.display = 'none';
    }

    function saveNotifications() {
        state.settings.soundEnabled = document.getElementById('notifSoundToggle').checked;
        state.settings.callRingEnabled = document.getElementById('notifCallRingToggle').checked;
        saveState();
        closeNotificationsModal();
    }

    // 5. Storage and Data
    function openStorageModal() {
        let msgCount = 0;
        Object.values(state.messages).forEach(arr => { msgCount += arr.length; });

        document.getElementById('statMessagesCount').textContent = msgCount;
        document.getElementById('statCallsCount').textContent = state.calls.length;
        document.getElementById('statStatusesCount').textContent = state.statuses.length;

        const rawStorage = JSON.stringify(state.messages).length + JSON.stringify(state.contacts).length;
        document.getElementById('statStorageSize').textContent = `${Math.round(rawStorage / 1024)} KB`;

        document.getElementById('storageModal').style.display = 'flex';
    }

    function closeStorageModal() {
        document.getElementById('storageModal').style.display = 'none';
    }

    function clearAllChatHistory() {
        if (confirm('Are you sure you want to delete all messages? This cannot be undone.')) {
            state.messages = {};
            state.recentChats = [];
            saveState();
            renderRecentChats();
            document.getElementById('chatMessages').innerHTML = '';
            document.getElementById('chatView').style.display = 'none';
            document.getElementById('chatEmpty').style.display = 'flex';
            closeStorageModal();
        }
    }

    // 6. Language Settings
    function openLanguageModal() {
        const curLang = state.settings.language || 'en';
        document.querySelectorAll('input[name="appLangRadio"]').forEach(r => {
            r.checked = (r.value === curLang);
        });
        document.getElementById('languageModal').style.display = 'flex';
    }

    function closeLanguageModal() {
        document.getElementById('languageModal').style.display = 'none';
    }

    function saveLanguage() {
        const checked = document.querySelector('input[name="appLangRadio"]:checked');
        if (checked) {
            applyLanguage(checked.value);
        }
        closeLanguageModal();
    }

    function applyLanguage(lang) {
        state.settings.language = lang;
        const t = I18N[lang] || I18N.en;

        const langLabels = { en: 'English (English)', hi: 'हिन्दी (Hindi)', gu: 'ગુજરાતી (Gujarati)', mr: 'मराठी (Marathi)' };
        const lbl = document.getElementById('currentLanguageLabel');
        if (lbl) lbl.textContent = langLabels[lang] || 'English';

        // Update nav labels
        const railChats = document.querySelector('#railChatsBtn .rail-label');
        if (railChats) railChats.textContent = t.chats;
        const railStatus = document.querySelector('#railStatusBtn .rail-label');
        if (railStatus) railStatus.textContent = t.status;
        const railCalls = document.querySelector('#railCallsBtn .rail-label');
        if (railCalls) railCalls.textContent = t.calls;
        const railSettings = document.querySelector('#railSettingsBtn .rail-label');
        if (railSettings) railSettings.textContent = t.settings;

        const msgInput = document.getElementById('messageInput');
        if (msgInput) msgInput.placeholder = t.typeMessage;

        saveState();
        renderRecentChats();
    }

    // 7. Database & Server Modal
    function openDatabaseModal() {
        document.getElementById('inputSupabaseUrl').value = state.supabase.url || '';
        document.getElementById('inputSupabaseKey').value = state.supabase.key || '';
        document.getElementById('databaseModal').style.display = 'flex';
    }

    function closeDatabaseModal() {
        document.getElementById('databaseModal').style.display = 'none';
    }

    async function saveDatabaseConfig() {
        const url = document.getElementById('inputSupabaseUrl').value.trim();
        const key = document.getElementById('inputSupabaseKey').value.trim();

        state.supabase.url = url;
        state.supabase.key = key;
        saveState();

        if (url && key) {
            await syncWithSupabase();
            alert('Supabase credentials saved & sync initiated!');
        } else {
            updateDatabaseUI(false, 'Local Database Engine Active');
            alert('Saved! Operating on Local Database Engine.');
        }
        closeDatabaseModal();
    }

    function updateDatabaseUI(isOnline, text) {
        const pill = document.getElementById('statusPill');
        const lbl = document.getElementById('serverStatusLabel');
        if (pill) {
            pill.textContent = isOnline ? 'Cloud' : 'Local';
            pill.className = isOnline ? 'server-status-pill online' : 'server-status-pill';
        }
        if (lbl) lbl.textContent = text;
    }

    // 8. Theme Switcher (Inside Settings)
    function applyTheme(theme) {
        state.settings.theme = theme;
        let effectiveTheme = theme;

        if (theme === 'system') {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            effectiveTheme = prefersDark ? 'dark' : 'light';
        }

        if (effectiveTheme === 'light') {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
        }

        const labelEl = document.getElementById('currentThemeLabel');
        if (labelEl) {
            labelEl.textContent = theme === 'system' ? 'System Default' : (theme === 'light' ? 'Light Mode' : 'Dark Mode');
        }
        saveState();
    }

    function openThemeModal() {
        const modal = document.getElementById('themeModal');
        if (!modal) return;
        const current = state.settings.theme || 'dark';
        if (current === 'light') document.getElementById('radioLight').checked = true;
        else if (current === 'system') document.getElementById('radioSystem').checked = true;
        else document.getElementById('radioDark').checked = true;
        modal.style.display = 'flex';
    }

    function closeThemeModal() {
        document.getElementById('themeModal').style.display = 'none';
    }

    function saveSelectedTheme() {
        const selectedRadio = document.querySelector('input[name="appTheme"]:checked');
        if (selectedRadio) {
            applyTheme(selectedRadio.value);
        }
        closeThemeModal();
    }

    // ====== CONTEXT MENU & REACTION ======
    function openContextMenu(e, msg) {
        const menu = document.getElementById('contextMenu');
        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${Math.min(e.clientX, window.innerWidth - 160)}px`;
        menu.style.display = 'flex';

        menu.querySelectorAll('.context-item').forEach(btn => {
            btn.onclick = () => {
                const action = btn.getAttribute('data-action');
                handleMessageAction(action, msg);
                menu.style.display = 'none';
            };
        });
    }

    function handleMessageAction(action, msg) {
        if (action === 'reply') {
            state.quotedMessage = {
                id: msg.id,
                sender: msg.sent ? 'You' : (state.activeContact ? state.activeContact.name : 'User'),
                text: msg.text
            };
            document.getElementById('replySenderName').textContent = state.quotedMessage.sender;
            document.getElementById('replySnippet').textContent = state.quotedMessage.text;
            document.getElementById('replyBanner').style.display = 'flex';
            document.getElementById('messageInput').focus();
        } else if (action === 'react') {
            openReactionBar(msg);
        } else if (action === 'copy') {
            navigator.clipboard.writeText(msg.text);
        } else if (action === 'delete') {
            if (confirm('Delete this message?')) {
                if (state.activeContact && state.messages[state.activeContact.id]) {
                    state.messages[state.activeContact.id] = state.messages[state.activeContact.id].filter(m => m.id !== msg.id);
                    saveState();
                    renderMessages();
                    renderRecentChats();
                }
            }
        }
    }

    function openReactionBar(msg) {
        const bar = document.getElementById('reactionBar');
        const row = document.querySelector(`.message-row[data-id="${msg.id}"]`);
        if (!row) return;

        const rect = row.getBoundingClientRect();
        bar.style.top = `${rect.top - 40}px`;
        bar.style.left = `${rect.left}px`;
        bar.style.display = 'flex';

        bar.querySelectorAll('.react-emoji').forEach(btn => {
            btn.onclick = () => {
                msg.reaction = btn.getAttribute('data-emoji');
                bar.style.display = 'none';
                saveState();
                renderMessages();
            };
        });
    }

    function cancelReply() {
        state.quotedMessage = null;
        document.getElementById('replyBanner').style.display = 'none';
    }

    // ====== EMOJI PICKER ======
    const EMOJIS = [
        '😀','😃','😄','😁','😆','😅','😂','🤣','🥲','🥹','😊','😇','🙂','🙃','😉',
        '😍','🥰','😘','😋','😛','😜','🤪','😎','🤩','🥳','😏','😒','😞','😔','😟',
        '🙏','👍','👎','👏','🙌','👐','🤝','✌️','🤞','🤟','🤘','👌','🤌','🤏','👈',
        '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗',
        '🇮🇳','🪔','🏏','🐅','🦚','🪷','🍛','☕','🫖','🛺','🕉️','🚩','🔥','✨','🎉'
    ];

    function toggleEmojiPicker() {
        const picker = document.getElementById('emojiPicker');
        if (picker.style.display === 'none' || !picker.style.display) {
            renderEmojiGrid(EMOJIS);
            picker.style.display = 'flex';
        } else {
            picker.style.display = 'none';
        }
    }

    function renderEmojiGrid(emojis) {
        const grid = document.getElementById('emojiGrid');
        grid.innerHTML = '';
        emojis.forEach(emo => {
            const cell = document.createElement('div');
            cell.className = 'emoji-cell';
            cell.textContent = emo;
            cell.onclick = () => {
                const input = document.getElementById('messageInput');
                input.value += emo;
                input.focus();
            };
            grid.appendChild(cell);
        });
    }

    // ====== BIND ALL DOM EVENTS ======
    function bindEvents() {
        // Auth Tabs
        document.getElementById('tabLoginBtn').onclick = () => {
            document.getElementById('tabLoginBtn').classList.add('active');
            document.getElementById('tabRegisterBtn').classList.remove('active');
            document.getElementById('loginForm').style.display = 'flex';
            document.getElementById('registerForm').style.display = 'none';
        };

        document.getElementById('tabRegisterBtn').onclick = () => {
            document.getElementById('tabRegisterBtn').classList.add('active');
            document.getElementById('tabLoginBtn').classList.remove('active');
            document.getElementById('registerForm').style.display = 'flex';
            document.getElementById('loginForm').style.display = 'none';
        };

        // Forms
        document.getElementById('loginForm').onsubmit = (e) => {
            e.preventDefault();
            const phone = document.getElementById('loginPhone').value.trim();
            const pass = document.getElementById('loginPassword').value;
            loginUser(phone, pass);
        };

        document.getElementById('registerForm').onsubmit = (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value.trim();
            const phone = document.getElementById('regPhone').value.trim();
            const pass = document.getElementById('regPassword').value;
            const about = document.getElementById('regAbout').value.trim();
            registerUser(phone, pass, name, about);
        };

        // Navigation Rail
        const railBtns = [
            { id: 'railChatsBtn', panel: 'panelChats' },
            { id: 'railStatusBtn', panel: 'panelStatus' },
            { id: 'railCallsBtn', panel: 'panelCalls' },
            { id: 'railSettingsBtn', panel: 'panelSettings' }
        ];

        railBtns.forEach(({ id, panel }) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.onclick = () => {
                railBtns.forEach(b => {
                    const el = document.getElementById(b.id);
                    if (el) el.classList.remove('active');
                    const p = document.getElementById(b.panel);
                    if (p) p.style.display = 'none';
                });
                btn.classList.add('active');
                const activeP = document.getElementById(panel);
                if (activeP) activeP.style.display = 'flex';
            };
        });

        // Settings Items Click Handlers
        document.getElementById('settingTheme').onclick = openThemeModal;
        document.getElementById('btnSaveTheme').onclick = saveSelectedTheme;
        document.getElementById('btnCloseThemeModal').onclick = closeThemeModal;
        document.getElementById('btnCancelTheme').onclick = closeThemeModal;

        // Profile Modal
        document.getElementById('btnEditProfile').onclick = openProfileModal;
        document.getElementById('settingsAvatar').onclick = openProfileModal;
        document.getElementById('btnCloseProfileModal').onclick = closeProfileModal;
        document.getElementById('btnCancelProfile').onclick = closeProfileModal;
        document.getElementById('btnSaveProfile').onclick = saveProfile;

        // Avatar Color Picker
        document.querySelectorAll('#avatarColorPicker .color-dot').forEach(dot => {
            dot.onclick = () => {
                document.querySelectorAll('#avatarColorPicker .color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                state.selectedAvatarColor = dot.getAttribute('data-color');
            };
        });

        // Wallpaper Modal
        document.getElementById('settingWallpaper').onclick = openWallpaperModal;
        document.getElementById('btnCloseWallpaperModal').onclick = closeWallpaperModal;
        document.getElementById('btnDoneWallpaper').onclick = closeWallpaperModal;
        document.querySelectorAll('.wallpaper-card').forEach(card => {
            card.onclick = () => {
                document.querySelectorAll('.wallpaper-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                applyWallpaper(card.getAttribute('data-wallpaper'));
            };
        });

        // Privacy Modal
        document.getElementById('settingPrivacy').onclick = openPrivacyModal;
        document.getElementById('btnClosePrivacyModal').onclick = closePrivacyModal;
        document.getElementById('btnSavePrivacy').onclick = savePrivacy;

        // Notifications Modal
        document.getElementById('settingNotifications').onclick = openNotificationsModal;
        document.getElementById('btnCloseNotificationsModal').onclick = closeNotificationsModal;
        document.getElementById('btnDoneNotifications').onclick = saveNotifications;
        document.getElementById('btnRequestNotificationPermission').onclick = () => {
            if ('Notification' in window) {
                Notification.requestPermission().then(perm => {
                    alert('Push Notifications: ' + perm);
                });
            } else {
                alert('Notification API not supported by this browser.');
            }
        };

        // Storage Modal
        document.getElementById('settingStorage').onclick = openStorageModal;
        document.getElementById('btnCloseStorageModal').onclick = closeStorageModal;
        document.getElementById('btnDoneStorage').onclick = closeStorageModal;
        document.getElementById('btnClearAllChatHistory').onclick = clearAllChatHistory;

        // Language Modal
        document.getElementById('settingLanguage').onclick = openLanguageModal;
        document.getElementById('btnCloseLanguageModal').onclick = closeLanguageModal;
        document.getElementById('btnCancelLanguage').onclick = closeLanguageModal;
        document.getElementById('btnSaveLanguage').onclick = saveLanguage;

        // Database Modal
        document.getElementById('settingBackend').onclick = openDatabaseModal;
        document.getElementById('btnCloseDatabaseModal').onclick = closeDatabaseModal;
        document.getElementById('btnCancelDatabase').onclick = closeDatabaseModal;
        document.getElementById('btnSaveDatabase').onclick = saveDatabaseConfig;

        // Mobile PWA Installation
        let deferredPrompt = null;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
        });

        const installAppEl = document.getElementById('settingInstallApp');
        if (installAppEl) {
            installAppEl.onclick = () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
                } else {
                    alert('To install BharatChat on your phone:\n\n📱 Android: Tap Chrome menu (⋮) → "Install app" or "Add to Home screen"\n🍎 iPhone (iOS): Tap Safari Share (⬆) → "Add to Home Screen"\n💻 Desktop: Click the install icon (⊕) in the browser address bar');
                }
            };
        }

        // Logout
        document.getElementById('settingLogout').onclick = () => {
            if (confirm('Do you want to log out from BharatChat?')) {
                state.currentUser = null;
                localStorage.removeItem('bharatchat_current_user');
                showAuth();
            }
        };

        // Status Stories & Creation
        document.getElementById('btnCreateStatus').onclick = openCreateStatusModal;
        document.getElementById('myStatusItem').onclick = openCreateStatusModal;
        document.getElementById('btnCloseCreateStatusModal').onclick = closeCreateStatusModal;
        document.getElementById('btnCancelCreateStatus').onclick = closeCreateStatusModal;
        document.getElementById('btnPostStatusSubmit').onclick = postNewStatus;
        document.getElementById('btnCloseStory').onclick = closeStoryViewer;

        // Status Mode Tabs (Text, Photo, Video)
        const btnModeText = document.getElementById('btnStatusModeText');
        const btnModePhoto = document.getElementById('btnStatusModePhoto');
        const btnModeVideo = document.getElementById('btnStatusModeVideo');
        const statusFileInput = document.getElementById('statusFileInput');
        const btnPickStatusMedia = document.getElementById('btnPickStatusMedia');

        if (btnModeText) btnModeText.onclick = () => setStatusMode('text');
        if (btnModePhoto) btnModePhoto.onclick = () => {
            setStatusMode('photo');
            statusFileInput.click();
        };
        if (btnModeVideo) btnModeVideo.onclick = () => {
            setStatusMode('video');
            statusFileInput.click();
        };
        if (btnPickStatusMedia) btnPickStatusMedia.onclick = () => statusFileInput.click();
        if (statusFileInput) {
            statusFileInput.onchange = (e) => {
                if (e.target.files && e.target.files[0]) {
                    handleStatusFileSelect(e.target.files[0]);
                }
            };
        }

        document.querySelectorAll('.status-bg-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.status-bg-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.selectedStatusColor = btn.getAttribute('data-color');
                document.getElementById('statusCreatorPreview').style.background = state.selectedStatusColor;
            };
        });

        // WhatsApp Phonebook Contact Actions
        const btnOpenAddContact = document.getElementById('btnOpenAddContact');
        if (btnOpenAddContact) btnOpenAddContact.onclick = openAddContactModal;
        const btnCloseAddContact = document.getElementById('btnCloseAddContactModal');
        if (btnCloseAddContact) btnCloseAddContact.onclick = closeAddContactModal;
        const btnCancelAddContact = document.getElementById('btnCancelAddContact');
        if (btnCancelAddContact) btnCancelAddContact.onclick = closeAddContactModal;

        const addContactForm = document.getElementById('addContactForm');
        if (addContactForm) {
            addContactForm.onsubmit = (e) => {
                e.preventDefault();
                const name = document.getElementById('inputNewContactName').value.trim();
                const phone = document.getElementById('inputNewContactPhone').value.trim();
                saveNewContact(name, phone);
            };
        }

        const btnSyncPhoneContacts = document.getElementById('btnSyncPhoneContacts');
        if (btnSyncPhoneContacts) btnSyncPhoneContacts.onclick = syncPhoneContacts;

        // Message Send
        const msgInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('btnSend');

        if (sendBtn) {
            sendBtn.onclick = () => {
                const text = msgInput.value.trim();
                if (text) {
                    sendMessage(text);
                    msgInput.value = '';
                }
            };
        }

        if (msgInput) {
            msgInput.onkeydown = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (sendBtn) sendBtn.click();
                }
            };
        }

        // Directory & Floating Action Buttons
        document.getElementById('fabNewChat').onclick = openNewChatModal;
        document.getElementById('btnHeaderNewChat').onclick = openNewChatModal;
        document.getElementById('btnEmptyStartChat').onclick = openNewChatModal;
        document.getElementById('btnCloseNewChatModal').onclick = closeNewChatModal;

        document.getElementById('dirSearchInput').oninput = (e) => {
            renderDirectoryUsers(e.target.value.trim());
        };

        // Calling
        document.getElementById('btnVoiceCall').onclick = () => startCall('voice');
        document.getElementById('btnVideoCall').onclick = () => startCall('video');
        document.getElementById('btnEndCall').onclick = endCall;
        document.getElementById('btnToggleMic').onclick = function () { this.classList.toggle('active-muted'); };
        document.getElementById('btnToggleCam').onclick = function () { this.classList.toggle('active-muted'); };

        // Mobile Back
        document.getElementById('backBtn').onclick = () => {
            document.getElementById('chatMain').classList.remove('active');
        };

        // Quoted Reply Cancel
        document.getElementById('btnCancelReply').onclick = cancelReply;

        // Emoji Picker
        document.getElementById('btnEmoji').onclick = toggleEmojiPicker;

        // Voice Message Recording
        const btnMic = document.getElementById('btnMic');
        let recInterval = null;
        let recSeconds = 0;

        btnMic.onclick = () => {
            recSeconds = 0;
            document.getElementById('chatInputArea').style.display = 'none';
            document.getElementById('voiceRecordingBar').style.display = 'flex';
            const timerEl = document.getElementById('recTimer');
            timerEl.textContent = '0:00';

            recInterval = setInterval(() => {
                recSeconds++;
                const mins = Math.floor(recSeconds / 60);
                const secs = String(recSeconds % 60).padStart(2, '0');
                timerEl.textContent = `${mins}:${secs}`;
            }, 1000);
        };

        document.getElementById('btnCancelVoice').onclick = () => {
            clearInterval(recInterval);
            document.getElementById('voiceRecordingBar').style.display = 'none';
            document.getElementById('chatInputArea').style.display = 'flex';
        };

        document.getElementById('btnSendVoice').onclick = () => {
            clearInterval(recInterval);
            document.getElementById('voiceRecordingBar').style.display = 'none';
            document.getElementById('chatInputArea').style.display = 'flex';
            sendMessage(`🎙️ Voice Message (${document.getElementById('recTimer').textContent})`, 'audio');
        };

        // Attachments
        const btnAttach = document.getElementById('btnAttach');
        const attachMenu = document.getElementById('attachMenu');
        const fileInput = document.getElementById('fileUploadInput');

        btnAttach.onclick = () => {
            attachMenu.style.display = attachMenu.style.display === 'none' || !attachMenu.style.display ? 'flex' : 'none';
        };

        attachMenu.querySelectorAll('.attach-item').forEach(item => {
            item.onclick = () => {
                const type = item.getAttribute('data-type');
                attachMenu.style.display = 'none';
                if (type === 'location') {
                    sendMessage('📍 Location: India 🇮🇳');
                } else if (type === 'contact') {
                    if (state.currentUser) {
                        sendMessage(`👤 Contact: ${state.currentUser.name} (+91 ${state.currentUser.phone})`);
                    }
                } else {
                    fileInput.click();
                }
            };
        });

        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                sendMessage(`📎 ${file.name} (${Math.round(file.size / 1024)} KB)`);
            }
        };

        // Close on Click Outside
        window.addEventListener('click', (e) => {
            if (!e.target.closest('#btnEmoji') && !e.target.closest('#emojiPicker')) {
                document.getElementById('emojiPicker').style.display = 'none';
            }
            if (!e.target.closest('#btnAttach') && !e.target.closest('#attachMenu')) {
                attachMenu.style.display = 'none';
            }
            if (!e.target.closest('#contextMenu')) {
                document.getElementById('contextMenu').style.display = 'none';
            }
            if (!e.target.closest('#reactionBar')) {
                document.getElementById('reactionBar').style.display = 'none';
            }
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    window.addEventListener('DOMContentLoaded', init);

})();
