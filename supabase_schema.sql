-- ================================================================
-- BharatChat 🇮🇳 — Supabase PostgreSQL Database Schema
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar VARCHAR(255) DEFAULT '',
    about VARCHAR(255) DEFAULT 'At BharatChat 🇮🇳 India Ka Apna Messenger',
    status VARCHAR(20) DEFAULT 'offline', -- 'online', 'offline', 'away'
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'audio', 'video', 'document', 'call_notice'
    media_url TEXT,
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'read'
    reactions JSONB DEFAULT '[]'::jsonb, -- array of {emoji, userId}
    is_starred BOOLEAN DEFAULT FALSE,
    is_deleted_for_sender BOOLEAN DEFAULT FALSE,
    is_deleted_for_everyone BOOLEAN DEFAULT FALSE,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CALLS TABLE (VOICE & VIDEO CALL LOGS)
CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    call_type VARCHAR(20) NOT NULL, -- 'voice', 'video'
    status VARCHAR(20) NOT NULL DEFAULT 'completed', -- 'missed', 'completed', 'rejected', 'busy'
    duration INTEGER DEFAULT 0, -- duration in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. STATUSES TABLE (WHATSAPP STORIES / 24-HOUR EXPIRY)
CREATE TABLE IF NOT EXISTS statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'text', -- 'text', 'image'
    content TEXT NOT NULL,
    background_color VARCHAR(30) DEFAULT '#008069',
    viewers JSONB DEFAULT '[]'::jsonb, -- array of user IDs who viewed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- 6. USER SETTINGS TABLE (WHATSAPP PRIVACY, THEME, NOTIFICATIONS)
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark', -- 'dark', 'light', 'system'
    wallpaper VARCHAR(100) DEFAULT 'default',
    last_seen_privacy VARCHAR(20) DEFAULT 'everyone', -- 'everyone', 'contacts', 'nobody'
    profile_photo_privacy VARCHAR(20) DEFAULT 'everyone',
    about_privacy VARCHAR(20) DEFAULT 'everyone',
    read_receipts BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    app_language VARCHAR(20) DEFAULT 'en', -- 'en', 'hi', 'gu'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- INDEXES FOR FAST QUERYING
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_users ON calls(caller_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_statuses_user ON statuses(user_id);
CREATE INDEX IF NOT EXISTS idx_statuses_expires ON statuses(expires_at);

-- ================================================================
-- REALTIME ENABLEMENT (SUPABASE REALTIME)
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
ALTER PUBLICATION supabase_realtime ADD TABLE statuses;

-- ================================================================
-- SEED SAMPLE USERS ACROSS INDIA (FOR INSTANT CHAT & CALLING)
-- ================================================================
INSERT INTO users (phone, name, avatar, about, status, password_hash)
VALUES 
    ('+919876543210', 'Aarav Sharma', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Jai Hind! 🇮🇳 Available for chat', 'online', '$2a$10$w8/u2r5w8Kj7hFvU0v0WDe48F7gYtO1hYtO1hYtO1hYtO1hYtO1hY'),
    ('+919825012345', 'Priya Patel', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'Kem cho? BharatChat rocks! ✨', 'online', '$2a$10$w8/u2r5w8Kj7hFvU0v0WDe48F7gYtO1hYtO1hYtO1hYtO1hYtO1hY'),
    ('+919811122334', 'Sneha Verma', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 'Busy coding BharatChat 💻🇮🇳', 'online', '$2a$10$w8/u2r5w8Kj7hFvU0v0WDe48F7gYtO1hYtO1hYtO1hYtO1hYtO1hY'),
    ('+919822233445', 'Rajesh Kumar', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Namaste from Delhi 🙏', 'offline', '$2a$10$w8/u2r5w8Kj7hFvU0v0WDe48F7gYtO1hYtO1hYtO1hYtO1hYtO1hY'),
    ('+919833344556', 'Vikram Singh', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'Proud Indian! 🇮🇳 In a meeting', 'online', '$2a$10$w8/u2r5w8Kj7hFvU0v0WDe48F7gYtO1hYtO1hYtO1hYtO1hYtO1hY')
ON CONFLICT (phone) DO NOTHING;
