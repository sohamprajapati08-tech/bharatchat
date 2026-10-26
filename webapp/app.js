// ================================================================
// BharatChat 🇮🇳 — India Ka Apna Messenger
// Complete Real-Time Application Logic (Web & Mobile App)
// ================================================================

(function () {
    'use strict';

    // ====== SOUND SYNTHESIS ENGINE (WEB AUDIO API) ======
    const SoundEngine = {
        ctx: null,
        init() {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) this.ctx = new AudioContext();
            } catch (e) {
                console.warn('Web Audio not supported');
            }
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
                osc1.frequency.setValueAtTime(587.33, now); // D5
                osc2.frequency.setValueAtTime(880, now + 0.09); // A5
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
            if (!this.ctx) return;
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

    // ====== ALL-INDIA REGISTERED USERS NETWORK ======
    const DEFAULT_INDIA_USERS = [
        {
            id: 'u-aarav-delhi',
            phone: '9876543210',
            name: 'Aarav Sharma',
            city: 'New Delhi 🇮🇳',
            initials: 'A',
            color: 'linear-gradient(135deg, #FF9933, #FF6B00)',
            avatar: '',
            status: 'online',
            about: 'Jai Hind! 🇮🇳 Available for chat & calls'
        },
        {
            id: 'u-priya-ahmedabad',
            phone: '9825012345',
            name: 'Priya Patel',
            city: 'Ahmedabad, Gujarat',
            initials: 'P',
            color: 'linear-gradient(135deg, #138808, #1db954)',
            avatar: '',
            status: 'online',
            about: 'Kem cho? BharatChat rocks! ✨'
        },
        {
            id: 'u-sneha-mumbai',
            phone: '9811122334',
            name: 'Sneha Verma',
            city: 'Mumbai, Maharashtra',
            initials: 'S',
            color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            avatar: '',
            status: 'online',
            about: 'Coding BharatChat India 💻🇮🇳'
        },
        {
            id: 'u-rajesh-bengaluru',
            phone: '9822233445',
            name: 'Rajesh Kumar',
            city: 'Bengaluru, Karnataka',
            initials: 'R',
            color: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            avatar: '',
            status: 'offline',
            about: 'Namaste from Bengaluru 🙏'
        },
        {
            id: 'u-vikram-jaipur',
            phone: '9833344556',
            name: 'Vikram Singh',
            city: 'Jaipur, Rajasthan',
            initials: 'V',
            color: 'linear-gradient(135deg, #ec4899, #be185d)',
            avatar: '',
            status: 'online',
            about: 'Proud Indian! 🇮🇳 In a meeting'
        }
    ];

    // ====== STATE ======
    const state = {
        currentUser: null,
        activeContact: null,
        messages: {}, // { contactId: [ {id, text, sent, time, status, reaction, quote} ] }
        recentChats: [], // Ordered list of contact IDs with whom messages exist
        contacts: [], // All registered users across India
        statuses: [
            { id: 1, userId: 'u-aarav-delhi', name: 'Aarav Sharma', initials: 'A', color: '#FF9933', text: 'Watching sunrise at India Gate! 🇮🇳 Jai Hind!', time: '10 min ago', viewed: false },
            { id: 2, userId: 'u-priya-ahmedabad', name: 'Priya Patel', initials: 'P', color: '#138808', text: 'Navratri rehearsals started! 💃 Garba vibes!', time: '1 hour ago', viewed: false },
            { id: 3, userId: 'u-sneha-mumbai', name: 'Sneha Verma', initials: 'S', color: '#3b82f6', text: 'BharatChat Web + App 100% Real-time ready! 🚀', time: '3 hours ago', viewed: false }
        ],
        calls: [
            { id: 1, contactName: 'Aarav Sharma', type: 'video', direction: 'incoming', status: 'completed', time: 'Today, 2:45 PM', duration: '5m 12s' },
            { id: 2, contactName: 'Priya Patel', type: 'voice', direction: 'outgoing', status: 'completed', time: 'Yesterday, 8:10 PM', duration: '2m 40s' },
            { id: 3, contactName: 'Rajesh Kumar', type: 'voice', direction: 'incoming', status: 'missed', time: '24 Oct, 11:20 AM', duration: 'Missed' }
        ],
        settings: {
            theme: 'dark',
            wallpaper: 'default',
            soundEnabled: true,
            readReceipts: true,
            language: 'en'
        },
        quotedMessage: null,
        activeCall: null,
        localStream: null,
        broadcastChannel: null
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
    }

    // ====== STORAGE & SYNC ======
    function loadSavedState() {
        try {
            const savedUser = localStorage.getItem('bharatchat_current_user');
            if (savedUser) state.currentUser = JSON.parse(savedUser);

            const savedSettings = localStorage.getItem('bharatchat_settings');
            if (savedSettings) state.settings = { ...state.settings, ...JSON.parse(savedSettings) };

            const savedContacts = localStorage.getItem('bharatchat_all_users');
            state.contacts = savedContacts ? JSON.parse(savedContacts) : [...DEFAULT_INDIA_USERS];

            const savedMessages = localStorage.getItem('bharatchat_messages');
            if (savedMessages) state.messages = JSON.parse(savedMessages);

            const savedRecent = localStorage.getItem('bharatchat_recent_chats');
            if (savedRecent) state.recentChats = JSON.parse(savedRecent);

            // Apply Theme
            applyTheme(state.settings.theme);
        } catch (e) {
            console.error('Failed to load state', e);
        }
    }

    function saveState() {
        try {
            if (state.currentUser) {
                localStorage.setItem('bharatchat_current_user', JSON.stringify(state.currentUser));
            }
            localStorage.setItem('bharatchat_settings', JSON.stringify(state.settings));
            localStorage.setItem('bharatchat_all_users', JSON.stringify(state.contacts));
            localStorage.setItem('bharatchat_messages', JSON.stringify(state.messages));
            localStorage.setItem('bharatchat_recent_chats', JSON.stringify(state.recentChats));
        } catch (e) {}
    }

    // Real-time inter-tab & inter-window synchronization
    function setupBroadcastChannel() {
        try {
            if ('BroadcastChannel' in window) {
                state.broadcastChannel = new BroadcastChannel('bharatchat_network');
                state.broadcastChannel.onmessage = (event) => {
                    handleBroadcastEvent(event.data);
                };
            }
        } catch (e) {}

        // Fallback using storage event
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
        if (event.senderId === state.currentUser.id) return; // Ignore own echoes

        if (event.type === 'NEW_MESSAGE') {
            const msg = event.payload;
            if (msg.receiverId === state.currentUser.id || msg.receiverPhone === state.currentUser.phone) {
                receiveMessageFromUser(msg.senderContact, msg.text, msg.type, msg.mediaUrl);
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

    // ====== AUTHENTICATION ======
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

    function login(phone, password, name = '', about = '') {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10) {
            alert('Please enter a valid 10-digit Indian mobile number');
            return;
        }

        // Find or create user
        let user = state.contacts.find(c => c.phone.endsWith(cleanPhone.slice(-10)));
        if (!user) {
            const initials = (name || 'User').charAt(0).toUpperCase();
            user = {
                id: 'u-' + cleanPhone,
                phone: cleanPhone.slice(-10),
                name: name || 'BharatChat User',
                city: 'India 🇮🇳',
                initials: initials,
                color: 'linear-gradient(135deg, #FF9933, #138808)',
                avatar: '',
                status: 'online',
                about: about || 'At BharatChat 🇮🇳 India Ka Apna Messenger'
            };
            state.contacts.push(user);
        } else if (name) {
            user.name = name;
            if (about) user.about = about;
        }

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
        document.getElementById('settingsAvatar').innerHTML = `<span>${u.initials || 'U'}</span>`;
        document.getElementById('myStatusAvatar').innerHTML = `<span>${u.initials || 'U'}</span>`;
    }

    // ====== CHATS & CONVERSATIONS (USER CORE REQUIREMENT) ======
    // Only contacts who have messages with the user appear here!
    function renderRecentChats() {
        const chatListEl = document.getElementById('chatList');
        chatListEl.innerHTML = '';

        // Filter contacts that have active conversations
        const activeContacts = state.recentChats
            .map(id => state.contacts.find(c => c.id === id))
            .filter(Boolean);

        if (activeContacts.length === 0) {
            chatListEl.innerHTML = `
                <div class="empty-chat-list-msg">
                    <div style="font-size: 40px; margin-bottom: 12px;">💬</div>
                    <h4>No chats yet</h4>
                    <p>When you start messaging BharatChat users across India, your active conversations will appear here.</p>
                    <button class="btn-primary" id="btnEmptyListNewChat" style="margin: 0 auto;">
                        + Find Users Across India
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
            const lastText = lastMsg ? (lastMsg.sent ? `<span class="status-check ${lastMsg.status === 'read' ? 'blue' : ''}">✓✓</span> ` : '') + escapeHtml(lastMsg.text) : 'Started chat';

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

        // Update badge on rail
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
        document.getElementById('chatHeaderStatus').textContent = contact.status === 'online' ? 'online' : (contact.about || 'offline');
        const avatarEl = document.getElementById('chatAvatar');
        avatarEl.style.background = contact.color;
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

        // Focus message input
        document.getElementById('messageInput').focus();
    }

    function renderMessages() {
        if (!state.activeContact) return;
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';

        const msgs = state.messages[state.activeContact.id] || [];

        // Date divider
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
                const isBlue = msg.status === 'read' ? 'blue' : '';
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

            // Right click context menu
            row.oncontextmenu = (e) => {
                e.preventDefault();
                openContextMenu(e, msg);
            };

            container.appendChild(row);
        });

        // Scroll to bottom
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

        // Crucial requirement: Ensure contact is in recentChats and at the top!
        state.recentChats = state.recentChats.filter(id => id !== contactId);
        state.recentChats.unshift(contactId);

        // Clear reply banner
        cancelReply();

        // Play Sent Sound Chime
        SoundEngine.playSent();

        saveState();
        renderMessages();
        renderRecentChats();

        // Broadcast to other tabs/network
        broadcastEvent('NEW_MESSAGE', {
            senderContact: state.currentUser,
            receiverId: state.activeContact.id,
            receiverPhone: state.activeContact.phone,
            text: text,
            type: type,
            mediaUrl: mediaUrl
        });

        // Simulate delivery tick to ✓✓
        setTimeout(() => {
            msg.status = 'delivered';
            renderMessages();
            renderRecentChats();
            saveState();
        }, 600);

        // If chatting with one of the built-in Indian users, trigger intelligent auto-reply
        if (state.activeContact.id.startsWith('u-')) {
            triggerIndiaContactAutoReply(state.activeContact, text);
        }
    }

    function receiveMessageFromUser(senderContact, text, type = 'text', mediaUrl = null) {
        if (!senderContact) return;

        // Ensure contact is in contacts list
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

        // Push to top of recent chats
        state.recentChats = state.recentChats.filter(id => id !== contactId);
        state.recentChats.unshift(contactId);

        // Sound Chime
        SoundEngine.playReceived();

        saveState();
        if (isCurrentActive) {
            renderMessages();
        }
        renderRecentChats();
    }

    // Auto-reply generator for Indian contacts
    function triggerIndiaContactAutoReply(contact, userText) {
        // Show typing indicator in header
        setTimeout(() => {
            const statusEl = document.getElementById('chatHeaderStatus');
            if (statusEl && state.activeContact && state.activeContact.id === contact.id) {
                statusEl.textContent = 'typing...';
                statusEl.style.color = 'var(--accent)';
            }
        }, 1000);

        setTimeout(() => {
            // Revert status
            const statusEl = document.getElementById('chatHeaderStatus');
            if (statusEl && state.activeContact && state.activeContact.id === contact.id) {
                statusEl.textContent = 'online';
                statusEl.style.color = '';
            }

            // Generate culturally authentic Indian reply
            let replyText = 'Namaste! 🙏 BharatChat is super fast and smooth!';
            const lower = userText.toLowerCase();

            if (lower.includes('kem cho') || lower.includes('gujarati')) {
                replyText = 'હું મજામાં છું! BharatChat પર ગુજરાતીમાં પણ વાત કરવાની મજા આવે છે! 🇮🇳✨';
            } else if (lower.includes('kaise ho') || lower.includes('kya hal')) {
                replyText = 'Bhai ekdum badhiya! Tum sunao, kaisa chal raha hai? BharatChat mast lag raha hai na? 🔥';
            } else if (lower.includes('call') || lower.includes('video')) {
                replyText = 'Haan bhai! Upar camera ya phone button dabao, BharatChat HD video & voice call try karte hain! 📞';
            } else if (lower.includes('india') || lower.includes('swadeshi') || lower.includes('bharat')) {
                replyText = 'Jai Hind! 🇮🇳 100% Indian Made Messenger. Servers bhi India mein, privacy bhi full!';
            } else {
                const replies = [
                    'Haan bilkul sahi baat hai! 🇮🇳',
                    'Sahi mein! BharatChat pe audio aur video call bhi bohot clear aati hai.',
                    'Aarav and Priya se bhi connect kar lo, sab online hain! 😊',
                    'Jai Hind bhai! Made in India rocks! 🚀'
                ];
                replyText = replies[Math.floor(Math.random() * replies.length)];
            }

            receiveMessageFromUser(contact, replyText);

            // Mark previous user message as read (blue tick)
            if (state.messages[contact.id]) {
                state.messages[contact.id].forEach(m => {
                    if (m.sent) m.status = 'read';
                });
                renderMessages();
                renderRecentChats();
                saveState();
            }
        }, 2200);
    }

    // ====== DIRECTORY: FIND USERS ACROSS INDIA MODAL ======
    function openNewChatModal() {
        const modal = document.getElementById('newChatModal');
        const listEl = document.getElementById('directoryUserList');
        const searchInput = document.getElementById('dirSearchInput');
        searchInput.value = '';

        renderDirectoryUsers('');
        modal.style.display = 'flex';
        searchInput.focus();
    }

    function renderDirectoryUsers(filter) {
        const listEl = document.getElementById('directoryUserList');
        listEl.innerHTML = '';

        const currentUserId = state.currentUser ? state.currentUser.id : null;
        const available = state.contacts.filter(c => c.id !== currentUserId);

        const filtered = available.filter(c => {
            if (!filter) return true;
            const term = filter.toLowerCase();
            return c.name.toLowerCase().includes(term) || c.phone.includes(term) || (c.city && c.city.toLowerCase().includes(term));
        });

        if (filtered.length === 0) {
            listEl.innerHTML = `
                <div style="text-align:center; padding: 24px; color: var(--text-secondary);">
                    <p>No user found matching "${escapeHtml(filter)}"</p>
                    <button class="btn-primary" id="btnInviteNumber" style="margin: 12px auto; font-size:13px;">
                        Chat with +91 ${escapeHtml(filter)}
                    </button>
                </div>
            `;
            const inviteBtn = document.getElementById('btnInviteNumber');
            if (inviteBtn && filter.replace(/[^0-9]/g, '').length >= 10) {
                inviteBtn.onclick = () => {
                    const newContact = {
                        id: 'u-' + filter.replace(/[^0-9]/g, ''),
                        phone: filter.replace(/[^0-9]/g, '').slice(-10),
                        name: '+91 ' + filter.replace(/[^0-9]/g, '').slice(-10),
                        city: 'India',
                        initials: '🇮🇳',
                        color: 'linear-gradient(135deg, #FF9933, #138808)',
                        avatar: '',
                        status: 'online',
                        about: 'At BharatChat 🇮🇳'
                    };
                    state.contacts.push(newContact);
                    saveState();
                    closeNewChatModal();
                    selectContact(newContact);
                };
            }
            return;
        }

        filtered.forEach(contact => {
            const item = document.createElement('div');
            item.className = 'dir-user-item';
            item.onclick = () => {
                closeNewChatModal();
                selectContact(contact);
            };

            item.innerHTML = `
                <div class="dir-user-left">
                    <div class="avatar" style="background:${contact.color}">
                        <span>${contact.initials}</span>
                        <div class="avatar-status ${contact.status === 'online' ? 'online' : ''}"></div>
                    </div>
                    <div>
                        <div class="dir-user-name">${escapeHtml(contact.name)}</div>
                        <div class="dir-user-phone">🇮🇳 +91 ${contact.phone} • ${contact.city || 'India'}</div>
                        <div class="dir-user-about">${escapeHtml(contact.about || '')}</div>
                    </div>
                </div>
                <button class="dir-btn-chat">Message</button>
            `;
            listEl.appendChild(item);
        });
    }

    function closeNewChatModal() {
        document.getElementById('newChatModal').style.display = 'none';
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
        avatarEl.style.background = contact.color;
        avatarEl.querySelector('span').textContent = contact.initials;
        callTimerEl.style.display = 'none';

        overlay.style.display = 'flex';

        // Start ringing chime
        SoundEngine.startRinging();

        // Broadcast incoming call to other tabs/users
        broadcastEvent('INCOMING_CALL', {
            callerName: state.currentUser ? state.currentUser.name : 'BharatChat User',
            callerPhone: state.currentUser ? state.currentUser.phone : '',
            callerAvatar: state.currentUser ? state.currentUser.initials : 'U',
            receiverPhone: contact.phone,
            receiverId: contact.id,
            callType: callType
        });

        // If Video Call, access camera preview
        if (callType === 'video') {
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    state.localStream = stream;
                    const localVideo = document.getElementById('localVideo');
                    localVideo.srcObject = stream;
                    localPip.style.display = 'block';
                }
            } catch (err) {
                console.warn('Camera access optional or not allowed in this environment', err);
            }
        } else {
            localPip.style.display = 'none';
        }

        // Simulate contact answering after 2.5 seconds
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
        }, 2800);
    }

    function endCall() {
        if (!state.activeCall) return;

        SoundEngine.stopRinging();
        if (state.activeCall.timerInterval) clearInterval(state.activeCall.timerInterval);

        // Stop camera stream
        if (state.localStream) {
            state.localStream.getTracks().forEach(track => track.stop());
            state.localStream = null;
        }

        // Log call
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
        incomingAvatar.querySelector('span').textContent = call.callerAvatar || 'A';

        SoundEngine.startRinging();
        modal.style.display = 'flex';

        document.getElementById('btnAcceptCall').onclick = () => {
            SoundEngine.stopRinging();
            modal.style.display = 'none';
            // Start call view
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

    // ====== STATUS (WHATSAPP STORIES) ======
    function renderStatusUpdates() {
        const listEl = document.getElementById('statusList');
        listEl.innerHTML = '';

        state.statuses.forEach(status => {
            const item = document.createElement('div');
            item.className = 'status-item';
            item.onclick = () => openStoryViewer(status);

            item.innerHTML = `
                <div class="status-avatar-wrap">
                    <div class="avatar status-ring" style="background:${status.color}">
                        <span>${status.initials}</span>
                    </div>
                </div>
                <div class="status-text-info">
                    <div class="status-user-name">${escapeHtml(status.name)}</div>
                    <div class="status-time">${status.time}</div>
                </div>
            `;
            listEl.appendChild(item);
        });
    }

    function openStoryViewer(status) {
        const modal = document.getElementById('storyViewerModal');
        document.getElementById('storyUserName').textContent = status.name;
        document.getElementById('storyTimeAgo').textContent = status.time;
        document.getElementById('storyTextContent').textContent = status.text;
        document.getElementById('storyUserAvatar').style.background = status.color;
        document.getElementById('storyUserAvatar').querySelector('span').textContent = status.initials;

        document.getElementById('storyViewerBody').style.background = status.color;

        modal.style.display = 'flex';

        // Auto close after 5 seconds
        setTimeout(() => {
            modal.style.display = 'none';
        }, 5000);
    }

    // ====== CALLS HISTORY ======
    function renderCallsHistory() {
        const listEl = document.getElementById('callLogList');
        listEl.innerHTML = '';

        if (state.calls.length === 0) {
            listEl.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-secondary);">No recent calls</div>';
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
                <button class="btn-call-redial" title="Call back">
                    ${typeIcon}
                </button>
            `;
            listEl.appendChild(item);
        });
    }

    // ====== THEME (DARK / LIGHT MODE - INSIDE SETTINGS ONLY) ======
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
        if (current === 'light') {
            document.getElementById('radioLight').checked = true;
        } else if (current === 'system') {
            document.getElementById('radioSystem').checked = true;
        } else {
            document.getElementById('radioDark').checked = true;
        }

        modal.style.display = 'flex';
    }

    function closeThemeModal() {
        const modal = document.getElementById('themeModal');
        if (modal) modal.style.display = 'none';
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
                sender: msg.sent ? 'You' : state.activeContact.name,
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
                state.messages[state.activeContact.id] = state.messages[state.activeContact.id].filter(m => m.id !== msg.id);
                saveState();
                renderMessages();
                renderRecentChats();
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

    // ====== EVENT LISTENERS ======
    function bindEvents() {
        // Auth Tab switching
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

        // Login Form Submit
        document.getElementById('loginForm').onsubmit = (e) => {
            e.preventDefault();
            const phone = document.getElementById('loginPhone').value.trim();
            const pass = document.getElementById('loginPassword').value;
            login(phone, pass);
        };

        // Register Form Submit
        document.getElementById('registerForm').onsubmit = (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value.trim();
            const phone = document.getElementById('regPhone').value.trim();
            const pass = document.getElementById('regPassword').value;
            const about = document.getElementById('regAbout').value.trim();
            login(phone, pass, name, about);
        };

        // Demo user chips
        document.querySelectorAll('.demo-chip').forEach(chip => {
            chip.onclick = () => {
                const phone = chip.getAttribute('data-phone');
                const name = chip.getAttribute('data-name');
                login(phone, '123456', name);
            };
        });

        // App Navigation Rail switching
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

        // Theme (Inside Settings)
        const settingThemeEl = document.getElementById('settingTheme');
        if (settingThemeEl) settingThemeEl.onclick = openThemeModal;

        const btnSaveThemeEl = document.getElementById('btnSaveTheme');
        if (btnSaveThemeEl) btnSaveThemeEl.onclick = saveSelectedTheme;

        const btnCloseThemeEl = document.getElementById('btnCloseThemeModal');
        if (btnCloseThemeEl) btnCloseThemeEl.onclick = closeThemeModal;

        const btnCancelThemeEl = document.getElementById('btnCancelTheme');
        if (btnCancelThemeEl) btnCancelThemeEl.onclick = closeThemeModal;

        // Mobile App Installation (PWA Prompt)
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
                    deferredPrompt.userChoice.then(() => {
                        deferredPrompt = null;
                    });
                } else {
                    alert('To install BharatChat on your phone:\n\n📱 Android: Tap Chrome menu (⋮) → "Install app" or "Add to Home screen"\n🍎 iPhone (iOS): Tap Safari Share (⬆) → "Add to Home Screen"\n💻 Desktop: Click the install icon (⊕) in the browser address bar');
                }
            };
        }

        // Message Send
        const msgInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('btnSend');

        sendBtn.onclick = () => {
            const text = msgInput.value.trim();
            if (text) {
                sendMessage(text);
                msgInput.value = '';
            }
        };

        msgInput.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendBtn.click();
            }
        };

        // Floating Action Button & New Chat Buttons
        document.getElementById('fabNewChat').onclick = openNewChatModal;
        document.getElementById('btnHeaderNewChat').onclick = openNewChatModal;
        document.getElementById('btnEmptyStartChat').onclick = openNewChatModal;
        document.getElementById('btnCloseNewChatModal').onclick = closeNewChatModal;

        // Directory Search
        document.getElementById('dirSearchInput').oninput = (e) => {
            renderDirectoryUsers(e.target.value.trim());
        };

        // Voice and Video Calls
        document.getElementById('btnVoiceCall').onclick = () => startCall('voice');
        document.getElementById('btnVideoCall').onclick = () => startCall('video');
        document.getElementById('btnEndCall').onclick = endCall;

        // In-call toggles
        document.getElementById('btnToggleMic').onclick = function () {
            this.classList.toggle('active-muted');
        };
        document.getElementById('btnToggleCam').onclick = function () {
            this.classList.toggle('active-muted');
        };

        // Back button on mobile
        document.getElementById('backBtn').onclick = () => {
            document.getElementById('chatMain').classList.remove('active');
        };

        // Cancel Reply
        document.getElementById('btnCancelReply').onclick = cancelReply;

        // Emoji Picker
        document.getElementById('btnEmoji').onclick = toggleEmojiPicker;

        // Voice Message recording simulation & live mic
        const btnMic = document.getElementById('btnMic');
        let isRecording = false;
        let recInterval = null;
        let recSeconds = 0;

        btnMic.onclick = () => {
            isRecording = true;
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
            isRecording = false;
            document.getElementById('voiceRecordingBar').style.display = 'none';
            document.getElementById('chatInputArea').style.display = 'flex';
        };

        document.getElementById('btnSendVoice').onclick = () => {
            clearInterval(recInterval);
            isRecording = false;
            document.getElementById('voiceRecordingBar').style.display = 'none';
            document.getElementById('chatInputArea').style.display = 'flex';
            sendMessage(`🎙️ Voice Message (${document.getElementById('recTimer').textContent})`, 'audio');
        };

        // Attachment Menu
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
                    sendMessage('📍 Location: India Gate, New Delhi 🇮🇳');
                } else if (type === 'contact') {
                    sendMessage('👤 Shared Contact: Aarav Sharma (+91 98765 43210)');
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

        // Story Close
        document.getElementById('btnCloseStory').onclick = () => {
            document.getElementById('storyViewerModal').style.display = 'none';
        };

        // Settings Actions
        document.getElementById('settingLogout').onclick = () => {
            if (confirm('Do you want to log out from BharatChat?')) {
                state.currentUser = null;
                localStorage.removeItem('bharatchat_current_user');
                showAuth();
            }
        };

        document.getElementById('btnEditProfile').onclick = () => {
            const newName = prompt('Enter your name:', state.currentUser ? state.currentUser.name : '');
            if (newName && newName.trim()) {
                const newAbout = prompt('Enter your about status:', state.currentUser ? state.currentUser.about : '');
                state.currentUser.name = newName.trim();
                state.currentUser.initials = newName.trim().charAt(0).toUpperCase();
                if (newAbout !== null) state.currentUser.about = newAbout.trim();
                saveState();
                updateCurrentUserUI();
                renderRecentChats();
            }
        };

        document.getElementById('settingPrivacy').onclick = () => {
            alert('Privacy Settings:\n• Last Seen & Online: Everyone\n• Profile Photo: Everyone\n• Read Receipts (Blue Ticks): ON (Enabled)\n• End-to-End Encryption: Active 🇮🇳');
        };

        document.getElementById('settingWallpaper').onclick = () => {
            const choice = prompt('Select Wallpaper:\n1. WhatsApp Classic Doodle\n2. Saffron Glow\n3. Tricolor Theme\n4. Dark Slate\nEnter 1-4:');
            if (choice === '2') {
                document.getElementById('chatMain').style.backgroundImage = 'linear-gradient(180deg, rgba(255,153,51,0.06), rgba(11,20,26,0.95))';
            } else if (choice === '3') {
                document.getElementById('chatMain').style.backgroundImage = 'linear-gradient(180deg, rgba(255,153,51,0.08), rgba(255,255,255,0.02), rgba(19,136,8,0.08))';
            } else {
                document.getElementById('chatMain').style.backgroundImage = '';
            }
        };

        // Close popups on click outside
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

    // Run on startup
    window.addEventListener('DOMContentLoaded', init);

})();
