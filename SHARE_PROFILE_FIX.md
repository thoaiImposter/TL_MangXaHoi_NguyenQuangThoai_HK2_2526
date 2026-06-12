# Fix: Hiển thị bài viết đã chia sẻ trên trang hồ sơ cá nhân

## Vấn đề
Khi người dùng chia sẻ một bài viết, bài viết đó không xuất hiện trên trang hồ sơ cá nhân của họ.

## Nguyên nhân
- Khi chia sẻ bài viết, hệ thống chỉ tạo một bản ghi trong bảng `post_shares` 
- Trang Profile chỉ hiển thị các bài viết mà `post.authorId === user.id` (bài viết gốc do user tạo)
- Không có cơ chế để hiển thị các bài viết đã chia sẻ (shares) trên profile

## Giải pháp

### 1. Backend Changes

#### a. Thêm endpoint mới trong `ShareController.java`
```java
/**
 * Get shares by a specific user (for user profile)
 * GET /api/users/{userId}/shares
 */
@GetMapping("/users/{userId}/shares")
public List<PostShareResponse> getUserShares(@PathVariable Long userId,
                                              @RequestParam(required = false) Long viewerId,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "10") int size) {
    return shareService.getUserShares(userId, viewerId != null ? viewerId : userId, page, size);
}
```

#### b. Thêm method trong `ShareService.java`
```java
/**
 * Get shares by a specific user (for user profile)
 */
public List<PostShareResponse> getUserShares(Long userId, Long viewerId, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<PostShare> sharesPage = postShareRepository.findBySharedByUserId(userId, pageable);

    return sharesPage.getContent().stream()
        .filter(share -> isShareVisibleToViewer(share, viewerId))
        .map(share -> toShareResponse(share, viewerId))
        .collect(Collectors.toList());
}
```

### 2. Frontend Changes

#### a. Thêm API method trong `api.ts`
```typescript
getUserShares: (userId: number, viewerId?: number, page = 0, size = 10) =>
  request<PostShare[]>(`/users/${userId}/shares?${viewerId ? `viewerId=${viewerId}&` : ''}page=${page}&size=${size}`),
```

#### b. Tạo component `ShareCard.tsx`
Component này hiển thị thông tin của một bài chia sẻ, bao gồm:
- Thông tin người chia sẻ
- Nội dung chia sẻ (nếu có)
- Preview của bài viết gốc
- Nút xóa (chỉ hiển thị với chủ sở hữu)

#### c. Cập nhật `ProfilePage.tsx`
- Thêm state để lưu trữ shares: `userShares`, `sharesPage`, `hasMoreShares`
- Thêm functions: `loadUserShares()`, `loadMoreShares()`, `deleteShare()`
- Hiển thị shares trong feed section với tiêu đề "Bài viết đã chia sẻ"
- Hiển thị posts gốc trong feed section với tiêu đề "Bài viết"

## Cấu trúc hiển thị mới trên Profile

```
[Post Composer Bar]

### Bài viết đã chia sẻ
[ShareCard 1]
[ShareCard 2]
...
[Load More Button]

### Bài viết
[PostCard 1]
[PostCard 2]
...
[Load More Button]
```

## Tính năng đi kèm

### 1. Phân quyền hiển thị
- Chỉ hiển thị shares mà viewer có quyền xem (dựa trên share visibility)
- Public shares: hiển thị cho tất cả
- Friends shares: chỉ hiển thị cho bạn bè
- Private shares: chỉ hiển thị cho chủ sở hữu

### 2. Xóa chia sẻ
- Người dùng có thể xóa shares của chính mình
- Sau khi xóa, share count của bài gốc được cập nhật

### 3. Pagination
- Hỗ trợ load more cho cả shares và posts
- Mỗi lần load 10 items

## Kiểm tra
1. Chia sẻ một bài viết từ newsfeed hoặc post detail
2. Kiểm tra trang profile của người chia sẻ
3. Xác nhận bài chia sẻ xuất hiện trong section "Bài viết đã chia sẻ"
4. Click vào preview để xem bài gốc
5. Thử xóa share và xác nhận nó biến mất khỏi profile

## Lưu ý
- Shares và posts được hiển thị riêng biệt để dễ quản lý
- Shares hiển thị trước, sau đó đến posts gốc
- Share count trong sidebar chỉ tính posts gốc (có thể cập nhật để tính cả shares nếu cần)