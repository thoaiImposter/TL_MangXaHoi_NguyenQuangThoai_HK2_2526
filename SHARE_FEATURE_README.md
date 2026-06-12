# Tính năng Chia sẻ Bài viết - NLU Social Network

## Tổng quan

Tính năng chia sẻ bài viết cho phép người dùng chia sẻ các bài viết từ người khác đến:
1. **Dòng thời gian cá nhân** (timeline của chính họ)
2. **Nhóm** (các nhóm mà họ là thành viên)

## Cơ chế hoạt động

### 1. Chia sẻ đến Timeline cá nhân

Khi người dùng chia sẻ một bài viết đến timeline của họ:
- Bài viết gốc vẫn thuộc về tác giả ban đầu
- Người chia sẻ có thể thêm nội dung riêng (share content)
- Người chia sẻ có thể thiết lập phạm vi hiển thị cho lượt chia sẻ (public/friends/private)

### 2. Chia sẻ đến Nhóm

Khi người dùng chia sẻ một bài viết đến nhóm:
- Bài viết sẽ hiển thị trong nhóm đó
- Chỉ thành viên của nhóm mới có thể xem lượt chia sẻ
- Người chia sẻ phải là thành viên active của nhóm

## Quy tắc hiển thị theo Scope (Phạm vi)

### Scope của bài viết gốc (Original Post Visibility)

| Scope | Ai có thể xem |
|-------|---------------|
| `public` | Tất cả mọi người |
| `friends` | Chỉ bạn bè của tác giả |
| `private` | Chỉ tác giả |

### Scope của lượt chia sẻ (Share Visibility)

| Scope | Ai có thể xem |
|-------|---------------|
| `public` | Tất cả mọi người (nhưng vẫn phụ thuộc vào scope bài gốc) |
| `friends` | Chỉ bạn bè của người chia sẻ |
| `private` | Chỉ người chia sẻ |

### Logic hiển thị kết hợp

Một lượt chia sẻ chỉ hiển thị khi **CẢ HAI** điều kiện sau được thỏa:

1. **Người xem có quyền truy cập bài viết gốc**
   - Nếu bài gốc là `public`: mọi người đều xem được
   - Nếu bài gốc là `friends`: chỉ bạn bè của tác giả gốc xem được
   - Nếu bài gốc là `private`: chỉ tác giả gốc xem được

2. **Người xem có quyền truy cập lượt chia sẻ**
   - Nếu share là `public`: mọi người đều xem được (nếu thỏa điều kiện 1)
   - Nếu share là `friends`: chỉ bạn bè của người chia sẻ xem được
   - Nếu share là `private`: chỉ người chia sẻ xem được

### Ví dụ minh họa

**Kịch bản 1: Bài viết công khai, chia sẻ công khai**
- A đăng bài với scope `public`
- B chia sẻ bài của A với scope `public`
- **Kết quả**: Tất cả mọi người đều thấy lượt chia sẻ của B và có thể xem bài gốc của A

**Kịch bản 2: Bài viết công khai, chia sẻ chỉ bạn bè**
- A đăng bài with scope `public`
- B chia sẻ bài của A với scope `friends`
- **Kết quả**: 
  - Bạn bè của B: thấy lượt chia sẻ và xem được bài gốc
  - Người không phải bạn bè của B: không thấy lượt chia sẻ

**Kịch bản 3: Bài viết bạn bè, chia sẻ công khai**
- A đăng bài với scope `friends`
- B (bạn của A) chia sẻ bài với scope `public`
- C (không phải bạn của A) xem
- **Kết quả**: C không thấy lượt chia sẻ vì C không có quyền xem bài gốc của A

**Kịch bản 4: Thay đổi scope sau khi chia sẻ**
- A đăng bài với scope `public`
- B chia sẻ bài của A với scope `public`
- A thay đổi scope bài viết thành `private`
- **Kết quả**: Lượt chia sẻ của B vẫn tồn tại nhưng:
  - Khi người khác xem lượt chia sẻ, họ sẽ thấy thông báo "Bài viết không còn được chia sẻ" hoặc tương tự
  - Chỉ A (tác giả gốc) và B (người chia sẻ) có thể xem đầy đủ

## Cấu trúc Database

### Bảng `post_shares`

```sql
CREATE TABLE post_shares (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,           -- Bài viết gốc
    shared_by_id BIGINT NOT NULL,      -- Người chia sẻ
    shared_to_group_id BIGINT NULL,    -- Nhóm (null nếu chia sẻ lên timeline)
    share_content VARCHAR(5000),       -- Nội dung thêm khi chia sẻ
    share_visibility VARCHAR(20),      -- public/friends/private
    created_at DATETIME(6),
    updated_at DATETIME(6),
    
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_to_group_id) REFERENCES `groups`(id) ON DELETE SET NULL
);
```

## API Endpoints

### 1. Chia sẻ bài viết
```http
POST /api/posts/{postId}/share?userId={userId}
Content-Type: application/json

{
  "shareContent": "Check out this post!",
  "shareVisibility": "public",
  "targetGroupId": 123  // Optional: chia sẻ đến nhóm
}
```

### 2. Lấy danh sách lượt chia sẻ của bài viết
```http
GET /api/posts/{postId}/shares?viewerId={viewerId}&page=0&size=10
```

### 3. Lấy số lượt chia sẻ
```http
GET /api/posts/{postId}/shares/count
```

### 4. Kiểm tra đã chia sẻ chưa
```http
GET /api/posts/{postId}/share/status?userId={userId}
```

### 5. Xóa lượt chia sẻ
```http
DELETE /api/shares/{shareId}?userId={userId}
```

### 6. Lấy lượt chia sẻ cho feed
```http
GET /api/feed/shares?viewerId={viewerId}&page=0&size=10
```

### 7. Lấy lượt chia sẻ trong nhóm
```http
GET /api/groups/{groupId}/shares?viewerId={viewerId}&page=0&size=10
```

## Frontend Integration

### Types

```typescript
interface PostShare {
  id: number;
  originalPostId: number;
  originalPostTitle: string;
  originalPostContent: string;
  originalPostVisibility: string;
  originalAuthorId: number;
  originalAuthorName: string;
  originalAuthorAvatar: string | null;
  shareContent: string;
  shareVisibility: string;
  sharedByUserId: number;
  sharedByUserName: string;
  sharedByUserAvatar: string | null;
  sharedToGroupId: number | null;
  sharedToGroupName: string | null;
  createdAt: string;
  isOriginalPostAvailable: boolean;
}

interface PostFeedItem extends Post {
  shareCount: number;
  hasSharedByMe: boolean;
  // ... other fields
}
```

### API Methods

```typescript
// Chia sẻ bài viết
api.sharePost(postId, userId, { shareContent, shareVisibility, targetGroupId })

// Lấy danh sách chia sẻ
api.getPostShares(postId, viewerId, page, size)

// Lấy số lượt chia sẻ
api.getShareCount(postId)

// Kiểm tra đã chia sẻ chưa
api.getShareStatus(postId, userId)

// Xóa chia sẻ
api.deleteShare(shareId, userId)
```

## Xử lý trường hợp đặc biệt

### 1. Bài viết gốc bị xóa
- Khi bài viết gốc bị xóa, tất cả lượt chia sẻ cũng bị xóa (ON DELETE CASCADE)

### 2. Bài viết gốc chuyển sang private
- Lượt chia sẻ vẫn tồn tại
- Khi hiển thị, kiểm tra `isOriginalPostAvailable` để hiển thị thông báo phù hợp
- Chỉ tác giả gốc và người chia sẻ có thể xem đầy đủ

### 3. Người chia sẻ bị block
- Nếu A block B, A sẽ không thấy lượt chia sẻ của B
- Xử lý ở level feed/post display

### 4. Người dùng rời nhóm
- Lượt chia sẻ đến nhóm vẫn tồn tại
- Người dùng không còn xem được lượt chia sẻ trong nhóm đó

## Notification

Khi chia sẻ bài viết:
- Tác giả gốc nhận được notification loại `POST_SHARE`
- Nội dung: "{Người chia sẻ} đã chia sẻ bài viết của bạn"

## Best Practices

1. **Hiển thị lượt chia sẻ**: Luôn kiểm tra `isOriginalPostAvailable` trước khi hiển thị bài gốc
2. **Permission check**: Luôn validate permission ở cả backend và frontend
3. **Error handling**: Xử lý rõ ràng các trường hợp không có quyền truy cập
4. **UI feedback**: Hiển thị rõ ràng khi bài viết không còn khả dụng
5. **Performance**: Sử dụng pagination cho danh sách lượt chia sẻ

## Testing Scenarios

1. ✅ Chia sẻ bài public thành công
2. ✅ Chia sẻ bài friends (chỉ bạn bè thấy)
3. ✅ Chia sẻ bài private (thất bại - không có quyền)
4. ✅ Chia sẻ đến nhóm (chỉ thành viên thấy)
5. ✅ Không thể chia sẻ cùng bài 2 lần
6. ✅ Xóa lượt chia sẻ thành công
7. ✅ Scope thay đổi sau khi chia sẻ
8. ✅ Bài gốc bị xóa → lượt chia sẻ bị xóa