# Activity Diagrams - Use Case 01-10

## UC01 - Đăng ký tài khoản bằng email trường
```plantuml
@startuml
title UC01 - Đăng ký tài khoản bằng email trường
start
:Mở màn hình đăng ký;
:Chọn vai trò tài khoản;
:Nhập email trường;
:Gửi yêu cầu OTP;
if (Email hợp lệ và chưa tồn tại?) then (Có)
  :Hệ thống gửi OTP qua email;
  :Người dùng nhập OTP;
  if (OTP đúng?) then (Có)
    :Nhập thông tin chi tiết;
    :Upload avatar/cover nếu có;
    :Tạo tài khoản và trả token;
    :Chuyển tới trang home;
  else (Không)
    :Thông báo OTP sai hoặc hết hạn;
  endif
else (Không)
  :Thông báo email không hợp lệ hoặc đã đăng ký;
endif
stop
@enduml
```

## UC02 - Đăng nhập bằng email trường
```plantuml
@startuml
title UC02 - Đăng nhập bằng email trường
start
:Mở màn hình đăng nhập;
:Nhập email và mật khẩu;
:Gửi yêu cầu đăng nhập;
if (Xác thực thành công?) then (Có)
  :Lưu token và hồ sơ vào localStorage;
  :Chuyển tới /home;
else (Không)
  :Thông báo lỗi đăng nhập;
endif
stop
@enduml
```

## UC03 - Đăng xuất
```plantuml
@startuml
title UC03 - Đăng xuất
start
:Nhấn nút đăng xuất;
:Xóa token và user khỏi localStorage;
:Xóa trạng thái mini chat;
:Chuyển về /login;
stop
@enduml
```

## UC04 - Đổi mật khẩu
```plantuml
@startuml
title UC04 - Đổi mật khẩu
start
:Mở trang cài đặt;
:Nhập mật khẩu cũ và mật khẩu mới;
:Gửi yêu cầu đổi mật khẩu;
if (Mật khẩu cũ đúng?) then (Có)
  :Cập nhật mật khẩu;
  :Hiển thị thông báo thành công;
else (Không)
  :Hiển thị lỗi mật khẩu cũ sai;
endif
stop
@enduml
```

## UC05 - Cập nhật thông tin cá nhân
```plantuml
@startuml
title UC05 - Cập nhật thông tin cá nhân
start
:Mở trang Settings;
:Sửa họ tên / bio / khoa / lớp / ngành / học vị;
:Upload avatar hoặc cover nếu đổi ảnh;
:Nhấn lưu;
if (Dữ liệu hợp lệ?) then (Có)
  :Gọi API cập nhật profile;
  :Cập nhật user trong state;
  :Thông báo lưu thành công;
else (Không)
  :Thông báo lỗi dữ liệu;
endif
stop
@enduml
```

## UC06 - Quản lý hồ sơ
```plantuml
@startuml
title UC06 - Quản lý hồ sơ
start
:Mở trang hồ sơ của chính mình;
:Xem thông tin cá nhân, bài viết, bài chia sẻ;
:Chọn tab hồ sơ / thông tin / bạn bè;
:Đi tới các chức năng quản lý;
stop
@enduml
```

## UC07 - Đăng bài viết
```plantuml
@startuml
title UC07 - Đăng bài viết
start
:Mở PostComposer;
:Nhập nội dung bài viết;
:Chọn visibility và đính kèm media;
:Nhấn đăng;
if (Đăng ở trang cá nhân?) then (Có)
  :Gọi POST /api/posts;
else (Không)
  :Gọi POST /api/groups/{groupId}/posts;
endif
if (Lưu thành công?) then (Có)
  :Refresh feed;
else (Không)
  :Hiển thị lỗi tạo bài viết;
endif
stop
@enduml
```

## UC08 - Chỉnh sửa bài viết
```plantuml
@startuml
title UC08 - Chỉnh sửa bài viết
start
:Mở bài viết của mình;
:Chọn sửa;
:Điền lại nội dung và media;
:Nhấn lưu;
if (Là chủ bài viết?) then (Có)
  :Gọi PUT /api/posts/{postId};
  :Refresh feed;
else (Không)
  :Hiển thị lỗi không có quyền;
endif
stop
@enduml
```

## UC09 - Xóa bài viết
```plantuml
@startuml
title UC09 - Xóa bài viết
start
:Mở menu bài viết;
:Chọn xóa;
:Xác nhận xóa;
if (Đồng ý?) then (Có)
  if (Là chủ bài viết?) then (Có)
    :Gọi DELETE /api/posts/{postId};
    :Refresh feed;
  else (Không)
    :Hiển thị lỗi không có quyền;
  endif
else (Không)
  :Hủy thao tác;
endif
stop
@enduml
```

## UC10 - Đăng bình chọn <<extend>> UC07
```plantuml
@startuml
title UC10 - Đăng bình chọn <<extend>> UC07
start
:Mở composer;
:Chọn tạo poll;
:Nhập câu hỏi, options, thời hạn;
:Nhấn đăng poll;
if (Đăng ở trang cá nhân?) then (Có)
  :Gọi POST /api/polls;
else (Không)
  :Gọi POST /api/groups/{groupId}/posts/poll;
endif
if (Lưu thành công?) then (Có)
  :Refresh feed;
else (Không)
  :Hiển thị lỗi tạo poll;
endif
stop
@enduml
```
