# TÍNH NĂNG BÌNH CHỌN VÀ ĐĂNG TẢI ĐA PHƯƠNG TIỆN

## Tổng quan

Dự án đã được nâng cấp với 2 tính năng chính:
1. **Hệ thống bình chọn (Poll)** - Tạo và tham gia bình chọn trong nhóm và bài viết cá nhân
2. **Hỗ trợ đa phương tiện** - Đăng tải và xem video, file (như Facebook)

## Cơ sở dữ liệu

### File SQL duy nhất: `RUN_THIS.sql`

Chỉ cần chạy file này là sẽ tạo lại toàn bộ database với đầy đủ các bảng:

#### Các bảng mới cho tính năng bình chọn:
- **poll_options**: Lưu các phương án bình chọn
- **poll_votes**: Lưu phiếu bình chọn của người dùng

#### Các bảng được cập nhật:
- **posts**: Thêm các trường `is_poll`, `poll_end_date`, `poll_allow_multiple`
- **post_media**: Thêm các trường `media_name`, `media_size` để hỗ trợ video/file
- **comment_media**: Thêm trường `media_type`, `media_name`
- **messages**: Thêm trường `group_id`, `media_type` để hỗ trợ chat nhóm và gửi media

## Backend

### Entities mới
- `PollOption.java`: Đại diện cho phương án bình chọn
- `PollVote.java`: Đại diện cho phiếu bình chọn

### Entities được cập nhật
- `Post.java`: Thêm thuộc tính poll
- `PostMedia.java`: Thêm thông tin tên và kích thước file
- `CommentMedia.java`: Thêm kiểu media

### Repositories mới
- `PollOptionRepository.java`
- `PollVoteRepository.java`

### Services mới
- `PollService.java`: Xử lý logic bình chọn
  - `createPoll()`: Tạo bình chọn mới
  - `vote()`: Bình chọn
  - `getPollResults()`: Lấy kết quả bình chọn
  - `removeVote()`: Hủy bình chọn

### Controllers mới
- `PollController.java`: API endpoints cho bình chọn
  - `POST /api/polls`: Tạo bình chọn
  - `POST /api/polls/{postId}/vote`: Bình chọn
  - `GET /api/polls/{postId}/results`: Lấy kết quả
  - `DELETE /api/polls/{postId}/vote`: Hủy bình chọn

## Frontend

### Types mới (types.ts)
```typescript
interface PollOption {
  id: number;
  optionText: string;
  optionOrder: number;
  voteCount?: number;
  percentage?: number;
  votedByMe?: boolean;
}

interface PollResults {
  postId: number;
  totalVotes: number;
  allowMultiple: boolean;
  endDate: string | null;
  isEnded: boolean;
  hasVoted: boolean;
  options: PollOption[];
}
```

### Components mới
1. **PollCreator.tsx**: Form tạo bình chọn
   - Nhập tiêu đề, nội dung
   - Thêm/xóa phương án (2-10 phương án)
   - Đặt thời gian kết thúc
   - Cho phép chọn nhiều phương án

2. **PollCard.tsx**: Hiển thị và tương tác với bình chọn
   - Hiển thị các phương án
   - Cho phép bình chọn (single/multiple)
   - Hiển thị kết quả với phần trăm
   - Cho phép hủy bình chọn

3. **MediaViewer.tsx**: Xem media (ảnh, video, file)
   - Hỗ trợ xem video với controls
   - Hiển thị ảnh với slideshow
   - Hỗ trợ tải file xuống
   - Điều hướng giữa các media

### API Client updates (api.ts)
```typescript
createPoll(userId, payload)
votePoll(postId, userId, optionIds)
getPollResults(postId, userId)
removePollVote(postId, userId)
```

## Cách sử dụng

### 1. Tạo bình chọn

```typescript
// Trong component tạo bài viết
const handleCreatePoll = async (pollData) => {
  const post = await api.createPoll(userId, {
    title: pollData.title,
    content: pollData.content,
    options: pollData.options,
    endDate: pollData.endDate,
    allowMultiple: pollData.allowMultiple,
  });
};
```

### 2. Hiển thị bình chọn

```typescript
// Trong component hiển thị bài viết
{post.isPoll && (
  <PollCard post={post} userId={currentUserId} />
)}
```

### 3. Hiển thị media (video, file)

```typescript
// Trong component hiển thị bài viết
{post.media && post.media.length > 0 && (
  <MediaViewer media={post.media} />
)}
```

## Video Playback

Video được hỗ trợ phát trực tiếp trong bài viết:
- Định dạng hỗ trợ: MP4, WebM, Ogg
- Controls: Play, pause, volume, fullscreen
- Tự động phát (autoplay)
- Responsive sizing

## File Upload

Hỗ trợ đăng tải nhiều loại file:
- **Ảnh**: JPG, PNG, GIF, WebP
- **Video**: MP4, WebM, AVI, MOV
- **File**: PDF, DOC, DOCX, ZIP, v.v.

## Lưu trữ

### Base64 Encoding (cho file nhỏ)
- Phù hợp cho ảnh, video ngắn
- Lưu trực tiếp trong database
- Đơn giản, không cần server file

### Khuyến nghị cho production
- Sử dụng cloud storage (AWS S3, Google Cloud Storage)
- Hoặc file server riêng
- Lưu URL trong database

## API Endpoints

### Poll APIs
```
POST   /api/polls                          - Tạo bình chọn
POST   /api/polls/{postId}/vote            - Bình chọn
GET    /api/polls/{postId}/results         - Lấy kết quả
DELETE /api/polls/{postId}/vote            - Hủy bình chọn
```

### Post APIs (đã cập nhật)
```
POST   /api/users/{userId}/posts           - Tạo bài viết (hỗ trợ poll)
POST   /api/users/{userId}/posts/poll      - Tạo bình chọn
GET    /api/posts/{postId}                 - Lấy chi tiết bài viết
```

## Database Schema

### poll_options
```sql
CREATE TABLE poll_options (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  option_text VARCHAR(255) NOT NULL,
  option_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(6),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
```

### poll_votes
```sql
CREATE TABLE poll_votes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  poll_option_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at DATETIME(6),
  UNIQUE KEY (poll_option_id, user_id),
  FOREIGN KEY (poll_option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### posts (updated)
```sql
ALTER TABLE posts 
  ADD COLUMN is_poll BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN poll_end_date DATETIME(6),
  ADD COLUMN poll_allow_multiple BOOLEAN NOT NULL DEFAULT FALSE;
```

### post_media (updated)
```sql
ALTER TABLE post_media
  ADD COLUMN media_name VARCHAR(255),
  ADD COLUMN media_size BIGINT;
```

## Testing

### Chạy migration
```bash
mysql -u root -p < RUN_THIS.sql
```

### Build và chạy backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Build và chạy frontend
```bash
cd frontend
npm install
npm run dev
```

## Future Improvements

1. **Poll improvements**:
   - Cho phép sửa/xóa bình chọn
   - Thống kê chi tiết hơn
   - Export kết quả

2. **Media improvements**:
   - Video streaming với quality selection
   - Image compression
   - Thumbnail generation
   - Cloud storage integration

3. **Performance**:
   - Pagination cho poll votes
   - Caching cho poll results
   - Lazy loading cho media

## Kết luận

Hệ thống đã được nâng cấp toàn diện với:
- ✅ Database schema hoàn chỉnh trong 1 file SQL
- ✅ Backend API đầy đủ cho poll và media
- ✅ Frontend components cho tạo và xem poll
- ✅ Hỗ trợ video playback như Facebook
- ✅ Hỗ trợ upload và xem file
- ✅ Tích hợp trong cả nhóm và bài viết cá nhân

Chỉ cần chạy `RUN_THIS.sql` là có ngay database hoàn chỉnh!