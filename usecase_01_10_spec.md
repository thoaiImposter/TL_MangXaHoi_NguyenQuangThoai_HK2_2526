# Đặc tả use case 01-10

## UC01 - Đăng ký tài khoản bằng email trường
| Trường | Nội dung |
|---|---|
| Name of Use Case | Đăng ký tài khoản bằng email trường |
| Use Case ID | UC01 |
| Brief Description | Người dùng tạo tài khoản mới bằng email trường hợp lệ, xác thực OTP, sau đó hoàn tất hồ sơ ban đầu và nhận token đăng nhập. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn `Đăng ký ngay` tại màn hình đăng nhập. |
| Flow of Events | Basic Flow: 1) Người dùng mở trang đăng ký trên `RegisterPage`. 2) Chọn vai trò tài khoản và nhập email trường. 3) Hệ thống kiểm tra email hợp lệ và chưa tồn tại. 4) Frontend gọi `POST /api/auth/register/request-otp` để yêu cầu OTP. 5) Hệ thống tạo OTP, lưu token OTP và gửi qua email. 6) Người dùng nhập OTP và thông tin hồ sơ bắt buộc theo vai trò. 7) Frontend gọi `POST /api/auth/register`. 8) Backend xác thực OTP, tạo tài khoản và cấp token đăng nhập. 9) Frontend lưu `social_token`, `social_user` và chuyển đến trang home. <br> Alternate Flows: email không đúng định dạng; email đã tồn tại; OTP sai hoặc hết hạn; OTP gửi lại; thiếu thông tin bắt buộc theo vai trò. |
| Pre-Conditions | Người dùng chưa có tài khoản hoặc chưa đăng nhập; email trường hợp lệ; chức năng gửi email hoạt động. |
| Post-Condition | Tài khoản mới được tạo, token được lưu ở client và người dùng được đăng nhập tự động. |
| Extension Points | Vai trò `student/advisor/faculty_union/school_union`; nhập avatar/cover; khai báo khoa, ngành, lớp, niên khóa, học vị tùy vai trò. |

## UC02 - Đăng nhập bằng email trường
| Trường | Nội dung |
|---|---|
| Name of Use Case | Đăng nhập bằng email trường |
| Use Case ID | UC02 |
| Brief Description | Người dùng xác thực bằng email và mật khẩu, hệ thống trả về token phiên và dữ liệu hồ sơ để khởi tạo trạng thái đăng nhập. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn `Đăng nhập` tại màn hình `LoginPage`. |
| Flow of Events | Basic Flow: 1) Người dùng mở màn hình đăng nhập. 2) Nhập email và mật khẩu. 3) Frontend gọi `POST /api/auth/login`. 4) Backend kiểm tra thông tin tài khoản và trạng thái khóa/mở khóa. 5) Nếu hợp lệ, hệ thống tạo token và trả về hồ sơ người dùng. 6) Frontend lưu `social_token` và `social_user`. 7) Người dùng được chuyển sang `/home`. <br> Alternate Flows: sai mật khẩu; tài khoản bị khóa; không tồn tại tài khoản; token không hợp lệ hoặc phiên hết hạn. |
| Pre-Conditions | Tài khoản đã được tạo và không bị khóa. |
| Post-Condition | Phiên đăng nhập được khởi tạo trên trình duyệt. |
| Extension Points | Ghi nhớ phiên bằng `localStorage`; tự điều hướng sang trang trước đó nếu logic UI cho phép. |

## UC03 - Đăng xuất
| Trường | Nội dung |
|---|---|
| Name of Use Case | Đăng xuất |
| Use Case ID | UC03 |
| Brief Description | Người dùng kết thúc phiên làm việc trên trình duyệt bằng cách xóa dữ liệu xác thực và trạng thái UI tạm thời. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng nhấn nút đăng xuất trên thanh điều hướng hoặc trong menu tài khoản. |
| Flow of Events | Basic Flow: 1) Người dùng chọn đăng xuất tại `AppLayout`. 2) Frontend xóa `social_token`, `social_user`. 3) Frontend xóa mini chat, trạng thái thông báo cục bộ và dữ liệu phiên tạm. 4) Người dùng được điều hướng về `/login`. <br> Alternate Flows: token đã hết hạn nhưng UI vẫn xử lý như thao tác đăng xuất thông thường. |
| Pre-Conditions | Người dùng đang đăng nhập. |
| Post-Condition | Phiên hiện tại kết thúc ở phía client. |
| Extension Points | Nếu phát hiện token không hợp lệ, UI có thể tự điều hướng về login từ khu vực bảo vệ. |

## UC04 - Đổi mật khẩu
| Trường | Nội dung |
|---|---|
| Name of Use Case | Đổi mật khẩu |
| Use Case ID | UC04 |
| Brief Description | Người dùng thay đổi mật khẩu tài khoản trong màn hình bảo mật của trang cài đặt. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng mở phần `Riêng tư & Bảo vệ` trong `PrivacyPage`. |
| Flow of Events | Basic Flow: 1) Người dùng mở trang `PrivacyPage`. 2) Nhập mật khẩu cũ, mật khẩu mới và xác nhận. 3) Frontend kiểm tra mật khẩu xác nhận khớp. 4) Gọi `PUT /api/users/{userId}/password`. 5) Backend lấy user hiện tại từ token và kiểm tra mật khẩu cũ. 6) Nếu hợp lệ, hệ thống cập nhật password hash. 7) Backend trả trạng thái thành công. 8) Frontend hiển thị thông báo đổi mật khẩu thành công và làm sạch form. <br> Alternate Flows: mật khẩu cũ sai; mật khẩu mới không đạt chính sách; xác nhận không khớp; người dùng chưa đăng nhập. |
| Pre-Conditions | Người dùng đã đăng nhập. |
| Post-Condition | Mật khẩu mới có hiệu lực cho các lần đăng nhập sau. |
| Extension Points | Sau khi đổi mật khẩu có thể yêu cầu xác thực lại ở các phiên khác nếu chính sách bảo mật áp dụng. |

## UC05 - Cập nhật thông tin cá nhân
| Trường | Nội dung |
|---|---|
| Name of Use Case | Cập nhật thông tin cá nhân |
| Use Case ID | UC05 |
| Brief Description | Người dùng chỉnh sửa hồ sơ cá nhân, bao gồm thông tin học tập, avatar, cover và bio từ màn hình cài đặt. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chỉnh sửa thông tin tại `SettingsPage` rồi bấm lưu. |
| Flow of Events | Basic Flow: 1) Người dùng mở trang `SettingsPage`. 2) Sửa họ tên, bio, khoa, ngành, lớp, niên khóa, học vị và ảnh đại diện/ảnh bìa nếu cần. 3) Nếu có file mới, frontend upload ảnh lên Cloudinary. 4) Frontend gọi `PUT /api/users/{userId}`. 5) Backend lấy `currentUserId` từ token và kiểm tra quyền cập nhật hồ sơ. 6) Hệ thống lưu thông tin hồ sơ mới vào cơ sở dữ liệu. 7) Frontend cập nhật `social_user` trong localStorage. 8) Giao diện hiển thị lại hồ sơ đã cập nhật. <br> Alternate Flows: dữ liệu không hợp lệ; upload file lỗi; người dùng sửa hồ sơ không thuộc quyền của mình. |
| Pre-Conditions | Người dùng đã đăng nhập và đang mở hồ sơ của chính mình. |
| Post-Condition | Hồ sơ cá nhân được lưu mới và hiển thị lại trên UI. |
| Extension Points | Cập nhật avatar, cover, bio, faculty, major, className, academicYear, academicTitle. |

## UC06 - Quản lý hồ sơ
| Trường | Nội dung |
|---|---|
| Name of Use Case | Quản lý hồ sơ |
| Use Case ID | UC06 |
| Brief Description | Người dùng xem và thao tác trên trang hồ sơ cá nhân, bao gồm bài viết, chia sẻ, bạn bè và các lối tắt liên quan. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng mở `/profile` hoặc `/users/{userId}`. |
| Flow of Events | Basic Flow: 1) Người dùng mở trang hồ sơ cá nhân. 2) Frontend gọi `GET /api/users/{userId}` để tải thông tin hồ sơ. 3) Gọi thêm `GET /api/users/{userId}/posts`, `GET /api/users/{userId}/shares` và các dữ liệu quan hệ nếu cần. 4) Frontend hiển thị các tab nội dung: thông tin, bài viết, chia sẻ, bạn bè. 5) Người dùng chuyển giữa các tab để xem chi tiết. 6) Từ hồ sơ, người dùng có thể đi đến cài đặt, chat, danh sách bạn bè hoặc bài đăng liên quan. <br> Alternate Flows: xem hồ sơ người khác; hồ sơ bị giới hạn quyền riêng tư; dữ liệu chưa có hoặc đang tải. |
| Pre-Conditions | Người dùng đã đăng nhập. |
| Post-Condition | Thông tin hồ sơ được hiển thị đúng trạng thái hiện tại. |
| Extension Points | Mở mini chat, vào trang cài đặt, xem bài viết/share của user, đi tới trang bạn bè. |

## UC07 - Đăng bài viết
| Trường | Nội dung |
|---|---|
| Name of Use Case | Đăng bài viết |
| Use Case ID | UC07 |
| Brief Description | Người dùng tạo bài viết mới trên dòng thời gian cá nhân hoặc trong nhóm. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng mở `PostComposer` hoặc modal soạn bài và bấm đăng. |
| Flow of Events | Basic Flow: 1) Người dùng mở composer trên home/profile/group. 2) Nhập nội dung, chọn media và chọn quyền hiển thị nếu là bài cá nhân. 3) Nếu có media, frontend upload file lên Cloudinary. 4) Frontend gọi `POST /api/posts` hoặc `POST /api/groups/{groupId}/posts` tùy bối cảnh. 5) Backend lấy người dùng hiện tại từ token và kiểm tra quyền tạo bài. 6) Hệ thống lưu bài viết và các media liên quan. 7) Frontend refresh feed hoặc danh sách bài viết. <br> Alternate Flows: nội dung rỗng; file lỗi; không đủ quyền đăng trong nhóm; bài bị từ chối do policy nhóm. |
| Pre-Conditions | Người dùng đã đăng nhập. |
| Post-Condition | Bài viết mới xuất hiện trên feed, trang cá nhân hoặc trang nhóm. |
| Extension Points | Đính kèm ảnh, video, file; bài riêng tư/bạn bè/công khai; bài nhóm chờ duyệt. |

## UC08 - Chỉnh sửa bài viết
| Trường | Nội dung |
|---|---|
| Name of Use Case | Chỉnh sửa bài viết |
| Use Case ID | UC08 |
| Brief Description | Người dùng cập nhật nội dung hoặc media của bài viết đã tạo trước đó. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn `Sửa` trên bài viết của chính mình. |
| Flow of Events | Basic Flow: 1) Người dùng mở bài viết của mình. 2) Chọn `Sửa`. 3) Frontend mở composer ở chế độ chỉnh sửa. 4) Người dùng cập nhật nội dung, media hoặc visibility. 5) Nếu có media mới, frontend upload file lên Cloudinary trước. 6) Frontend gọi `PUT /api/posts/{postId}`. 7) Backend xác thực quyền sở hữu và lưu thay đổi. 8) Frontend hiển thị lại bài viết đã cập nhật. <br> Alternate Flows: không phải chủ bài; dữ liệu không hợp lệ; upload media lỗi. |
| Pre-Conditions | Người dùng đã đăng nhập và là chủ bài viết. |
| Post-Condition | Bài viết được cập nhật trên hệ thống. |
| Extension Points | Chỉnh sửa nội dung, media, quyền hiển thị hoặc danh sách tệp kèm theo. |

## UC09 - Xóa bài viết
| Trường | Nội dung |
|---|---|
| Name of Use Case | Xóa bài viết |
| Use Case ID | UC09 |
| Brief Description | Người dùng xóa bài viết đã tạo trên home, profile hoặc group. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng nhấn `Xóa` trên menu bài viết của mình. |
| Flow of Events | Basic Flow: 1) Người dùng mở menu bài viết. 2) Chọn xóa. 3) Hệ thống hiển thị hộp thoại xác nhận. 4) Người dùng đồng ý xóa. 5) Frontend gọi `DELETE /api/posts/{postId}`. 6) Backend lấy `currentUserId` từ token và kiểm tra quyền sở hữu bài viết. 7) Hệ thống xóa bài viết. 8) Frontend refresh feed và remove bài khỏi danh sách. <br> Alternate Flows: người dùng hủy thao tác; không đủ quyền; bài viết đã bị xóa trước đó. |
| Pre-Conditions | Người dùng đã đăng nhập và là chủ bài viết. |
| Post-Condition | Bài viết không còn hiển thị trên giao diện. |
| Extension Points | Xóa bài cá nhân hoặc bài nhóm tùy vị trí đăng. |

## UC10 - Đăng bình chọn <<extend>> UC07
| Trường | Nội dung |
|---|---|
| Name of Use Case | Đăng bình chọn <<extend>> UC07 |
| Use Case ID | UC10 |
| Brief Description | Người dùng tạo bài viết dạng poll để thành viên khác bình chọn, poll có thể là bài cá nhân hoặc bài trong nhóm. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn chức năng `Bình chọn` từ composer. |
| Flow of Events | Basic Flow: 1) Người dùng mở composer và chọn tạo poll. 2) Nhập tiêu đề, nội dung, các phương án và thời hạn nếu có. 3) Frontend gọi `POST /api/polls` cho poll cá nhân hoặc `POST /api/groups/{groupId}/posts/poll` cho poll nhóm. 4) Backend lấy người dùng hiện tại từ token. 5) Hệ thống kiểm tra số lượng options, endDate và quyền tạo poll. 6) Poll và các option được lưu vào cơ sở dữ liệu. 7) Frontend hiển thị poll như một bài viết đặc biệt trên feed. <br> Alternate Flows: thiếu phương án; poll rỗng; thời hạn không hợp lệ; không đủ quyền tạo poll trong nhóm. |
| Pre-Conditions | Người dùng đã đăng nhập. |
| Post-Condition | Poll được tạo và sẵn sàng nhận phiếu bầu. |
| Extension Points | Hỗ trợ multiple choice, endDate và ẩn kết quả trong UI nếu cần. |
