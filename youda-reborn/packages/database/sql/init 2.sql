CREATE DATABASE IF NOT EXISTS youda_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE youda_prod;

CREATE TABLE users (
  id VARCHAR(191) PRIMARY KEY,
  username VARCHAR(191) NOT NULL UNIQUE,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(191) NULL,
  avatar_url VARCHAR(512) NULL,
  badges JSON NULL,
  unlocked_badges JSON NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_created_at (created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE friends (
  id VARCHAR(191) PRIMARY KEY,
  user_id VARCHAR(191) NOT NULL,
  friend_id VARCHAR(191) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  message_retention_policy VARCHAR(32) NOT NULL DEFAULT 'PRESERVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_friends_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_friends_friend FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_friends_user_friend (user_id, friend_id),
  INDEX idx_friends_user_status_created_at (user_id, status, created_at),
  INDEX idx_friends_friend_status_created_at (friend_id, status, created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE matches (
  id VARCHAR(191) PRIMARY KEY,
  host_user_id VARCHAR(191) NOT NULL,
  game_name VARCHAR(191) NOT NULL,
  personality VARCHAR(64) NULL,
  duration VARCHAR(64) NULL,
  room_code VARCHAR(64) NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_matches_host_user FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_matches_host_user_created_at (host_user_id, created_at),
  INDEX idx_matches_status_created_at (status, created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE chat_messages (
  id VARCHAR(191) PRIMARY KEY,
  match_id VARCHAR(191) NULL,
  sender_id VARCHAR(191) NOT NULL,
  receiver_id VARCHAR(191) NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(32) NOT NULL DEFAULT 'DIRECT',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_messages_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE SET NULL,
  CONSTRAINT fk_chat_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_chat_messages_sender_created_at (sender_id, created_at),
  INDEX idx_chat_messages_match_created_at (match_id, created_at),
  INDEX idx_chat_messages_receiver_created_at (receiver_id, created_at),
  INDEX idx_chat_messages_sender_receiver_created_at (sender_id, receiver_id, created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE vlogs (
  id VARCHAR(191) PRIMARY KEY,
  user_id VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  game_name VARCHAR(191) NOT NULL,
  video_url VARCHAR(512) NULL,
  cover_url VARCHAR(512) NULL,
  content TEXT NULL,
  type VARCHAR(16) NOT NULL DEFAULT 'VIDEO',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vlogs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_vlogs_user_created_at (user_id, created_at),
  INDEX idx_vlogs_game_created_at (game_name, created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE careers (
  id VARCHAR(191) PRIMARY KEY,
  user_id VARCHAR(191) NOT NULL,
  game_name VARCHAR(191) NOT NULL,
  hours INT NOT NULL DEFAULT 0,
  rank VARCHAR(191) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_careers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_careers_user_created_at (user_id, created_at),
  INDEX idx_careers_game_created_at (game_name, created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE refresh_tokens (
  id VARCHAR(191) PRIMARY KEY,
  user_id VARCHAR(191) NOT NULL,
  token_hash VARCHAR(191) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  last_used_at DATETIME NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(512) NULL,
  device_fingerprint VARCHAR(191) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_tokens_user_expires_at (user_id, expires_at),
  INDEX idx_refresh_tokens_user_revoked_at (user_id, revoked_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE password_reset_tokens (
  id VARCHAR(191) PRIMARY KEY,
  user_id VARCHAR(191) NOT NULL,
  token_hash VARCHAR(191) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_password_reset_tokens_user_expires_at (user_id, expires_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE login_sessions (
  id VARCHAR(191) PRIMARY KEY,
  user_id VARCHAR(191) NOT NULL,
  refresh_token_id VARCHAR(191) NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(512) NULL,
  device_fingerprint VARCHAR(191) NOT NULL,
  verification_state VARCHAR(32) NOT NULL DEFAULT 'TRUSTED',
  verified_at DATETIME NULL,
  revoked_at DATETIME NULL,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_login_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_login_sessions_refresh_token FOREIGN KEY (refresh_token_id) REFERENCES refresh_tokens(id) ON DELETE SET NULL,
  INDEX idx_login_sessions_user_created_at (user_id, created_at),
  INDEX idx_login_sessions_user_device_fingerprint (user_id, device_fingerprint)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE login_challenge_tokens (
  id VARCHAR(191) PRIMARY KEY,
  user_id VARCHAR(191) NOT NULL,
  login_session_id VARCHAR(191) NULL,
  token_hash VARCHAR(191) NOT NULL UNIQUE,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(512) NULL,
  device_fingerprint VARCHAR(191) NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_login_challenge_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_login_challenge_tokens_session FOREIGN KEY (login_session_id) REFERENCES login_sessions(id) ON DELETE SET NULL,
  INDEX idx_login_challenge_tokens_user_expires_at (user_id, expires_at),
  INDEX idx_login_challenge_tokens_session_expires_at (login_session_id, expires_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
