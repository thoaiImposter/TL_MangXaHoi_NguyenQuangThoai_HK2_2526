-- SCRIPT NÀY SẼ XÓA DATABASE CŨ VÀ TẠO LẠI TỪ ĐẦU
-- CHỈ CẦN CHẠY FILE NÀY LÀ XONG TẤT CẢ

-- Bước 1: Xóa database cũ nếu tồn tại
DROP DATABASE IF EXISTS social_app;

-- Bước 2: Tạo database mới
CREATE DATABASE social_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE social_app;

-- Bước 3: Tạo tất cả các bảng

-- File được upload lên Cloudinary; database chỉ lưu secure URL, không lưu base64/binary.

-- 1. Users table với avatar và cover
CREATE TABLE users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student',
  avatar VARCHAR(2048) NULL,
  cover VARCHAR(2048) NULL,
  bio VARCHAR(1000) NULL,
  faculty VARCHAR(255) NULL,
  class_name VARCHAR(255) NULL,
  academic_year VARCHAR(50) NULL,
  academic_title VARCHAR(100) NULL,
  account_protection BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Groups table (Được đưa lên trước để bảng Messages tham chiếu sang)
CREATE TABLE `groups` (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000) NULL,
    avatar VARCHAR(2048) NULL,
    cover VARCHAR(2048) NULL,
    privacy VARCHAR(20) NOT NULL DEFAULT 'public',
    creator_id BIGINT NOT NULL,
    approval_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    KEY idx_groups_creator (creator_id),
    CONSTRAINT fk_groups_creator FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Messages table (Đã tích hợp đầy đủ tính năng Group Chat & Mention)
CREATE TABLE messages (
  id BIGINT NOT NULL AUTO_INCREMENT,
  sender_id BIGINT NOT NULL,
  receiver_id BIGINT NULL,               -- NULL cho phép nhắn tin nhóm công cộng
  group_id BIGINT NULL,                  -- FK liên kết với bảng groups
  mentioned_user_ids VARCHAR(1000) NULL, -- Lưu danh sách ID user được tag
  is_all_mentioned BOOLEAN NOT NULL DEFAULT FALSE, -- Cờ cho tính năng @all
  content VARCHAR(2000) NOT NULL,
  media_url VARCHAR(2048) NULL,
  media_type VARCHAR(20) NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_recalled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY idx_messages_sender (sender_id),
  KEY idx_messages_receiver (receiver_id),
  KEY idx_messages_group (group_id),
  KEY idx_messages_created_at (created_at),
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_messages_group FOREIGN KEY (group_id) REFERENCES `groups` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. OTP Tokens table
CREATE TABLE otp_tokens (
  id BIGINT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  attempt_count INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_otp_tokens_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Posts table
CREATE TABLE posts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(300) NOT NULL,
  content VARCHAR(5000) NOT NULL,
  visibility VARCHAR(20) NOT NULL DEFAULT 'public',
  author_id BIGINT NOT NULL,
  is_poll BOOLEAN NOT NULL DEFAULT FALSE,
  poll_end_date DATETIME(6) NULL,
  poll_allow_multiple BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY idx_posts_author_id (author_id),
  CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Poll options table
CREATE TABLE poll_options (
  id BIGINT NOT NULL AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  option_text VARCHAR(255) NOT NULL,
  option_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY idx_poll_options_post_id (post_id),
  CONSTRAINT fk_poll_options_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Poll votes table
CREATE TABLE poll_votes (
  id BIGINT NOT NULL AUTO_INCREMENT,
  poll_option_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY idx_poll_votes_option_id (poll_option_id),
  KEY idx_poll_votes_user_id (user_id),
  UNIQUE KEY uk_poll_votes_option_user (poll_option_id, user_id),
  CONSTRAINT fk_poll_votes_option FOREIGN KEY (poll_option_id) REFERENCES poll_options (id) ON DELETE CASCADE,
  CONSTRAINT fk_poll_votes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Post media table
CREATE TABLE post_media (
  id BIGINT NOT NULL AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  media_type VARCHAR(20) NOT NULL,
  media_url VARCHAR(2048) NOT NULL,
  media_name VARCHAR(255) NULL,
  media_size BIGINT NULL,
  media_order INT NULL,
  created_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY idx_post_media_post_id (post_id),
  CONSTRAINT fk_post_media_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Post comments table
CREATE TABLE post_comments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  author_id BIGINT NOT NULL,
  parent_comment_id BIGINT NULL,
  content VARCHAR(1000) NOT NULL,
  created_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY idx_post_comments_post_id (post_id),
  KEY idx_post_comments_author_id (author_id),
  KEY idx_post_comments_parent_id (parent_comment_id),
  CONSTRAINT fk_post_comments_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  CONSTRAINT fk_post_comments_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_post_comments_parent FOREIGN KEY (parent_comment_id) REFERENCES post_comments (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Comment media table
CREATE TABLE comment_media (
  id BIGINT NOT NULL AUTO_INCREMENT,
  comment_id BIGINT NOT NULL,
  media_type VARCHAR(20) NOT NULL DEFAULT 'image',
  media_url VARCHAR(2048) NOT NULL,
  media_name VARCHAR(255) NULL,
  media_order INT NULL,
  created_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY idx_comment_media_comment_id (comment_id),
  CONSTRAINT fk_comment_media_comment FOREIGN KEY (comment_id) REFERENCES post_comments (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Post likes table
CREATE TABLE post_likes (
  id BIGINT NOT NULL AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_post_likes_post_user (post_id, user_id),
  KEY idx_post_likes_user_id (user_id),
  CONSTRAINT fk_post_likes_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  CONSTRAINT fk_post_likes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Comment likes table
CREATE TABLE comment_likes (
  id BIGINT NOT NULL AUTO_INCREMENT,
  comment_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_comment_likes_comment_user (comment_id, user_id),
  KEY idx_comment_likes_user_id (user_id),
  CONSTRAINT fk_comment_likes_comment FOREIGN KEY (comment_id) REFERENCES post_comments (id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_likes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Friendships table
CREATE TABLE friendships (
  id BIGINT NOT NULL AUTO_INCREMENT,
  requester_id BIGINT NOT NULL,
  addressee_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_friendships_pair (requester_id, addressee_id),
  KEY idx_friendships_requester (requester_id),
  KEY idx_friendships_addressee (addressee_id),
  CONSTRAINT fk_friendships_requester FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_friendships_addressee FOREIGN KEY (addressee_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Friend requests table
CREATE TABLE friend_requests (
  id BIGINT NOT NULL AUTO_INCREMENT,
  sender_id BIGINT NOT NULL,
  receiver_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME(6) NULL,
  updated_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_friend_requests_pair (sender_id, receiver_id),
  KEY idx_friend_requests_sender (sender_id),
  KEY idx_friend_requests_receiver (receiver_id),
  CONSTRAINT fk_friend_requests_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_friend_requests_receiver FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Notifications table
CREATE TABLE notifications (
  id BIGINT NOT NULL AUTO_INCREMENT,
  recipient_id BIGINT NOT NULL,
  actor_id BIGINT NOT NULL,
  type VARCHAR(30) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  target_type VARCHAR(30) NULL,
  target_id BIGINT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY idx_notifications_recipient (recipient_id),
  KEY idx_notifications_actor (actor_id),
  CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Blocks table
CREATE TABLE blocks (
  id BIGINT NOT NULL AUTO_INCREMENT,
  blocker_id BIGINT NOT NULL,
  blocked_id BIGINT NOT NULL,
  created_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_blocks_pair (blocker_id, blocked_id),
  KEY idx_blocks_blocker (blocker_id),
  KEY idx_blocks_blocked (blocked_id),
  CONSTRAINT fk_blocks_blocker FOREIGN KEY (blocker_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_blocks_blocked FOREIGN KEY (blocked_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Group members table
CREATE TABLE group_members (
    id BIGINT NOT NULL AUTO_INCREMENT,
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    joined_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_group_members_group_user (group_id, user_id),
    KEY idx_group_members_user (user_id),
    CONSTRAINT fk_group_members_group FOREIGN KEY (group_id) REFERENCES `groups` (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Group posts table
CREATE TABLE group_posts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    group_id BIGINT NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_group_posts_post (post_id),
    KEY idx_group_posts_group (group_id),
    CONSTRAINT fk_group_posts_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_posts_group FOREIGN KEY (group_id) REFERENCES `groups` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Group join requests table
CREATE TABLE group_join_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    message VARCHAR(500) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_group_join_requests_group_user (group_id, user_id),
    KEY idx_group_join_requests_user (user_id),
    CONSTRAINT fk_group_join_requests_group FOREIGN KEY (group_id) REFERENCES `groups` (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_join_requests_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Group notifications table
CREATE TABLE group_notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    type VARCHAR(30) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    target_type VARCHAR(30) NULL,
    target_id BIGINT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    KEY idx_group_notifications_user (user_id),
    KEY idx_group_notifications_group (group_id),
    CONSTRAINT fk_group_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_notifications_group FOREIGN KEY (group_id) REFERENCES `groups` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Group banned users table
CREATE TABLE group_bans (
    id BIGINT NOT NULL AUTO_INCREMENT,
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    banned_by BIGINT NOT NULL,
    reason VARCHAR(500) NULL,
    created_at DATETIME(6) NULL,
    expires_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_group_bans_group_user (group_id, user_id),
    KEY idx_group_bans_user (user_id),
    CONSTRAINT fk_group_bans_group FOREIGN KEY (group_id) REFERENCES `groups` (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_bans_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_bans_banned_by FOREIGN KEY (banned_by) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Post shares table
CREATE TABLE post_shares (
    id BIGINT NOT NULL AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    shared_by_id BIGINT NOT NULL,
    shared_to_group_id BIGINT NULL,
    shared_post_id BIGINT NULL,
    share_content VARCHAR(5000) NOT NULL DEFAULT '',
    share_visibility VARCHAR(20) NOT NULL DEFAULT 'public',
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    KEY idx_post_shares_post (post_id),
    KEY idx_post_shares_shared_by (shared_by_id),
    KEY idx_post_shares_shared_to_group (shared_to_group_id),
    KEY idx_post_shares_shared_post (shared_post_id),
    CONSTRAINT fk_post_shares_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_post_shares_shared_by FOREIGN KEY (shared_by_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_post_shares_shared_to_group FOREIGN KEY (shared_to_group_id) REFERENCES `groups` (id) ON DELETE SET NULL,
    CONSTRAINT fk_post_shares_shared_post FOREIGN KEY (shared_post_id) REFERENCES posts (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- XONG! TOÀN BỘ CẤU TRÚC DATABASE ĐÃ ĐƯỢC KHỞI TẠO ĐỒNG BỘ VÀ HOÀN CHỈNH.

-- ============================================================
-- MIGRATION: Add shared_post_id to post_shares (for existing DBs)
-- Run this ONLY if your database was created before this update.
-- ============================================================
-- ALTER TABLE post_shares ADD COLUMN shared_post_id BIGINT NULL AFTER share_visibility;
-- ALTER TABLE post_shares ADD KEY idx_post_shares_shared_post (shared_post_id);
-- ALTER TABLE post_shares ADD CONSTRAINT fk_post_shares_shared_post FOREIGN KEY (shared_post_id) REFERENCES posts (id) ON DELETE SET NULL;
