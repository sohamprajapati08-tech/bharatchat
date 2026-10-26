# BharatChat 🇮🇳 — India Ka Apna Messenger

BharatChat is India's own secure real-time messaging, voice, and video calling platform, built with:
- **Frontend / Mobile App**: Pure Vanilla Web App (HTML5 + CSS3 + ES6 JavaScript + PWA), responsive for desktop and mobile devices.
- **Backend**: Java 17+ Spring Boot 3.2 (REST API + WebSocket STOMP + WebRTC Signaling + Spring Security + JWT).
- **Database**: Supabase (PostgreSQL) with Row-Level Security, Realtime channels, and indexing.

---

## 🚀 Key Features

1. **Mobile Number Authentication**:
   - Register or Login using an Indian 10-digit mobile number (`+91`).
   - Secure BCrypt password hashing & JWT token validation.
   - Quick demo chips to test switching between Indian users (Aarav, Priya, Sneha).

2. **WhatsApp Real-Time Chat & User Directory**:
   - **Active Chat List**: Only contacts with whom you have exchanged messages appear in the main chat list (sorted by latest message at the top).
   - **"Find Users Across India" Directory**: Instant search across all registered BharatChat users across India by name or mobile number.
   - **Real-Time Delivery**: Sent (✓), Delivered (✓✓), Read (blue ✓✓).
   - **Typing Indicator**: Real-time "typing..." updates.
   - **Quoted Replies, Reactions & Voice Notes**: Reply directly to messages, react with emojis (`👍`, `❤️`, `😂`, `🙏`, `🇮🇳`), or record voice notes with live audio wave animations!

3. **Real-Time WebRTC Voice & Video Calls**:
   - End-to-end encrypted HD voice and video calling.
   - Real webcam / microphone media stream access (`getUserMedia`) with Picture-in-Picture (PIP) view.
   - Calling screen with ringtone audio synthesis (Web Audio API), in-call timer, camera on/off, microphone mute, speaker, and end-call controls.
   - Incoming call notification with Accept and Decline buttons.
   - Detailed call log history in the "Calls" tab.

4. **Appearance & Settings (Full WhatsApp Suite)**:
   - **Theme Exclusively Inside Settings**: Dark Mode, Light Mode, and System Default selection are neatly located inside **Settings → Appearance / Theme** modal (not cluttered on the outer interface!).
   - **Mobile App Ready**: Responsive layout for smartphones, standalone PWA installable on Android and iPhone with 1 tap.
   - **Status (Stories)**: Post 24-hour expiring updates; view status updates from users across India with fullscreen auto-progress bars.
   - **WhatsApp Settings**: Profile edit (Name, About, Avatar), Privacy (Last Seen, Read receipts), Chat Wallpaper selector, Sound notifications, App Language (English, हिन्दी, ગુજરાતી, मराठी).

---

## 🌐 Deploy to GitHub & Live on GitHub Pages

This project is Git-ready and includes automatic **GitHub Actions** deployment!

### Step 1: Create a Repository on GitHub
1. Go to [https://github.com/new](https://github.com/new).
2. Set repository name as `bharatchat` (or your preferred name).
3. Choose **Public**, leave other checkboxes blank, and click **Create repository**.

### Step 2: Push Your Local Code to GitHub
Open terminal/PowerShell in `d:\whatsapp india` and run:
```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/bharatchat.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. On GitHub, go to your repository **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, select **GitHub Actions** (or Deploy from a branch: `main` / `/ (root)`).
3. Your live link will automatically be published at:
   `https://YOUR_GITHUB_USERNAME.github.io/bharatchat/`

---

## 📱 Running as a Mobile App (Android & iPhone)

BharatChat is engineered with **Progressive Web App (PWA)** standards:
- **On Android**: Open your live link in Chrome → tap the 3-dots menu (⋮) → **"Install app"** or **"Add to Home screen"**. It installs as an independent native app with full-screen view and app icon!
- **On iPhone (iOS)**: Open your live link in Safari → tap the Share button (⬆) → **"Add to Home Screen"**.
- Inside the app, you can also go to **Settings → Install Mobile App** to prompt installation!

---

## 🗄️ Supabase PostgreSQL Setup

1. Create a free project at [https://supabase.com](https://supabase.com).
2. Open your Supabase Dashboard → **SQL Editor**.
3. Open `d:\whatsapp india\supabase_schema.sql`, copy all contents, and click **Run**.
4. This will create:
   - `users` table
   - `messages` table
   - `calls` table
   - `statuses` table
   - `user_settings` table
   - Indexes and Realtime publication.
5. In Supabase Dashboard → **Project Settings** → **Database**, find your connection string.
6. Open `d:\whatsapp india\backend\src\main\resources\application.properties` and paste your Supabase DB URL and password:
   ```properties
   spring.datasource.url=jdbc:postgresql://db.YOUR_PROJECT_REF.supabase.co:5432/postgres
   spring.datasource.username=postgres
   spring.datasource.password=YOUR_PASSWORD
   ```

---

## ⚙️ Running the Spring Boot Backend

### Prerequisites:
- Java JDK 17 or higher (Java 26 detected on system)
- Maven 3.8+

### Commands:
```bash
cd "d:\whatsapp india\backend"
mvn clean install
mvn spring-boot:run
```
The backend starts on `http://localhost:8080`.

---

## 🌐 Running the Web & Mobile App

1. Simply open `d:\whatsapp india\webapp\index.html` in your browser (Google Chrome, Edge, Safari, Firefox).
2. To test real-time chatting between two people:
   - Open Tab 1: Log in as **Aarav** (or your own mobile number).
   - Open Tab 2 (Incognito / New Window): Log in as **Priya**.
   - In Tab 1, click **+ New Chat**, choose **Priya**, and send a message.
   - Both tabs will instantly sync in real time with single check, double check, and blue read receipts!
   - Tap the video camera or phone icon to test the real-time call!
