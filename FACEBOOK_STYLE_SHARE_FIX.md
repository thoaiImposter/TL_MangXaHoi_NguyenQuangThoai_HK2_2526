# Fix: Chia sẻ bài viết kiểu Facebook - Có thể tương tác với cả bài share và bài gốc

## Vấn đề ban đầu
- Khi share bài viết (cả 2 đều public), hệ thống báo "Bài viết gốc không còn khả dụng"
- Không thể tương tác (like, comment) với bài share
- Trải nghiệm không giống Facebook

## Giải pháp mới: Facebook-style Share

### Cách hoạt động:
1. Khi user share một bài viết → Hệ thống tạo một **Post mới** cho bài share
2. Bài share này có thể được like, comment, share riêng (giống Facebook)
3. Bài share reference đến bài gốc qua bảng `post_shares`
4. User có thể:
   - Xem và tương tác với bài share (bài mới tạo)
   - Click vào preview để xem bài gốc

### Ví dụ:
```
User A đăng bài: "Hôm nay trời đẹp"
User B share bài của A với nội dung: "Đúng vậy!"

Kết quả:
- Bài của B là một Post độc lập (id: 123)
- PostShare record linking: shared_post_id=123, original_post_id=100
- Trên profile B hiển thị:
  + Header: "User B · Công khai"
  + Content: "Đúng vậy!"
  + Preview: Bài gốc của A
  + Actions: "Bình luận" (đến bài 123), "Xem bài gốc" (đến bài 100)
```

## Các thay đổi đã thực hiện

### 1. Backend

#### a. Entity `PostShare.java`
- Thêm trường `sharedPost` (OneToOne với Post)
- Link đến bài viết mới được tạo khi share

#### b. DTO `PostShareResponse.java`
- Thêm trường `sharedPostId` (Long)
- `isOriginalPostAvailable` luôn = true (vì luôn hiển thị preview)

#### c. Service `ShareService.java`
```java
public PostShareResponse sharePost(Long userId, ShareRequest request) {
    // 1. Tạo Post mới cho share
    Post sharePost = new Post();
    sharePost.setTitle("Bài viết được chia sẻ");
    sharePost.setContent(shareContent);
    sharePost.setVisibility(shareVisibility);
    sharePost.setAuthor(sharer);
    Post savedSharePost = postRepository.save(sharePost);

    // 2. Tạo PostShare linking đến cả original post và shared post
    PostShare share = new PostShare();
    share.setOriginalPost(originalPost);
    share.setSharedPost(savedSharePost); // NEW!
    // ... save share
}
```

#### d. Controller `ShareController.java`
- Đã có endpoint: `GET /api/users/{userId}/shares`

### 2. Frontend

#### a. Types `types.ts`
- Thêm `sharedPostId: number | null` vào interface `PostShare`

#### b. Component `ShareCard.tsx`
- Hiển thị thông tin người share
- Hiển thị nội dung share (nếu có)
- Preview bài gốc với link đến bài gốc
- Action buttons:
  - "Bình luận" → link đến `/post/${sharedPostId}` (bài share)
  - "Xem bài gốc" → link đến `/post/${originalPostId}`
  - "Xóa chia sẻ" (chỉ chủ sở hữu thấy)

#### c. Page `ProfilePage.tsx`
- Load shares từ `api.getUserShares()`
- Hiển thị shares trong section "Bài viết đã chia sẻ"
- Hỗ trợ xóa share

#### d. API `api.ts`
- Thêm `getUserShares(userId, viewerId?, page?, size?)`

### 3. Database Migration

File: `migration_add_shared_post_id.sql`
```sql
ALTER TABLE post_shares
ADD COLUMN shared_post_id BIGINT;

ALTER TABLE post_shares
ADD CONSTRAINT fk_post_shares_shared_post
FOREIGN KEY (shared_post_id) REFERENCES posts(id) ON DELETE SET NULL;

CREATE INDEX idx_post_shares_shared_post_id ON post_shares(shared_post_id);
```

## Hướng dẫn cập nhật

### Bước 1: Chạy migration database
```bash
# Kết nối đến MySQL
mysql -u root -p nlu_social

# Chạy migration
source migration_add_shared_post_id.sql;
```

### Bước 2: Build lại backend
```bash
cd backend
mvn clean compile
```

### Bước 3: Restart backend server
```bash
# Stop server hiện tại
# Start lại server
```

### Bước 4: Test
1. Đăng nhập với 2 tài khoản khác nhau
2. Tài khoản A đăng bài viết
3. Tài khoản B share bài của A với nội dung "Test share"
4. Kiểm tra:
   - Profile B hiển thị bài share
   - Không còn lỗi "Bài viết gốc không còn khả dụng"
   - Có thể click "Xem bài gốc" để xem bài của A
   - Có thể click "Bình luận" để comment trên bài share

## Lợi ích

1. **Không còn lỗi hiển thị**: Luôn hiển thị được bài share và preview bài gốc
2. **Tương tác đầy đủ**: Có thể like, comment trên bài share
3. **Giống Facebook**: Trải nghiệm quen thuộc với người dùng
4. **Quản lý dễ dàng**: Mỗi share là một post độc lập, dễ xóa/quản lý
5. **Phân quyền rõ ràng**: Share có visibility riêng, độc lập với post gốc

## Lưu ý

- Các share cũ (không có shared_post_id) vẫn hiển thị bình thường
- Khi xóa share, chỉ xóa PostShare record, không xóa shared post (ON DELETE SET NULL)
- Share count của bài gốc vẫn được tính chính xác
- Có thể cần clear cache/frontend reload để thấy thay đổi