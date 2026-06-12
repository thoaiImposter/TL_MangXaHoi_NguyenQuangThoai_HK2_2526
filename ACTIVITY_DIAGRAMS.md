# Activity Diagrams - Social Network Application

This document contains activity diagrams for the main features of the social network application:
1. Đăng bài (Post Creation)
2. Kết bạn (Friend Request)
3. Nhắn tin (Messaging)
4. Tương tác với bình luận (Comment Interaction)
5. Tạo nhóm (Group Creation)
6. Tham gia nhóm (Join Group)

---

## 1. Activity Diagram - Đăng bài (Post Creation)

### Mô tả luồng xử lý:
1. Người dùng nhấn nút "Đăng bài"
2. Nhập nội dung bài viết (có thể kèm hình ảnh)
3. Chọn chế độ hiển thị (public/friends)
4. Hệ thống kiểm tra dữ liệu
5. Lưu bài viết vào database
6. Gửi thông báo cho bạn bè

```mermaid
activityDiagram
    start
    :Người dùng nhấn nút "Đăng bài";
    :Nhập tiêu đề và nội dung;
    :Thêm hình ảnh (nếu có);
    :Chọn chế độ hiển thị\n(public/friends);
    :Nhấn nút "Đăng";
    
    if (Nội dung rỗng\nVÀ không có hình ảnh?) then (yes)
        :Hiển thị lỗi:\n"Nội dung hoặc hình ảnh là bắt buộc";
        stop
    else (no)
        :Hệ thống kiểm tra user tồn tại;
        if (User tồn tại?) then (no)
            :Hiển thị lỗi:\n"User không tồn tại";
            stop
        else (yes)
            :Tạo đối tượng Post mới;
            :Thiết lập thông tin:\n- Tiêu đề: "Bài viết"\n- Nội dung\n- Chế độ hiển thị\n- Tác giả\n- Thời gian tạo;
            :Lưu Post vào database;
            
            if (Có hình ảnh?) then (yes)
                :Lưu từng hình ảnh vào\nPostMedia table;\n(với mediaUrl, mediaType, mediaOrder);
            else (no)
            endif
            
            :Lấy danh sách ID bạn bè của tác giả;
            
            for (Mỗi friendId)
                :Tạo thông báo\n"new_post" cho bạn bè;
                :Lưu notification vào database;
            endfor (tiếp)
            
            :Trả về PostResponse\n(chứa id, content, author, createdAt...);
            :Hiển thị thông báo:\n"Đăng bài thành công";
        endif
    endif
    
    stop
```

### Các trường hợp lỗi:
| Lỗi | Nguyên nhân | Xử lý |
|-----|-------------|-------|
| Nội dung rỗng | Không nhập gì | Hiển thị lỗi "Content or image is required" |
| User không tồn tại | userId không hợp lệ | Hiển thị lỗi "User not found" |
| Chỉ đăng được bài của mình | userId không phải chủ tài khoản | Kiểm tra quyền ở update/delete |

---

## 2. Activity Diagram - Kết bạn (Friend Request)

### Mô tả luồng xử lý:
1. Người dùng tìm kiếm và chọn người muốn kết bạn
2. Nhấn nút "Gửi lời mời kết bạn"
3. Hệ thống kiểm tra các điều kiện
4. Tạo lời mời kết bạn hoặc xử lý tình huống đặc biệt
5. Gửi thông báo

```mermaid
activityDiagram
    start
    :Người dùng tìm kiếm người khác;
    :Nhấn nút "Gửi lời mời kết bạn";
    
    if (requesterId == addresseeId?) then (yes)
        :Hiển thị lỗi:\n"Không thể gửi lời mời cho chính mình";
        stop
    else (no)
        :Hệ thống kiểm tra user tồn tại;
        if (Cả 2 user tồn tại?) then (no)
            :Hiển thị lỗi:\n"User không tồn tại";
            stop
        else (yes)
            :Kiểm tra quan hệ hiện tại;
            
            if (Đã là bạn? - status = "accepted") then (yes)
                :Hiển thị lỗi:\n"Đã là bạn bè";
                stop
            elseif (Lời mời đã gửi? - status = "pending") then (yes)
                :Hiển thị lỗi:\n"Lời mời kết bạn đã được gửi";
                stop
            else (no)
                
                if (Có lời mời ngược chiều\npending từ addressee?) then (yes)
                    :Chấp nhận lời mời ngược;\n(2 người trở thành bạn);
                    :Cập nhật status = "accepted";
                    :Lưu vào database;
                    :Tạo thông báo\n"friend_accepted";
                    :Hiển thị:\n"Đã trở thành bạn bè";
                else (no)
                    :Tạo Friendship mới;\n- requester: người gửi\n- addressee: người nhận\n- status: "pending";
                    :Lưu vào database;
                    :Tạo thông báo\n"friend_request";
                    :Hiển thị:\n"Lời mời đã được gửi";
                endif
            endif
        endif
    endif
    
    stop
```

### Các trạng thái Friendship:
- **pending**: Lời mời đang chờ xử lý
- **accepted**: Đã chấp nhận, trở thành bạn bè

### Các hành động có thể:
| Hành động | Người thực hiện | Kết quả |
|-----------|----------------|---------|
| Gửi lời mời | requester | Tạo friendship status = "pending" |
| Chấp nhận | addressee | Cập nhật status = "accepted" |
| Từ chối | addressee | Xóa friendship |
| Hủy lời mời | requester | Xóa friendship |
| Hủy kết bạn | requester/addressee | Xóa friendship |

---

## 3. Activity Diagram - Nhắn tin (Messaging)

### Mô tả luồng xử lý:
1. Người dùng mở cuộc trò chuyện
2. Nhập nội dung tin nhắn (có thể kèm hình ảnh)
3. Gửi tin nhắn
4. Hệ thống kiểm tra và lưu tin nhắn
5. Gửi thông báo real-time qua WebSocket

```mermaid
activityDiagram
    start
    :Người dùng mở chat với người khác;
    :Nhập nội dung tin nhắn;
    :Thêm hình ảnh (nếu có);
    :Nhấn nút "Gửi";
    
    if (Nội dung rỗng\nVÀ không có hình ảnh?) then (yes)
        :Hiển thị lỗi:\n"Nội dung hoặc hình ảnh là bắt buộc";
        stop
    else (no)
        :Kiểm tra kích thước hình ảnh\n(nếu có) > 10MB?;
        if (Hình quá lớn?) then (yes)
            :Hiển thị lỗi:\n"Hình ảnh quá lớn. Vui lòng chọn hình nhỏ hơn";
            stop
        else (no)
            :Hệ thống kiểm tra sender/receiver tồn tại;
            if (User tồn tại?) then (no)
                :Hiển thị lỗi:\n"User không tồn tại";
                stop
            else (yes)
                :Kiểm tra sender có bị\nreceiver block không?;
                if (Bị block?) then (yes)
                    :Hiển thị lỗi:\n"Bị chặn";
                    stop
                else (no)
                    :Kiểm tra receiver có bật\n"Account Protection" không?;
                    if (Có bật protection?) then (yes)
                        :Kiểm tra sender có phải\nbạn bè của receiver?;
                        if (Không phải bạn?) then (yes)
                            :Hiển thị lỗi:\n"User này chỉ chấp nhận\ntin nhắn từ bạn bè";
                            stop
                        else (là bạn)
                        endif
                    else (không bật)
                    endif
                    
                    :Tạo đối tượng Message;\n- sender\n- receiver\n- content\n- mediaUrl\n- isRead: false\n- isRecalled: false\n- createdAt: now();
                    :Lưu Message vào database;
                    :Trả về MessageResponse;
                    
                    :Gửi WebSocket notification\nđến receiver:\n{\n  type: "new_message",\n  messageId,\n  senderId,\n  receiverId,\n  content,\n  mediaUrl,\n  createdAt\n};
                    :Hiển thị tin nhắn\ntrong giao diện;
                endif
            endif
        endif
    endif
    
    stop
```

### Các tính năng tin nhắn:
| Tính năng | Mô tả |
|-----------|-------|
| Gửi tin nhắn | Gửi nội dung + hình ảnh (max 10MB) |
| Thu hồi tin nhắn | Chỉ sender có thể thu hồi |
| Đánh dấu đã đọc | Khi receiver mở cuộc trò chuyện |
| Chặn tin nhắn | Nếu bị block hoặc account protection |

---

## 4. Activity Diagram - Tương tác với bình luận (Comment Interaction)

### Mô tả luồng xử lý:
1. Người dùng xem bài viết
2. Nhập bình luận
3. Gửi bình luận
4. Hệ thống kiểm tra và lưu
5. Gửi thông báo cho chủ bài viết

```mermaid
activityDiagram
    start
    :Người dùng mở bài viết;
    :Cuộn xuống phần bình luận;
    
    partition "Thêm bình luận mới" {
        :Nhập nội dung bình luận;
        :Thêm hình ảnh (nếu có);
        :Nhấn nút "Gửi bình luận";
        
        if (Nội dung rỗng?) then (yes)
            :Hiển thị lỗi:\n"Nội dung bình luận là bắt buộc";
            stop
        else (no)
            :Hệ thống kiểm tra:\n- Post tồn tại\n- User tồn tại;
            if (Hợp lệ?) then (no)
                :Hiển thị lỗi:\n"Post hoặc User không tồn tại";
                stop
            else (yes)
                :Tạo PostComment;\n- post\n- author\n- content\n- parentComment: null\n- createdAt: now();
                :Lưu Comment vào database;
                
                if (Có hình ảnh?) then (yes)
                    :Lưu hình ảnh vào\nCommentMedia table;
                else (no)
                endif
                
                :Tạo thông báo cho\nchủ bài viết:\n"post_comment";
                :Hiển thị bình luận\ntrong danh sách;
            endif
        endif
    }
    
    partition "Trả lời bình luận" {
        :Nhấn nút "Trả lời" trên comment;
        :Nhập nội dung trả lời;
        :Nhấn nút "Gửi";
        
        :Hệ thống kiểm tra parentComment tồn tại;
        if (Parent comment tồn tại?) then (no)
            :Hiển thị lỗi:\n"Bình luận gốc không tồn tại";
            stop
        else (yes)
            :Tạo PostComment với\nparentCommentId;\n(Là reply của comment gốc);
            :Lưu vào database;
            :Tạo thông báo cho\nchủ comment gốc;
            :Hiển thị reply\nlồng vào comment gốc;
        endif
    }
    
    partition "Thả tim bình luận" {
        :Nhấn nút "Thả tim" trên comment;
        
        if (Đã thả tim trước đó?) then (yes)
            :Xóa CommentLike\n(bỏ thả tim);
            :Cập nhật likeCount--;\nlikedByMe = false;
        else (chưa thả)
            :Tạo CommentLike;\n- comment\n- user;
            :Lưu vào database;
            :Cập nhật likeCount++;\nlikedByMe = true;
        endif
        
        :Hiển thị số lượt thích mới;
    }
    
    partition "Xóa bình luận" {
        :Nhấn nút "Xóa" trên comment;\n(chỉ chủ comment hoặc chủ bài thấy);
        :Xác nhận xóa;
        
        :Hệ thống kiểm tra:\n- Comment tồn tại\n- User là chủ comment;
        if (Là chủ comment?) then (no)
            :Hiển thị lỗi:\n"Bạn chỉ có thể xóa\nbình luận của mình";
            stop
        else (yes)
            :Xóa Comment khỏi database;
            :Cập nhật giao diện:\n- Xóa comment khỏi danh sách\n- Giảm commentCount;
        endif
    }
    
    stop
```

### Các loại tương tác bình luận:
| Tương tác | Mô tả | Endpoint |
|-----------|-------|----------|
| Thêm bình luận | POST /posts/{postId}/comments | `/api/posts/{postId}/comments` |
| Trả lời bình luận | POST /posts/{postId}/comments/{commentId}/replies | `/api/posts/{postId}/comments/{commentId}/replies` |
| Thả tim | POST /posts/comments/{commentId}/likes | `/api/posts/comments/{commentId}/likes` |
| Sửa bình luận | PUT /posts/comments/{commentId} | `/api/posts/comments/{commentId}` |
| Xóa bình luận | DELETE /posts/comments/{commentId} | `/api/posts/comments/{commentId}` |

---

## Tổng quan Database Entities

### Các bảng chính liên quan:

```
┌─────────────────┐     ┌─────────────────┐
│      User       │     │      Post       │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ fullName        │     │ title           │
│ avatar          │     │ content         │
│ email           │     │ visibility      │
│ accountProtection│    │ authorId (FK)   │
└─────────────────┘     │ createdAt       │
        │               └─────────────────┘
        │                        │
        │       ┌────────────────┘
        │       │
        ▼       ▼
┌─────────────────┐     ┌─────────────────┐
│   Friendship    │     │   PostComment   │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ requesterId(FK) │     │ postId (FK)     │
│ addresseeId(FK) │     │ authorId (FK)   │
│ status          │     │ content         │
│ createdAt       │     │ parentCommentId │
└─────────────────┘     │ createdAt       │
                        └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │   CommentLike   │
                        ├─────────────────┤
                        │ id (PK)         │
                        │ commentId (FK)  │
                        │ userId (FK)     │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│     Message     │     │    PostLike     │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ senderId (FK)   │     │ postId (FK)     │
│ receiverId (FK) │     │ userId (FK)     │
│ content         │     └─────────────────┘
│ mediaUrl        │
│ isRead          │     ┌─────────────────┐
│ isRecalled      │     │   PostMedia     │
│ createdAt       │     ├─────────────────┤
└─────────────────┘     │ id (PK)         │
                        │ postId (FK)     │
                        │ mediaType       │
                        │ mediaUrl        │
                        │ mediaOrder      │
                        └─────────────────┘
```

---

## API Endpoints Summary

### Post APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/{userId}/posts` | Tạo bài viết mới |
| GET | `/api/posts/{postId}` | Xem chi tiết bài viết |
| PUT | `/api/posts/{postId}` | Cập nhật bài viết |
| DELETE | `/api/posts/{postId}` | Xóa bài viết |

### Comment APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts/{postId}/comments` | Thêm bình luận |
| POST | `/api/posts/{postId}/comments/{commentId}/replies` | Trả lời bình luận |
| PUT | `/api/posts/comments/{commentId}` | Sửa bình luận |
| DELETE | `/api/posts/comments/{commentId}` | Xóa bình luận |
| POST | `/api/posts/comments/{commentId}/likes` | Thả tim bình luận |

### Friendship APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/{userId}/friend-requests` | Gửi lời mời kết bạn |
| GET | `/api/users/{userId}/friend-requests/pending` | Xem lời mời chờ |
| PUT | `/api/friend-requests/{friendshipId}/accept` | Chấp nhận lời mời |
| DELETE | `/api/friend-requests/{friendshipId}` | Từ chối/Hủy lời mời |
| DELETE | `/api/friendships/{friendshipId}` | Hủy kết bạn |

### Message APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/{userId}/messages` | Gửi tin nhắn |
| GET | `/api/users/{userId}/messages` | Xem cuộc trò chuyện |
| GET | `/api/users/{userId}/conversations` | Xem danh sách chat |
| PUT | `/api/users/{userId}/conversations/{otherId}/read` | Đánh dấu đã đọc |
| DELETE | `/api/messages/{messageId}/recall` | Thu hồi tin nhắn |

---

## 5. Activity Diagram - Tạo nhóm (Group Creation)

### Mô tả luồng xử lý:
1. Người dùng truy cập trang Nhóm
2. Nhấn nút "Tạo nhóm mới"
3. Điền thông tin nhóm (tên, mô tả, chế độ riêng tư)
4. Hệ thống kiểm tra và tạo nhóm
5. Người tạo tự động trở thành chủ nhóm (Gold Key)

```mermaid
activityDiagram
    start
    :Người dùng truy cập trang Nhóm;
    :Nhấn nút "Tạo nhóm mới";
    
    :Điền thông tin nhóm;
    note right
        Thông tin bắt buộc:
        - Tên nhóm
        Thông tin tùy chọn:
        - Mô tả
        - Chế độ riêng tư (public/private)
        - Yêu cầu phê duyệt thành viên
    end note
    
    :Nhấn nút "Tạo nhóm";
    
    if (Tên nhóm rỗng?) then (yes)
        :Hiển thị lỗi:\n"Tên nhóm là bắt buộc";
        stop
    else (no)
        :Hệ thống kiểm tra user tồn tại;
        if (User tồn tại?) then (no)
            :Hiển thị lỗi:\n"User không tồn tại";
            stop
        else (yes)
            :Kiểm tra tên nhóm\ncó trùng không?;
            if (Tên trùng?) then (yes)
                :Hiển thị lỗi:\n"Tên nhóm đã tồn tại";
                stop
            else (no)
                :Tạo đối tượng Group mới;\n- name\n- description\n- privacy (public/private)\n- requiresApproval\n- creatorId\n- createdAt: now();
                :Lưu Group vào database;
                
                :Tạo GroupMember cho creator;\n- groupId\n- userId (creator)\n- role: "GOLD_KEY"\n- status: "ACTIVE"\n- joinedAt: now();
                :Lưu member vào database;
                
                :Tạo thông báo\n"group_created";
                :Chuyển hướng đến\ntrang chi tiết nhóm;
                :Hiển thị thông báo:\n"Tạo nhóm thành công";
            endif
        endif
    endif
    
    stop
```

### Các chế độ riêng tư của nhóm:
| Chế độ | Mô tả |
|--------|-------|
| Public | Bất kỳ ai cũng có thể xem và tham gia trực tiếp |
| Private | Chỉ thành viên mới xem được nội dung, cần phê duyệt để tham gia |

### Vai trò trong nhóm:
| Vai trò | Quyền hạn |
|---------|-----------|
| Gold Key (Chủ nhóm) | Toàn quyền quản lý, xóa nhóm, chỉ định admin |
| Silver Key (Admin) | Duyệt bài, duyệt thành viên, xóa bài, gỡ thành viên |
| Member | Đăng bài, bình luận, tương tác |

---

## 6. Activity Diagram - Tham gia nhóm (Join Group)

### Mô tả luồng xử lý:
1. Người dùng tìm kiếm hoặc duyệt danh sách nhóm
2. Chọn nhóm muốn tham gia
3. Nhấn nút "Tham gia"
4. Hệ thống kiểm tra điều kiện tham gia
5. Xử lý tùy theo chế độ nhóm

```mermaid
activityDiagram
    start
    :Người dùng tìm kiếm/duyệt nhóm;
    :Chọn nhóm muốn tham gia;
    :Nhấn nút "Tham gia";
    
    if (Đã là thành viên?) then (yes)
        :Hiển thị thông báo:\n"Bạn đã là thành viên nhóm này";
        stop
    else (no)
        if (Người dùng bị ban?) then (yes)
            :Hiển thị lỗi:\n"Bạn đã bị cấm tham gia nhóm này";
            stop
        else (no)
            :Hệ thống kiểm tra\nchế độ nhóm;
            
            if (Nhóm công khai\nVÀ không yêu cầu phê duyệt?) then (yes)
                :Tạo GroupMember;\n- role: "MEMBER"\n- status: "ACTIVE";
                :Lưu vào database;
                :Cập nhật member count++;
                :Hiển thị:\n"Đã tham gia nhóm thành công";
            else (cần phê duyệt)
                :Kiểm tra yêu cầu\nđã tồn tại chưa?;
                if (Yêu cầu đã tồn tại?) then (yes)
                    :Hiển thị:\n"Yêu cầu tham gia đang chờ xử lý";
                    stop
                else (no)
                    :Tạo GroupJoinRequest;\n- groupId\n- userId\n- status: "PENDING"\n- requestedAt: now();
                    :Lưu vào database;
                    :Gửi thông báo cho\nquản trị viên nhóm;
                    :Hiển thị:\n"Yêu cầu tham gia đã được gửi";
                endif
            endif
        endif
    endif
    
    stop
```

### Luồng phê duyệt yêu cầu tham gia (Admin):

```mermaid
activityDiagram
    start
    :Admin xem danh sách\nyêu cầu chờ;
    :Chọn yêu cầu cần xử lý;
    
    if (Chọn "Chấp nhận") then (yes)
        :Tạo GroupMember;\n- role: "MEMBER"\n- status: "ACTIVE";
        :Lưu vào database;
        :Xóa join request;
        :Gửi thông báo cho\nngười dùng:\n"Yêu cầu tham gia được chấp nhận";
        :Cập nhật member count++;
    else (Chọn "Từ chối")
        :Xóa join request;
        :Gửi thông báo cho\nngười dùng:\n"Yêu cầu tham gia bị từ chối";
    endif
    
    stop
```

### Các trạng thái join request:
| Trạng thái | Mô tả |
|------------|-------|
| PENDING | Yêu cầu đang chờ phê duyệt |
| APPROVED | Đã được chấp nhận (đã trở thành member) |
| REJECTED | Bị từ chối |

### Các hành động tham gia nhóm:
| Hành động | Điều kiện | Kết quả |
|-----------|-----------|---------|
| Tham gia trực tiếp | Nhóm public, không yêu cầu phê duyệt | Trở thành member ngay |
| Gửi yêu cầu | Nhóm private hoặc yêu cầu phê duyệt | Chờ admin duyệt |
| Hủy yêu cầu | Yêu cầu đang pending | Xóa yêu cầu |
