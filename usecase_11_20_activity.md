# Activity Diagram - Use Case 11-20

## UC11 - Bình chọn trong bài khảo sát
```plantuml
@startuml
start
:Mở bài viết poll;
:Chọn phương án;
if (Poll còn hạn?) then (Có)
  :Gửi request vote;
  :Backend kiểm tra token và lựa chọn;
  if (Hợp lệ?) then (Có)
    :Lưu phiếu bầu;
    :Trả kết quả mới;
    :Cập nhật giao diện;
  else (Không)
    :Thông báo lỗi;
  endif
else (Không)
  :Thông báo poll đã hết hạn;
endif
stop
@enduml
```

## UC12 - Thích bài viết
```plantuml
@startuml
start
:Mở bài viết;
:Bấm Like/Unlike;
:Gửi request toggle like;
:Backend xác thực người dùng;
if (Đã thích?) then (Có)
  :Bỏ like;
else (Không)
  :Tạo like;
endif
:Trả trạng thái mới;
:Cập nhật số like trên UI;
stop
@enduml
```

## UC13 - Bình luận bài viết
```plantuml
@startuml
start
:Mở phần bình luận;
:Nhập nội dung;
if (Là trả lời bình luận?) then (Có)
  :Gửi reply comment;
else (Không)
  :Gửi comment mới;
endif
:Backend kiểm tra nội dung;
if (Hợp lệ?) then (Có)
  :Lưu bình luận;
  :Trả comment mới;
  :Hiển thị trên giao diện;
else (Không)
  :Thông báo lỗi;
endif
stop
@enduml
```

## UC14 - Chia sẻ bài viết
```plantuml
@startuml
start
:Mở hộp thoại chia sẻ;
:Nhập chú thích;
:Xác nhận share;
:Backend kiểm tra token và bài viết;
if (Hợp lệ?) then (Có)
  :Tạo bản ghi share;
  :Trả dữ liệu share;
  :Cập nhật feed/số share;
else (Không)
  :Thông báo lỗi;
endif
stop
@enduml
```

## UC15 - Gửi tin nhắn
```plantuml
@startuml
start
:Mở ChatPage/MiniChat;
:Nhập nội dung hoặc media;
if (Chat riêng?) then (Có)
  :Gọi API gửi tin nhắn riêng;
else (Không)
  :Gọi API gửi tin nhắn nhóm;
endif
:Backend kiểm tra người gửi;
if (Hợp lệ?) then (Có)
  :Lưu tin nhắn;
  :Phát WebSocket đến người nhận/nhóm;
  :Cập nhật danh sách chat;
else (Không)
  :Thông báo lỗi;
endif
stop
@enduml
```

## UC16 - Thu hồi tin nhắn
```plantuml
@startuml
start
:Mở menu tin nhắn;
:Chọn thu hồi;
:Gửi request recall;
:Backend kiểm tra quyền sở hữu;
if (Đúng chủ sở hữu?) then (Có)
  :Đánh dấu tin nhắn đã thu hồi;
  if (Tin nhắn riêng?) then (Có)
    :Thông báo qua WebSocket cho người nhận;
  else (Nhóm)
    :Thông báo qua WebSocket cho nhóm;
  endif
  :Cập nhật trạng thái trên UI;
else (Không)
  :Từ chối thao tác;
endif
stop
@enduml
```

## UC17 - Gửi lời mời kết bạn
```plantuml
@startuml
start
:Mở hồ sơ người dùng khác;
:Bấm Kết bạn;
:Gửi friend request;
:Backend kiểm tra trạng thái quan hệ;
if (Hợp lệ?) then (Có)
  :Tạo lời mời chờ;
  :Trả trạng thái pending;
  :Cập nhật nút trên UI;
else (Không)
  :Thông báo không thể gửi lời mời;
endif
stop
@enduml
```

## UC18 - Chấp nhận kết bạn
```plantuml
@startuml
start
:Mở danh sách lời mời;
:Chọn một lời mời;
:Bấm chấp nhận;
:Backend kiểm tra quyền duyệt;
if (Hợp lệ?) then (Có)
  :Cập nhật trạng thái accepted;
  :Tạo quan hệ bạn bè;
  :Cập nhật danh sách bạn bè;
else (Không)
  :Thông báo lỗi;
endif
stop
@enduml
```

## UC19 - Hủy kết bạn
```plantuml
@startuml
start
:Mở danh sách bạn bè hoặc hồ sơ;
:Chọn hủy kết bạn;
:Gửi request DELETE friendship;
:Backend kiểm tra quyền sở hữu;
if (Hợp lệ?) then (Có)
  :Xóa quan hệ bạn bè;
  :Cập nhật giao diện;
else (Không)
  :Thông báo lỗi;
endif
stop
@enduml
```

## UC20 - Xem thông báo
```plantuml
@startuml
start
:Mở ứng dụng;
:AppLayout tự tải thông báo định kỳ;
:Bấm biểu tượng chuông;
:Tải danh sách thông báo và số chưa đọc;
:Hiển thị dropdown thông báo;
if (Chọn một thông báo?) then (Có)
  :Đánh dấu đã đọc;
  :Điều hướng đến bài viết/hồ sơ/nhóm;
else (Không)
  :Giữ nguyên danh sách;
endif
if (Đánh dấu tất cả?) then (Có)
  :Gọi read-all;
  :Cập nhật badge về 0;
endif
stop
@enduml
```
