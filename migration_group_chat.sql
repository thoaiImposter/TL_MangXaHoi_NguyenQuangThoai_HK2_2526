-- Migration for Group Chat Feature
-- Add group_id column to messages table to support group messaging
-- Fix receiver_id to be nullable for group messages

USE social_app;

-- 1. Sửa receiver_id thành NULL (để nhắn tin nhóm không bắt buộc có receiver_id)
ALTER TABLE messages 
MODIFY COLUMN receiver_id BIGINT NULL;

-- 2. Thêm cột group_id và khóa ngoại liên kết tới bảng groups
ALTER TABLE messages 
ADD COLUMN group_id BIGINT NULL AFTER receiver_id,
ADD CONSTRAINT fk_messages_group FOREIGN KEY (group_id) REFERENCES `groups` (id) ON DELETE CASCADE;

-- 3. Tạo index cho group_id để tăng tốc độ truy vấn câu hỏi/tin nhắn nhóm
CREATE INDEX idx_messages_group_id ON messages(group_id);

-- 4. Thêm cột mentioned_user_ids lưu danh sách user được tag
ALTER TABLE messages 
ADD COLUMN mentioned_user_ids VARCHAR(1000) NULL AFTER group_id;

-- 5. Thêm cờ is_all_mentioned cho tính năng @all
ALTER TABLE messages 
ADD COLUMN is_all_mentioned BOOLEAN NOT NULL DEFAULT FALSE AFTER mentioned_user_ids;