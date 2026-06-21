# Đặc tả Use Case UC01-UC39

## UC01 - Đăng ký tài khoản bằng email trường

| Trường | Nội dung |
|---|---|
| Name of Use Case | Đăng ký tài khoản bằng email trường |
| Use Case ID | UC01 |
| Brief Description | Người dùng tạo tài khoản mới bằng email thuộc phạm vi nhà trường, xác thực danh tính qua mã OTP và hoàn tất hồ sơ ban đầu để tham gia hệ thống. |
| Actor(s) | Người dùng |
| Trigger | Người dùng chọn chức năng đăng ký tài khoản. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở màn hình đăng ký tài khoản.<br>2. Người dùng chọn vai trò và nhập email trường.<br>3. Hệ thống kiểm tra định dạng email và trạng thái tồn tại của tài khoản.<br>4. Hệ thống gửi mã OTP đến email hợp lệ.<br>5. Người dùng nhập mã OTP và thông tin hồ sơ bắt buộc theo vai trò.<br>6. Hệ thống xác thực OTP và kiểm tra dữ liệu đăng ký.<br>7. Hệ thống tạo tài khoản mới, mã hóa mật khẩu và lưu thông tin người dùng.<br>8. Hệ thống cấp phiên đăng nhập ban đầu cho người dùng.<br>9. Người dùng được chuyển vào giao diện chính của hệ thống.<br><br>**Alternate Flows:**<br>- Email không đúng định dạng: Hệ thống thông báo lỗi và yêu cầu nhập lại.<br>- Email đã tồn tại: Hệ thống từ chối đăng ký và thông báo tài khoản đã được sử dụng.<br>- OTP không hợp lệ hoặc hết hạn: Hệ thống yêu cầu nhập lại hoặc gửi lại mã xác thực.<br>- Thiếu thông tin bắt buộc theo vai trò: Hệ thống đánh dấu trường lỗi và không cho hoàn tất đăng ký. |
| Pre-Conditions | Người dùng chưa đăng nhập; email thuộc miền hợp lệ của nhà trường; dịch vụ gửi email hoạt động. |
| Post-Condition | Tài khoản mới được tạo; người dùng được đăng nhập vào hệ thống với hồ sơ ban đầu. |

## UC02 - Đăng nhập bằng email trường

| Trường | Nội dung |
|---|---|
| Name of Use Case | Đăng nhập bằng email trường |
| Use Case ID | UC02 |
| Brief Description | Người dùng sử dụng email trường và mật khẩu đã đăng ký để xác thực danh tính và truy cập hệ thống. |
| Actor(s) | Người dùng |
| Trigger | Người dùng chọn chức năng đăng nhập. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở màn hình đăng nhập.<br>2. Người dùng nhập email trường và mật khẩu.<br>3. Hệ thống kiểm tra thông tin đầu vào.<br>4. Hệ thống tìm tài khoản tương ứng với email.<br>5. Hệ thống đối chiếu mật khẩu đã nhập với mật khẩu đã mã hóa.<br>6. Hệ thống kiểm tra trạng thái khóa của tài khoản.<br>7. Nếu hợp lệ, hệ thống tạo phiên đăng nhập cho người dùng.<br>8. Người dùng được chuyển đến trang chính.<br><br>**Alternate Flows:**<br>- Email hoặc mật khẩu sai: Hệ thống thông báo thông tin đăng nhập không hợp lệ.<br>- Tài khoản bị khóa: Hệ thống từ chối đăng nhập và yêu cầu liên hệ quản trị viên.<br>- Thiếu dữ liệu: Hệ thống yêu cầu nhập đầy đủ email và mật khẩu. |
| Pre-Conditions | Người dùng đã có tài khoản hợp lệ trong hệ thống. |
| Post-Condition | Người dùng đăng nhập thành công và có quyền sử dụng các chức năng phù hợp với vai trò. |

## UC03 - Đăng xuất

| Trường | Nội dung |
|---|---|
| Name of Use Case | Đăng xuất |
| Use Case ID | UC03 |
| Brief Description | Người dùng kết thúc phiên làm việc hiện tại và rời khỏi hệ thống một cách an toàn. |
| Actor(s) | Người dùng |
| Trigger | Người dùng chọn chức năng đăng xuất. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng chọn nút đăng xuất trên giao diện.<br>2. Hệ thống xóa thông tin phiên đăng nhập ở phía client.<br>3. Hệ thống đóng hoặc làm mới các trạng thái giao tiếp thời gian thực nếu có.<br>4. Người dùng được chuyển về màn hình đăng nhập.<br><br>**Alternate Flows:**<br>- Phiên đăng nhập đã hết hạn: Hệ thống tự động đưa người dùng về màn hình đăng nhập.<br>- Lỗi trạng thái phía client: Hệ thống vẫn xóa dữ liệu phiên cục bộ và yêu cầu đăng nhập lại. |
| Pre-Conditions | Người dùng đang đăng nhập vào hệ thống. |
| Post-Condition | Phiên làm việc kết thúc; người dùng không còn truy cập được chức năng yêu cầu xác thực cho đến khi đăng nhập lại. |

## UC04 - Đổi mật khẩu

| Trường | Nội dung |
|---|---|
| Name of Use Case | Đổi mật khẩu |
| Use Case ID | UC04 |
| Brief Description | Người dùng thay đổi mật khẩu hiện tại nhằm nâng cao bảo mật tài khoản cá nhân. |
| Actor(s) | Người dùng |
| Trigger | Người dùng chọn chức năng đổi mật khẩu trong phần cài đặt tài khoản. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở mục đổi mật khẩu.<br>2. Người dùng nhập mật khẩu hiện tại và mật khẩu mới.<br>3. Hệ thống kiểm tra tính đầy đủ của dữ liệu.<br>4. Hệ thống xác minh mật khẩu hiện tại.<br>5. Hệ thống kiểm tra chính sách mật khẩu mới.<br>6. Hệ thống mã hóa mật khẩu mới và cập nhật vào cơ sở dữ liệu.<br>7. Hệ thống thông báo đổi mật khẩu thành công.<br><br>**Alternate Flows:**<br>- Mật khẩu hiện tại không đúng: Hệ thống từ chối cập nhật.<br>- Mật khẩu mới không đạt yêu cầu: Hệ thống yêu cầu nhập mật khẩu khác.<br>- Thiếu dữ liệu: Hệ thống yêu cầu nhập đầy đủ thông tin. |
| Pre-Conditions | Người dùng đã đăng nhập và tài khoản đang hoạt động. |
| Post-Condition | Mật khẩu mới được lưu an toàn; mật khẩu cũ không còn hiệu lực. |

## UC05 - Cập nhật thông tin cá nhân

| Trường | Nội dung |
|---|---|
| Name of Use Case | Cập nhật thông tin cá nhân |
| Use Case ID | UC05 |
| Brief Description | Người dùng chỉnh sửa thông tin hồ sơ cá nhân như họ tên, ảnh đại diện, ảnh bìa, giới thiệu và thông tin học vụ phù hợp với vai trò. |
| Actor(s) | Người dùng |
| Trigger | Người dùng chọn chỉnh sửa hồ sơ hoặc cài đặt tài khoản. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở màn hình cập nhật hồ sơ.<br>2. Hệ thống hiển thị thông tin hiện tại của người dùng.<br>3. Người dùng chỉnh sửa các trường cần thay đổi.<br>4. Nếu có ảnh mới, hệ thống tải tài nguyên lên dịch vụ lưu trữ đám mây.<br>5. Hệ thống kiểm tra dữ liệu hồ sơ theo vai trò.<br>6. Hệ thống cập nhật thông tin vào cơ sở dữ liệu.<br>7. Hệ thống trả về hồ sơ mới và hiển thị trên giao diện.<br><br>**Alternate Flows:**<br>- Dữ liệu không hợp lệ: Hệ thống thông báo lỗi tương ứng.<br>- Tải ảnh thất bại: Hệ thống yêu cầu thử lại hoặc bỏ qua ảnh mới.<br>- Người dùng không có quyền sửa tài khoản mục tiêu: Hệ thống từ chối thao tác. |
| Pre-Conditions | Người dùng đã đăng nhập. |
| Post-Condition | Hồ sơ người dùng được cập nhật và đồng bộ trên giao diện. |

## UC06 - Đăng bài viết

| Trường | Nội dung |
|---|---|
| Name of Use Case | Đăng bài viết |
| Use Case ID | UC06 |
| Brief Description | Người dùng tạo bài viết mới để chia sẻ nội dung trong dòng thời gian cá nhân hoặc không gian phù hợp. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng nhập nội dung và chọn đăng bài. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở khung soạn bài viết.<br>2. Người dùng nhập nội dung, chọn phạm vi hiển thị và có thể đính kèm media.<br>3. Hệ thống kiểm tra nội dung bài viết.<br>4. Hệ thống tải các tệp đính kèm lên dịch vụ lưu trữ nếu có.<br>5. Hệ thống tạo bản ghi bài viết và liên kết media tương ứng.<br>6. Bài viết mới được hiển thị trên giao diện.<br><br>**Alternate Flows:**<br>- Nội dung rỗng và không có media: Hệ thống không cho đăng.<br>- Media không hợp lệ hoặc tải lên thất bại: Hệ thống thông báo lỗi.<br>- Phiên đăng nhập không hợp lệ: Hệ thống yêu cầu đăng nhập lại. |
| Pre-Conditions | Người dùng đã đăng nhập và tài khoản đang hoạt động. |
| Post-Condition | Bài viết mới được lưu và hiển thị theo phạm vi đã chọn. |

## UC07 - Chỉnh sửa bài viết

| Trường | Nội dung |
|---|---|
| Name of Use Case | Chỉnh sửa bài viết |
| Use Case ID | UC07 |
| Brief Description | Người dùng cập nhật nội dung, phạm vi hiển thị hoặc media của bài viết do mình tạo. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn chỉnh sửa trên bài viết của mình. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở chức năng chỉnh sửa bài viết.<br>2. Hệ thống hiển thị dữ liệu hiện tại của bài viết.<br>3. Người dùng thay đổi nội dung, phạm vi hiển thị hoặc media.<br>4. Hệ thống kiểm tra quyền sở hữu bài viết.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>6. Hệ thống cập nhật bài viết trong cơ sở dữ liệu.<br>7. Giao diện hiển thị nội dung đã được cập nhật.<br><br>**Alternate Flows:**<br>- Người dùng không phải tác giả: Hệ thống từ chối thao tác.<br>- Bài viết không tồn tại: Hệ thống thông báo lỗi.<br>- Dữ liệu chỉnh sửa không hợp lệ: Hệ thống yêu cầu điều chỉnh. |
| Pre-Conditions | Người dùng đã đăng nhập; bài viết tồn tại và thuộc quyền chỉnh sửa của người dùng. |
| Post-Condition | Bài viết được cập nhật thành công. |

## UC08 - Xóa bài viết

| Trường | Nội dung |
|---|---|
| Name of Use Case | Xóa bài viết |
| Use Case ID | UC08 |
| Brief Description | Người dùng xóa bài viết do mình tạo khỏi hệ thống. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn xóa bài viết. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng chọn chức năng xóa bài viết.<br>2. Hệ thống hiển thị xác nhận thao tác.<br>3. Người dùng xác nhận xóa.<br>4. Hệ thống kiểm tra quyền sở hữu bài viết.<br>5. Hệ thống xóa bài viết và dữ liệu liên quan.<br>6. Bài viết không còn hiển thị trên giao diện.<br><br>**Alternate Flows:**<br>- Người dùng hủy xác nhận: Hệ thống giữ nguyên bài viết.<br>- Người dùng không có quyền: Hệ thống từ chối thao tác.<br>- Bài viết không tồn tại: Hệ thống thông báo lỗi. |
| Pre-Conditions | Người dùng đã đăng nhập; bài viết tồn tại. |
| Post-Condition | Bài viết bị xóa khỏi hệ thống hoặc không còn hiển thị với người dùng. |

## UC09 - Đăng bình chọn

| Trường | Nội dung |
|---|---|
| Name of Use Case | Đăng bình chọn |
| Use Case ID | UC09 |
| Brief Description | Người dùng tạo bài viết dạng khảo sát với nhiều phương án để thu thập ý kiến từ cộng đồng. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn tạo bình chọn trong khung đăng bài. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở chức năng tạo bình chọn.<br>2. Người dùng nhập câu hỏi, các lựa chọn và thiết lập liên quan.<br>3. Hệ thống kiểm tra số lượng lựa chọn tối thiểu.<br>4. Hệ thống tạo bài viết dạng bình chọn.<br>5. Hệ thống lưu các phương án bình chọn.<br>6. Bình chọn được hiển thị để người dùng khác tham gia.<br><br>**Alternate Flows:**<br>- Thiếu câu hỏi hoặc lựa chọn: Hệ thống yêu cầu bổ sung.<br>- Số lượng lựa chọn không hợp lệ: Hệ thống từ chối tạo bình chọn.<br>- Thời hạn bình chọn không hợp lệ: Hệ thống yêu cầu điều chỉnh. |
| Pre-Conditions | Người dùng đã đăng nhập. |
| Post-Condition | Bài viết bình chọn được tạo và sẵn sàng nhận phản hồi. |

## UC10 - Bình chọn

| Trường | Nội dung |
|---|---|
| Name of Use Case | Bình chọn |
| Use Case ID | UC10 |
| Brief Description | Người dùng lựa chọn một hoặc nhiều phương án trong bài khảo sát tùy theo cấu hình của bình chọn. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn phương án và gửi bình chọn. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng xem bài viết có bình chọn.<br>2. Người dùng chọn phương án phù hợp.<br>3. Hệ thống kiểm tra trạng thái và thời hạn bình chọn.<br>4. Hệ thống kiểm tra số lượng lựa chọn theo cấu hình.<br>5. Hệ thống lưu phiếu bình chọn của người dùng.<br>6. Hệ thống cập nhật và hiển thị kết quả mới.<br><br>**Alternate Flows:**<br>- Bình chọn đã hết hạn: Hệ thống không cho gửi phiếu mới.<br>- Lựa chọn không hợp lệ: Hệ thống từ chối ghi nhận.<br>- Người dùng thay đổi phiếu: Hệ thống cập nhật lựa chọn theo quy tắc của bình chọn. |
| Pre-Conditions | Người dùng đã đăng nhập; bài bình chọn tồn tại và còn hiệu lực. |
| Post-Condition | Phiếu bình chọn được ghi nhận và kết quả được cập nhật. |

## UC11 - Thích bài viết

| Trường | Nội dung |
|---|---|
| Name of Use Case | Thích bài viết |
| Use Case ID | UC11 |
| Brief Description | Người dùng thể hiện sự quan tâm đối với một bài viết thông qua thao tác thích hoặc bỏ thích. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn biểu tượng thích trên bài viết. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng xem bài viết trên giao diện.<br>2. Người dùng chọn thích bài viết.<br>3. Hệ thống kiểm tra trạng thái thích hiện tại.<br>4. Nếu chưa thích, hệ thống tạo lượt thích mới.<br>5. Nếu đã thích, hệ thống hủy lượt thích hiện tại.<br>6. Hệ thống cập nhật số lượt thích trên giao diện.<br><br>**Alternate Flows:**<br>- Bài viết không tồn tại: Hệ thống thông báo lỗi.<br>- Phiên đăng nhập hết hạn: Hệ thống yêu cầu đăng nhập lại.<br>- Lỗi cập nhật: Hệ thống khôi phục trạng thái trước đó trên giao diện. |
| Pre-Conditions | Người dùng đã đăng nhập; bài viết tồn tại và có thể tương tác. |
| Post-Condition | Trạng thái thích và số lượt thích được cập nhật. |

## UC12 - Bình luận trong bài viết

| Trường | Nội dung |
|---|---|
| Name of Use Case | Bình luận trong bài viết |
| Use Case ID | UC12 |
| Brief Description | Người dùng gửi nội dung phản hồi dưới bài viết, có thể kèm media hoặc phản hồi một bình luận khác. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng nhập bình luận và chọn gửi. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở khu vực bình luận của bài viết.<br>2. Hệ thống hiển thị danh sách bình luận hiện có.<br>3. Người dùng nhập nội dung bình luận.<br>4. Hệ thống kiểm tra nội dung và tệp đính kèm nếu có.<br>5. Hệ thống lưu bình luận mới.<br>6. Hệ thống gửi thông báo đến chủ bài viết hoặc người được phản hồi nếu phù hợp.<br>7. Bình luận mới được hiển thị trên giao diện.<br><br>**Alternate Flows:**<br>- Nội dung bình luận rỗng: Hệ thống không cho gửi.<br>- Bài viết không tồn tại: Hệ thống thông báo lỗi.<br>- Tệp đính kèm không hợp lệ: Hệ thống yêu cầu chọn lại. |
| Pre-Conditions | Người dùng đã đăng nhập; bài viết tồn tại. |
| Post-Condition | Bình luận được lưu và hiển thị dưới bài viết. |

## UC13 - Chia sẻ bài viết

| Trường | Nội dung |
|---|---|
| Name of Use Case | Chia sẻ bài viết |
| Use Case ID | UC13 |
| Brief Description | Người dùng chia sẻ một bài viết đến trang cá nhân hoặc nhóm kèm nội dung cảm nghĩ và phạm vi hiển thị. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn chức năng chia sẻ trên bài viết. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở hộp thoại chia sẻ bài viết.<br>2. Người dùng nhập nội dung chia sẻ nếu có.<br>3. Người dùng chọn phạm vi hiển thị hoặc nhóm nhận bài chia sẻ.<br>4. Hệ thống kiểm tra quyền truy cập bài viết gốc.<br>5. Hệ thống tạo bản ghi chia sẻ.<br>6. Hệ thống cập nhật số lượt chia sẻ và hiển thị bài chia sẻ.<br><br>**Alternate Flows:**<br>- Bài viết gốc không tồn tại: Hệ thống thông báo lỗi.<br>- Người dùng không có quyền xem bài viết gốc: Hệ thống không cho chia sẻ.<br>- Chia sẻ trùng lặp không được cho phép: Hệ thống thông báo trạng thái đã chia sẻ. |
| Pre-Conditions | Người dùng đã đăng nhập; bài viết có thể được chia sẻ. |
| Post-Condition | Bài viết được chia sẻ theo phạm vi người dùng đã chọn. |

## UC14 - Gửi tin nhắn

| Trường | Nội dung |
|---|---|
| Name of Use Case | Gửi tin nhắn |
| Use Case ID | UC14 |
| Brief Description | Người dùng gửi tin nhắn văn bản hoặc tệp đính kèm trong hội thoại cá nhân hoặc nhóm. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng nhập nội dung và chọn gửi tin nhắn. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở cuộc trò chuyện.<br>2. Hệ thống hiển thị lịch sử tin nhắn.<br>3. Người dùng nhập nội dung hoặc chọn tệp đính kèm.<br>4. Hệ thống kiểm tra quyền nhắn tin và dữ liệu gửi.<br>5. Hệ thống lưu tin nhắn mới.<br>6. Hệ thống gửi thông báo thời gian thực đến người nhận hoặc nhóm.<br>7. Tin nhắn hiển thị trong khung trò chuyện.<br><br>**Alternate Flows:**<br>- Nội dung rỗng và không có tệp: Hệ thống không cho gửi.<br>- Người nhận không hợp lệ hoặc đã chặn tương tác: Hệ thống từ chối gửi.<br>- Tệp đính kèm lỗi: Hệ thống thông báo tải lên thất bại. |
| Pre-Conditions | Người dùng đã đăng nhập; người nhận hoặc nhóm trò chuyện tồn tại. |
| Post-Condition | Tin nhắn được lưu và chuyển đến người nhận. |

## UC15 - Thu hồi tin nhắn

| Trường | Nội dung |
|---|---|
| Name of Use Case | Thu hồi tin nhắn |
| Use Case ID | UC15 |
| Brief Description | Người gửi thu hồi tin nhắn đã gửi để nội dung không còn hiển thị trong cuộc trò chuyện. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn thu hồi trên tin nhắn đã gửi. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở menu thao tác của tin nhắn.<br>2. Người dùng chọn thu hồi tin nhắn.<br>3. Hệ thống kiểm tra quyền sở hữu tin nhắn.<br>4. Hệ thống cập nhật trạng thái tin nhắn thành đã thu hồi.<br>5. Hệ thống gửi sự kiện cập nhật đến các bên liên quan.<br>6. Giao diện thay thế nội dung tin nhắn bằng trạng thái đã thu hồi.<br><br>**Alternate Flows:**<br>- Người dùng không phải người gửi: Hệ thống từ chối thao tác.<br>- Tin nhắn không tồn tại: Hệ thống thông báo lỗi.<br>- Tin nhắn đã thu hồi trước đó: Hệ thống giữ nguyên trạng thái hiện tại. |
| Pre-Conditions | Người dùng đã đăng nhập; tin nhắn tồn tại và thuộc về người gửi. |
| Post-Condition | Tin nhắn được đánh dấu đã thu hồi trong hệ thống. |

## UC16 - Gửi lời mời kết bạn

| Trường | Nội dung |
|---|---|
| Name of Use Case | Gửi lời mời kết bạn |
| Use Case ID | UC16 |
| Brief Description | Người dùng gửi yêu cầu kết nối đến một người dùng khác trong hệ thống. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn kết bạn trên hồ sơ người khác. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng truy cập hồ sơ người muốn kết nối.<br>2. Người dùng chọn gửi lời mời kết bạn.<br>3. Hệ thống kiểm tra quan hệ hiện tại giữa hai tài khoản.<br>4. Hệ thống tạo yêu cầu kết bạn ở trạng thái chờ xác nhận.<br>5. Hệ thống gửi thông báo đến người nhận.<br>6. Giao diện cập nhật trạng thái thành đang chờ phản hồi.<br><br>**Alternate Flows:**<br>- Người dùng gửi lời mời cho chính mình: Hệ thống từ chối.<br>- Hai người đã là bạn bè: Hệ thống thông báo quan hệ đã tồn tại.<br>- Đã có lời mời đang chờ: Hệ thống không tạo trùng lặp. |
| Pre-Conditions | Người dùng đã đăng nhập; tài khoản mục tiêu tồn tại. |
| Post-Condition | Lời mời kết bạn được tạo và chờ người nhận xử lý. |

## UC17 - Chấp nhận kết bạn

| Trường | Nội dung |
|---|---|
| Name of Use Case | Chấp nhận kết bạn |
| Use Case ID | UC17 |
| Brief Description | Người dùng chấp nhận lời mời kết bạn để thiết lập quan hệ bạn bè chính thức. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn chấp nhận một lời mời kết bạn đang chờ. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở danh sách lời mời kết bạn.<br>2. Người dùng chọn chấp nhận lời mời.<br>3. Hệ thống kiểm tra lời mời có thuộc người dùng hiện tại hay không.<br>4. Hệ thống cập nhật trạng thái quan hệ thành đã chấp nhận.<br>5. Hệ thống gửi thông báo đến người gửi lời mời.<br>6. Hai tài khoản xuất hiện trong danh sách bạn bè của nhau.<br><br>**Alternate Flows:**<br>- Lời mời không tồn tại: Hệ thống thông báo lỗi.<br>- Lời mời không thuộc người dùng hiện tại: Hệ thống từ chối thao tác.<br>- Lời mời đã được xử lý: Hệ thống hiển thị trạng thái hiện tại. |
| Pre-Conditions | Người dùng đã đăng nhập; tồn tại lời mời kết bạn đang chờ. |
| Post-Condition | Quan hệ bạn bè được thiết lập giữa hai người dùng. |

## UC18 - Hủy kết bạn

| Trường | Nội dung |
|---|---|
| Name of Use Case | Hủy kết bạn |
| Use Case ID | UC18 |
| Brief Description | Người dùng chấm dứt quan hệ bạn bè với một tài khoản khác. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn hủy kết bạn. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở danh sách bạn bè hoặc hồ sơ bạn bè.<br>2. Người dùng chọn hủy kết bạn.<br>3. Hệ thống yêu cầu xác nhận thao tác.<br>4. Người dùng xác nhận.<br>5. Hệ thống kiểm tra quan hệ bạn bè hiện tại.<br>6. Hệ thống xóa hoặc cập nhật quan hệ bạn bè.<br>7. Giao diện cập nhật trạng thái quan hệ giữa hai tài khoản.<br><br>**Alternate Flows:**<br>- Người dùng hủy xác nhận: Hệ thống không thay đổi dữ liệu.<br>- Quan hệ bạn bè không tồn tại: Hệ thống thông báo lỗi.<br>- Phiên đăng nhập hết hạn: Hệ thống yêu cầu đăng nhập lại. |
| Pre-Conditions | Người dùng đã đăng nhập; hai tài khoản đang là bạn bè. |
| Post-Condition | Quan hệ bạn bè giữa hai tài khoản bị hủy. |

## UC19 - Xem thông báo

| Trường | Nội dung |
|---|---|
| Name of Use Case | Xem thông báo |
| Use Case ID | UC19 |
| Brief Description | Người dùng xem các thông báo phát sinh từ tương tác cá nhân, nhóm hoặc hệ thống. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng mở khu vực thông báo. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở danh sách thông báo.<br>2. Hệ thống tải các thông báo mới nhất của người dùng.<br>3. Hệ thống hiển thị nội dung, thời gian và trạng thái đọc của từng thông báo.<br>4. Người dùng chọn một thông báo để xem chi tiết hoặc điều hướng đến đối tượng liên quan.<br>5. Hệ thống cập nhật trạng thái đã đọc nếu cần.<br><br>**Alternate Flows:**<br>- Không có thông báo: Hệ thống hiển thị trạng thái rỗng.<br>- Thông báo trỏ đến đối tượng đã bị xóa: Hệ thống thông báo nội dung không còn tồn tại.<br>- Lỗi tải dữ liệu: Hệ thống cho phép thử lại. |
| Pre-Conditions | Người dùng đã đăng nhập. |
| Post-Condition | Danh sách thông báo được hiển thị; trạng thái đọc được cập nhật khi người dùng xem. |

## UC20 - Tìm kiếm

| Trường | Nội dung |
|---|---|
| Name of Use Case | Tìm kiếm |
| Use Case ID | UC20 |
| Brief Description | Người dùng tìm kiếm tài khoản, bài viết hoặc nhóm dựa trên từ khóa nhập vào. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng nhập từ khóa vào ô tìm kiếm. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng nhập từ khóa tìm kiếm.<br>2. Hệ thống kiểm tra và chuẩn hóa từ khóa.<br>3. Hệ thống truy vấn dữ liệu người dùng, bài viết hoặc nhóm phù hợp.<br>4. Hệ thống sắp xếp và giới hạn kết quả trả về.<br>5. Giao diện hiển thị kết quả theo từng nhóm nội dung.<br>6. Người dùng chọn một kết quả để xem chi tiết.<br><br>**Alternate Flows:**<br>- Từ khóa rỗng: Hệ thống hiển thị gợi ý hoặc danh sách mặc định.<br>- Không có kết quả: Hệ thống thông báo không tìm thấy dữ liệu phù hợp.<br>- Lỗi truy vấn: Hệ thống hiển thị thông báo lỗi và cho phép tìm lại. |
| Pre-Conditions | Người dùng đã đăng nhập hoặc có quyền truy cập chức năng tìm kiếm. |
| Post-Condition | Kết quả tìm kiếm được hiển thị theo từ khóa người dùng nhập. |

## UC21 - Tạo nhóm

| Trường | Nội dung |
|---|---|
| Name of Use Case | Tạo nhóm |
| Use Case ID | UC21 |
| Brief Description | Người dùng tạo một nhóm mới để tổ chức trao đổi, sinh hoạt hoặc quản lý thành viên theo một chủ đề, lớp hoặc đơn vị cụ thể. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn chức năng tạo nhóm. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở biểu mẫu tạo nhóm.<br>2. Người dùng nhập tên nhóm, mô tả, ảnh đại diện và chế độ riêng tư nếu có.<br>3. Hệ thống kiểm tra thông tin bắt buộc.<br>4. Hệ thống tạo nhóm mới.<br>5. Hệ thống gán người tạo làm chủ nhóm.<br>6. Nhóm mới được hiển thị trong danh sách nhóm của người dùng.<br><br>**Alternate Flows:**<br>- Tên nhóm bị bỏ trống: Hệ thống yêu cầu nhập tên nhóm.<br>- Dữ liệu không hợp lệ: Hệ thống từ chối tạo nhóm.<br>- Lỗi lưu dữ liệu: Hệ thống thông báo tạo nhóm thất bại. |
| Pre-Conditions | Người dùng đã đăng nhập. |
| Post-Condition | Nhóm mới được tạo; người tạo trở thành quản trị viên cao nhất của nhóm. |

## UC22 - Xin vào nhóm

| Trường | Nội dung |
|---|---|
| Name of Use Case | Xin vào nhóm |
| Use Case ID | UC22 |
| Brief Description | Người dùng gửi yêu cầu tham gia nhóm hoặc tham gia trực tiếp tùy theo cấu hình của nhóm. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn tham gia nhóm. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng truy cập trang chi tiết nhóm.<br>2. Người dùng chọn tham gia nhóm.<br>3. Hệ thống kiểm tra trạng thái thành viên và điều kiện tham gia.<br>4. Nếu nhóm cho phép vào trực tiếp, hệ thống thêm người dùng vào nhóm.<br>5. Nếu nhóm cần xét duyệt, hệ thống tạo yêu cầu gia nhập ở trạng thái chờ.<br>6. Giao diện hiển thị trạng thái tham gia tương ứng.<br><br>**Alternate Flows:**<br>- Người dùng đã là thành viên: Hệ thống thông báo trạng thái hiện tại.<br>- Người dùng bị cấm khỏi nhóm: Hệ thống từ chối tham gia.<br>- Nhóm không tồn tại: Hệ thống thông báo lỗi. |
| Pre-Conditions | Người dùng đã đăng nhập; nhóm tồn tại. |
| Post-Condition | Người dùng trở thành thành viên nhóm hoặc có yêu cầu gia nhập đang chờ duyệt. |

## UC23 - Xóa nhóm

| Trường | Nội dung |
|---|---|
| Name of Use Case | Xóa nhóm |
| Use Case ID | UC23 |
| Brief Description | Chủ nhóm hoặc người có quyền quản lý xóa nhóm khỏi hệ thống khi nhóm không còn cần sử dụng. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn chức năng xóa nhóm. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở trang quản lý nhóm.<br>2. Người dùng chọn xóa nhóm.<br>3. Hệ thống yêu cầu xác nhận thao tác.<br>4. Người dùng xác nhận xóa.<br>5. Hệ thống kiểm tra quyền quản lý nhóm.<br>6. Hệ thống xóa nhóm và các dữ liệu liên quan theo quy tắc hệ thống.<br>7. Người dùng được chuyển về danh sách nhóm.<br><br>**Alternate Flows:**<br>- Người dùng không có quyền xóa nhóm: Hệ thống từ chối thao tác.<br>- Người dùng hủy xác nhận: Nhóm được giữ nguyên.<br>- Nhóm không tồn tại: Hệ thống thông báo lỗi. |
| Pre-Conditions | Người dùng đã đăng nhập; nhóm tồn tại và người dùng có quyền xóa. |
| Post-Condition | Nhóm bị xóa hoặc không còn hiển thị trong hệ thống. |

## UC24 - Rời nhóm

| Trường | Nội dung |
|---|---|
| Name of Use Case | Rời nhóm |
| Use Case ID | UC24 |
| Brief Description | Thành viên chủ động rời khỏi nhóm mà mình đang tham gia. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn chức năng rời nhóm. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở trang nhóm đang tham gia.<br>2. Người dùng chọn rời nhóm.<br>3. Hệ thống yêu cầu xác nhận.<br>4. Người dùng xác nhận thao tác.<br>5. Hệ thống kiểm tra tư cách thành viên.<br>6. Hệ thống xóa hoặc cập nhật trạng thái thành viên của người dùng trong nhóm.<br>7. Giao diện cập nhật trạng thái không còn là thành viên.<br><br>**Alternate Flows:**<br>- Người dùng không phải thành viên: Hệ thống thông báo lỗi.<br>- Người dùng là chủ nhóm duy nhất: Hệ thống có thể yêu cầu chuyển quyền trước khi rời.<br>- Người dùng hủy xác nhận: Hệ thống giữ nguyên dữ liệu. |
| Pre-Conditions | Người dùng đã đăng nhập và đang là thành viên nhóm. |
| Post-Condition | Người dùng không còn là thành viên của nhóm. |

## UC25 - Phê duyệt thành viên

| Trường | Nội dung |
|---|---|
| Name of Use Case | Phê duyệt thành viên |
| Use Case ID | UC25 |
| Brief Description | Người quản lý nhóm xét duyệt các yêu cầu tham gia nhóm đang chờ xử lý. |
| Actor(s) | Sinh viên |
| Trigger | Người quản lý mở danh sách yêu cầu tham gia nhóm. |
| Flow of Events | **Basic Flow:**<br>1. Người quản lý mở trang quản trị thành viên nhóm.<br>2. Hệ thống hiển thị danh sách yêu cầu tham gia đang chờ.<br>3. Người quản lý chọn một yêu cầu và phê duyệt.<br>4. Hệ thống kiểm tra quyền quản lý của người thực hiện.<br>5. Hệ thống cập nhật trạng thái yêu cầu thành đã duyệt.<br>6. Hệ thống thêm người gửi yêu cầu vào danh sách thành viên nhóm.<br>7. Hệ thống gửi thông báo kết quả cho người được duyệt.<br><br>**Alternate Flows:**<br>- Người thực hiện không có quyền duyệt: Hệ thống từ chối thao tác.<br>- Yêu cầu đã được xử lý: Hệ thống thông báo trạng thái hiện tại.<br>- Thành viên đã tồn tại trong nhóm: Hệ thống không tạo trùng lặp. |
| Pre-Conditions | Người dùng đã đăng nhập; có quyền quản lý nhóm; tồn tại yêu cầu tham gia đang chờ. |
| Post-Condition | Người được duyệt trở thành thành viên nhóm. |

## UC26 - Xóa thành viên trong nhóm

| Trường | Nội dung |
|---|---|
| Name of Use Case | Xóa thành viên trong nhóm |
| Use Case ID | UC26 |
| Brief Description | Người quản lý nhóm loại một thành viên khỏi nhóm khi cần thiết. |
| Actor(s) | Sinh viên |
| Trigger | Người quản lý chọn xóa thành viên trong danh sách nhóm. |
| Flow of Events | **Basic Flow:**<br>1. Người quản lý mở danh sách thành viên nhóm.<br>2. Người quản lý chọn thành viên cần xóa.<br>3. Hệ thống yêu cầu xác nhận thao tác.<br>4. Người quản lý xác nhận.<br>5. Hệ thống kiểm tra quyền quản lý và vai trò của thành viên mục tiêu.<br>6. Hệ thống xóa thành viên khỏi nhóm hoặc cập nhật trạng thái thành viên.<br>7. Danh sách thành viên được làm mới.<br><br>**Alternate Flows:**<br>- Người thực hiện không có quyền: Hệ thống từ chối thao tác.<br>- Thành viên mục tiêu không tồn tại: Hệ thống thông báo lỗi.<br>- Không được xóa chủ nhóm hoặc người có quyền cao hơn: Hệ thống từ chối thao tác. |
| Pre-Conditions | Người dùng đã đăng nhập; có quyền quản lý nhóm. |
| Post-Condition | Thành viên mục tiêu không còn thuộc nhóm. |

## UC27 - Báo cáo người dùng

| Trường | Nội dung |
|---|---|
| Name of Use Case | Báo cáo người dùng |
| Use Case ID | UC27 |
| Brief Description | Người dùng gửi báo cáo về tài khoản có hành vi vi phạm quy định cộng đồng hoặc ảnh hưởng tiêu cực đến môi trường học đường. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn báo cáo trên hồ sơ người dùng khác. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng mở hồ sơ tài khoản cần báo cáo.<br>2. Người dùng chọn chức năng báo cáo.<br>3. Hệ thống hiển thị biểu mẫu báo cáo.<br>4. Người dùng chọn lý do và nhập mô tả bổ sung nếu cần.<br>5. Hệ thống kiểm tra dữ liệu báo cáo.<br>6. Hệ thống lưu báo cáo ở trạng thái chờ xử lý.<br>7. Hệ thống thông báo gửi báo cáo thành công.<br><br>**Alternate Flows:**<br>- Thiếu lý do báo cáo: Hệ thống yêu cầu chọn lý do.<br>- Báo cáo trùng đang chờ xử lý: Hệ thống thông báo đã tiếp nhận trước đó.<br>- Tài khoản mục tiêu không tồn tại: Hệ thống thông báo lỗi. |
| Pre-Conditions | Người dùng đã đăng nhập; tài khoản bị báo cáo tồn tại. |
| Post-Condition | Báo cáo người dùng được lưu để quản trị viên xử lý. |

## UC28 - Báo cáo bài viết

| Trường | Nội dung |
|---|---|
| Name of Use Case | Báo cáo bài viết |
| Use Case ID | UC28 |
| Brief Description | Người dùng gửi báo cáo về bài viết có nội dung không phù hợp, sai lệch hoặc vi phạm quy định cộng đồng. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn báo cáo trên bài viết. |
| Flow of Events | **Basic Flow:**<br>1. Người dùng xem bài viết cần báo cáo.<br>2. Người dùng chọn chức năng báo cáo bài viết.<br>3. Hệ thống hiển thị biểu mẫu báo cáo.<br>4. Người dùng chọn lý do và nhập mô tả nếu cần.<br>5. Hệ thống kiểm tra thông tin báo cáo.<br>6. Hệ thống lưu báo cáo và snapshot nội dung liên quan nếu có.<br>7. Hệ thống thông báo gửi báo cáo thành công.<br><br>**Alternate Flows:**<br>- Bài viết đã bị xóa: Hệ thống thông báo nội dung không tồn tại.<br>- Thiếu lý do báo cáo: Hệ thống yêu cầu bổ sung.<br>- Báo cáo trùng lặp: Hệ thống thông báo đã tiếp nhận báo cáo trước đó. |
| Pre-Conditions | Người dùng đã đăng nhập; bài viết tồn tại. |
| Post-Condition | Báo cáo bài viết được ghi nhận để quản trị viên xem xét. |

## UC29 - Thêm sinh viên vào nhóm bằng file Excel

| Trường | Nội dung |
|---|---|
| Name of Use Case | Thêm sinh viên vào nhóm bằng file Excel |
| Use Case ID | UC29 |
| Brief Description | Giảng viên hoặc Đoàn khoa nhập danh sách sinh viên từ file Excel để thêm hàng loạt vào nhóm lớp. |
| Actor(s) | Giảng viên, Đoàn khoa |
| Trigger | Người quản lý chọn chức năng nhập danh sách sinh viên bằng file Excel. |
| Flow of Events | **Basic Flow:**<br>1. Người quản lý mở chức năng nhập danh sách sinh viên trong nhóm.<br>2. Người quản lý chọn file Excel chứa cột MSSV.<br>3. Hệ thống kiểm tra quyền quản lý nhóm.<br>4. Hệ thống đọc file và xác định cột mã số sinh viên.<br>5. Hệ thống chuẩn hóa từng MSSV thành email sinh viên.<br>6. Với sinh viên đã có tài khoản, hệ thống thêm vào nhóm nếu chưa là thành viên.<br>7. Với sinh viên chưa có tài khoản, hệ thống ghi nhận hoặc gửi lời mời tham gia.<br>8. Hệ thống trả về thống kê số lượng đã thêm, đã tồn tại, đã mời và lỗi.<br><br>**Alternate Flows:**<br>- File rỗng hoặc sai định dạng: Hệ thống từ chối xử lý.<br>- Không tìm thấy cột MSSV: Hệ thống thông báo lỗi.<br>- Người thực hiện không có quyền quản lý nhóm: Hệ thống từ chối thao tác.<br>- MSSV không hợp lệ: Hệ thống bỏ qua dòng tương ứng hoặc ghi nhận lỗi. |
| Pre-Conditions | Người thực hiện đã đăng nhập; có quyền quản lý nhóm; file Excel có dữ liệu MSSV hợp lệ. |
| Post-Condition | Danh sách sinh viên được xử lý và nhóm được cập nhật thành viên tương ứng. |

## UC30 - Thêm cố vấn học tập vào nhóm

| Trường | Nội dung |
|---|---|
| Name of Use Case | Thêm cố vấn học tập vào nhóm |
| Use Case ID | UC30 |
| Brief Description | Đoàn khoa thêm giảng viên hoặc cố vấn học tập thuộc cùng khoa vào nhóm lớp để phối hợp quản lý. |
| Actor(s) | Đoàn khoa |
| Trigger | Đoàn khoa chọn chức năng thêm cố vấn trong nhóm lớp. |
| Flow of Events | **Basic Flow:**<br>1. Đoàn khoa mở trang quản lý nhóm lớp.<br>2. Hệ thống hiển thị danh sách giảng viên/cố vấn thuộc cùng khoa.<br>3. Đoàn khoa chọn cố vấn cần thêm vào nhóm.<br>4. Hệ thống kiểm tra quyền của người thực hiện.<br>5. Hệ thống kiểm tra vai trò và khoa phụ trách của cố vấn.<br>6. Hệ thống thêm cố vấn vào nhóm với quyền quản lý phù hợp.<br>7. Hệ thống gửi thông báo đến cố vấn được thêm.<br><br>**Alternate Flows:**<br>- Người thực hiện không phải Đoàn khoa hoặc không có quyền nhóm: Hệ thống từ chối thao tác.<br>- Người được chọn không phải cố vấn: Hệ thống thông báo lỗi.<br>- Cố vấn không thuộc cùng khoa: Hệ thống không cho thêm.<br>- Cố vấn đã có trong nhóm: Hệ thống thông báo trạng thái hiện tại. |
| Pre-Conditions | Đoàn khoa đã đăng nhập; nhóm tồn tại; cố vấn có tài khoản hợp lệ. |
| Post-Condition | Cố vấn học tập trở thành thành viên quản lý của nhóm. |

## UC31 - Tạo nhóm bằng file Excel

| Trường | Nội dung |
|---|---|
| Name of Use Case | Tạo nhóm bằng file Excel |
| Use Case ID | UC31 |
| Brief Description | Đoàn khoa tạo nhóm lớp và đồng thời nhập danh sách sinh viên ban đầu từ file Excel. |
| Actor(s) | Đoàn khoa |
| Trigger | Đoàn khoa chọn tạo nhóm và đính kèm file danh sách sinh viên. |
| Flow of Events | **Basic Flow:**<br>1. Đoàn khoa mở biểu mẫu tạo nhóm lớp.<br>2. Đoàn khoa nhập thông tin nhóm và chọn file Excel danh sách sinh viên.<br>3. Hệ thống kiểm tra dữ liệu tạo nhóm.<br>4. Hệ thống tạo nhóm mới và gán Đoàn khoa làm chủ nhóm.<br>5. Hệ thống đọc file Excel và trích xuất MSSV.<br>6. Hệ thống thêm các sinh viên đã có tài khoản vào nhóm.<br>7. Hệ thống xử lý lời mời đối với sinh viên chưa có tài khoản.<br>8. Hệ thống hiển thị kết quả tạo nhóm và nhập danh sách.<br><br>**Alternate Flows:**<br>- Tạo nhóm thành công nhưng xử lý Excel thất bại: Hệ thống giữ nhóm và cho phép nhập lại danh sách sau.<br>- File Excel không hợp lệ: Hệ thống thông báo lỗi xử lý danh sách.<br>- Tên nhóm bị bỏ trống: Hệ thống không cho tạo nhóm. |
| Pre-Conditions | Đoàn khoa đã đăng nhập; có quyền tạo nhóm; file Excel có cấu trúc phù hợp nếu được đính kèm. |
| Post-Condition | Nhóm lớp được tạo; danh sách sinh viên được xử lý theo dữ liệu Excel. |

## UC32 - Gửi thông báo đến các nhóm

| Trường | Nội dung |
|---|---|
| Name of Use Case | Gửi thông báo đến các nhóm |
| Use Case ID | UC32 |
| Brief Description | Giảng viên hoặc Đoàn khoa gửi thông báo chính thức đến một hoặc nhiều nhóm lớp thuộc phạm vi quản lý. |
| Actor(s) | Giảng viên, Đoàn khoa |
| Trigger | Người quản lý chọn chức năng gửi thông báo đến nhóm. |
| Flow of Events | **Basic Flow:**<br>1. Người quản lý mở chức năng gửi thông báo.<br>2. Người quản lý chọn một hoặc nhiều nhóm nhận thông báo.<br>3. Người quản lý nhập nội dung và đính kèm media nếu cần.<br>4. Hệ thống kiểm tra quyền gửi thông báo đối với từng nhóm.<br>5. Hệ thống tạo bài thông báo trong nhóm.<br>6. Hệ thống gửi thông báo đến các thành viên của nhóm.<br>7. Giao diện hiển thị kết quả gửi thông báo.<br><br>**Alternate Flows:**<br>- Chưa chọn nhóm nhận: Hệ thống yêu cầu chọn ít nhất một nhóm.<br>- Người dùng không có quyền với một nhóm: Hệ thống bỏ qua hoặc báo lỗi nhóm đó.<br>- Nội dung thông báo rỗng: Hệ thống không cho gửi. |
| Pre-Conditions | Người thực hiện đã đăng nhập và có quyền quản lý các nhóm được chọn. |
| Post-Condition | Thông báo được đăng vào nhóm và gửi đến thành viên liên quan. |

## UC33 - Gửi thông báo cho các đoàn khoa

| Trường | Nội dung |
|---|---|
| Name of Use Case | Gửi thông báo cho các đoàn khoa |
| Use Case ID | UC33 |
| Brief Description | Đoàn Trường gửi thông tin hoặc thông báo đến các tài khoản Đoàn khoa nhằm triển khai hoạt động theo tuyến quản lý. |
| Actor(s) | Đoàn Trường |
| Trigger | Đoàn Trường chọn chức năng gửi thông báo đến Đoàn khoa. |
| Flow of Events | **Basic Flow:**<br>1. Đoàn Trường mở chức năng gửi thông báo cấp trường.<br>2. Hệ thống tải danh sách các Đoàn khoa.<br>3. Đoàn Trường chọn đơn vị nhận thông báo.<br>4. Đoàn Trường nhập nội dung và tệp đính kèm nếu có.<br>5. Hệ thống kiểm tra quyền của tài khoản Đoàn Trường.<br>6. Hệ thống gửi thông báo hoặc tin nhắn đến các Đoàn khoa được chọn.<br>7. Hệ thống hiển thị thống kê gửi thành công và thất bại.<br><br>**Alternate Flows:**<br>- Người thực hiện không phải Đoàn Trường: Hệ thống từ chối truy cập danh sách Đoàn khoa.<br>- Không chọn người nhận: Hệ thống yêu cầu chọn ít nhất một đơn vị.<br>- Một số người nhận lỗi: Hệ thống tiếp tục gửi các người nhận còn lại và ghi nhận thất bại. |
| Pre-Conditions | Đoàn Trường đã đăng nhập; tồn tại danh sách tài khoản Đoàn khoa. |
| Post-Condition | Thông báo được gửi đến các Đoàn khoa được chọn. |

## UC34 - Phê duyệt báo cáo người dùng

| Trường | Nội dung |
|---|---|
| Name of Use Case | Phê duyệt báo cáo người dùng |
| Use Case ID | UC34 |
| Brief Description | Quản trị viên xem xét, đánh giá và xử lý các báo cáo liên quan đến tài khoản người dùng. |
| Actor(s) | Admin |
| Trigger | Admin mở trung tâm xử lý báo cáo. |
| Flow of Events | **Basic Flow:**<br>1. Admin mở danh sách báo cáo đang chờ xử lý.<br>2. Hệ thống hiển thị thông tin báo cáo, người gửi, đối tượng bị báo cáo và lý do.<br>3. Admin xem xét nội dung báo cáo.<br>4. Admin chọn hình thức xử lý phù hợp.<br>5. Hệ thống kiểm tra quyền quản trị.<br>6. Hệ thống cập nhật trạng thái báo cáo và ghi nhận người xử lý.<br>7. Nếu cần, hệ thống áp dụng hành động xử lý đối với tài khoản vi phạm.<br><br>**Alternate Flows:**<br>- Báo cáo không tồn tại: Hệ thống thông báo lỗi.<br>- Admin không đủ quyền: Hệ thống từ chối thao tác.<br>- Báo cáo đã được xử lý: Hệ thống hiển thị trạng thái hiện tại. |
| Pre-Conditions | Admin đã đăng nhập; tồn tại báo cáo người dùng cần xử lý. |
| Post-Condition | Báo cáo được cập nhật trạng thái; biện pháp xử lý được áp dụng nếu có. |

## UC35 - Xem danh sách bài viết

| Trường | Nội dung |
|---|---|
| Name of Use Case | Xem danh sách bài viết |
| Use Case ID | UC35 |
| Brief Description | Admin xem danh sách bài viết trong hệ thống để phục vụ công tác giám sát và kiểm duyệt nội dung. |
| Actor(s) | Admin |
| Trigger | Admin mở mục quản lý bài viết. |
| Flow of Events | **Basic Flow:**<br>1. Admin truy cập trang quản trị.<br>2. Admin chọn tab quản lý bài viết.<br>3. Hệ thống kiểm tra quyền quản trị.<br>4. Hệ thống tải danh sách bài viết theo bộ lọc hoặc từ khóa.<br>5. Hệ thống hiển thị thông tin bài viết, tác giả, thời gian và trạng thái liên quan.<br>6. Admin có thể tìm kiếm hoặc lọc danh sách để xem chi tiết.<br><br>**Alternate Flows:**<br>- Không có bài viết phù hợp: Hệ thống hiển thị danh sách rỗng.<br>- Người dùng không phải Admin: Hệ thống từ chối truy cập.<br>- Lỗi tải dữ liệu: Hệ thống hiển thị thông báo lỗi. |
| Pre-Conditions | Admin đã đăng nhập. |
| Post-Condition | Danh sách bài viết được hiển thị phục vụ kiểm duyệt. |

## UC36 - Xóa bài viết (Kiểm duyệt)

| Trường | Nội dung |
|---|---|
| Name of Use Case | Xóa bài viết (Kiểm duyệt) |
| Use Case ID | UC36 |
| Brief Description | Admin xóa bài viết vi phạm quy định cộng đồng hoặc không phù hợp với môi trường học đường. |
| Actor(s) | Admin |
| Trigger | Admin chọn xóa một bài viết trong trang quản trị. |
| Flow of Events | **Basic Flow:**<br>1. Admin mở danh sách bài viết.<br>2. Admin chọn bài viết cần xử lý.<br>3. Hệ thống hiển thị xác nhận xóa.<br>4. Admin xác nhận thao tác.<br>5. Hệ thống kiểm tra quyền quản trị.<br>6. Hệ thống xóa bài viết và dữ liệu liên quan theo quy tắc hệ thống.<br>7. Danh sách bài viết được cập nhật.<br><br>**Alternate Flows:**<br>- Admin hủy xác nhận: Bài viết được giữ nguyên.<br>- Bài viết không tồn tại: Hệ thống thông báo lỗi.<br>- Người thực hiện không có quyền quản trị: Hệ thống từ chối thao tác. |
| Pre-Conditions | Admin đã đăng nhập; bài viết tồn tại. |
| Post-Condition | Bài viết vi phạm bị xóa khỏi hệ thống. |

## UC37 - Xem danh sách người dùng

| Trường | Nội dung |
|---|---|
| Name of Use Case | Xem danh sách người dùng |
| Use Case ID | UC37 |
| Brief Description | Admin xem, tìm kiếm và lọc danh sách tài khoản người dùng trong hệ thống. |
| Actor(s) | Admin |
| Trigger | Admin mở mục quản lý người dùng. |
| Flow of Events | **Basic Flow:**<br>1. Admin truy cập trang quản trị.<br>2. Admin chọn tab người dùng.<br>3. Hệ thống kiểm tra quyền quản trị.<br>4. Hệ thống tải danh sách người dùng theo bộ lọc vai trò, trạng thái hoặc từ khóa.<br>5. Hệ thống hiển thị thông tin cơ bản của từng tài khoản.<br>6. Admin có thể xem, tìm kiếm hoặc chọn tài khoản để thực hiện thao tác quản trị.<br><br>**Alternate Flows:**<br>- Không có người dùng phù hợp bộ lọc: Hệ thống hiển thị danh sách rỗng.<br>- Người thực hiện không phải Admin: Hệ thống từ chối truy cập.<br>- Lỗi tải dữ liệu: Hệ thống thông báo lỗi. |
| Pre-Conditions | Admin đã đăng nhập. |
| Post-Condition | Danh sách người dùng được hiển thị phục vụ quản trị hệ thống. |

## UC38 - Xóa người dùng

| Trường | Nội dung |
|---|---|
| Name of Use Case | Xóa người dùng |
| Use Case ID | UC38 |
| Brief Description | Admin xóa tài khoản người dùng khỏi hệ thống khi tài khoản vi phạm hoặc không còn hợp lệ. |
| Actor(s) | Admin |
| Trigger | Admin chọn xóa tài khoản trong danh sách người dùng. |
| Flow of Events | **Basic Flow:**<br>1. Admin mở danh sách người dùng.<br>2. Admin chọn tài khoản cần xóa.<br>3. Hệ thống hiển thị xác nhận thao tác.<br>4. Admin xác nhận xóa tài khoản.<br>5. Hệ thống kiểm tra quyền quản trị và ràng buộc an toàn.<br>6. Hệ thống dọn dữ liệu liên quan theo quy tắc nghiệp vụ.<br>7. Hệ thống xóa tài khoản khỏi cơ sở dữ liệu.<br>8. Danh sách người dùng được cập nhật.<br><br>**Alternate Flows:**<br>- Admin hủy xác nhận: Tài khoản được giữ nguyên.<br>- Không được xóa tài khoản quản trị hoặc chính mình: Hệ thống từ chối thao tác.<br>- Tài khoản không tồn tại: Hệ thống thông báo lỗi. |
| Pre-Conditions | Admin đã đăng nhập; tài khoản mục tiêu tồn tại. |
| Post-Condition | Tài khoản mục tiêu bị xóa và không còn truy cập hệ thống. |

## UC39 - Khóa người dùng

| Trường | Nội dung |
|---|---|
| Name of Use Case | Khóa người dùng |
| Use Case ID | UC39 |
| Brief Description | Admin khóa hoặc mở khóa tài khoản người dùng để kiểm soát truy cập khi phát sinh vi phạm. |
| Actor(s) | Admin |
| Trigger | Admin thay đổi trạng thái khóa của tài khoản trong trang quản trị. |
| Flow of Events | **Basic Flow:**<br>1. Admin mở danh sách người dùng.<br>2. Admin chọn tài khoản cần khóa hoặc mở khóa.<br>3. Hệ thống kiểm tra quyền quản trị.<br>4. Hệ thống kiểm tra ràng buộc an toàn đối với tài khoản mục tiêu.<br>5. Hệ thống cập nhật trạng thái khóa của tài khoản.<br>6. Giao diện hiển thị trạng thái mới của người dùng.<br><br>**Alternate Flows:**<br>- Không được khóa tài khoản quản trị hoặc chính mình: Hệ thống từ chối thao tác.<br>- Tài khoản không tồn tại: Hệ thống thông báo lỗi.<br>- Lỗi cập nhật trạng thái: Hệ thống giữ nguyên trạng thái cũ. |
| Pre-Conditions | Admin đã đăng nhập; tài khoản mục tiêu tồn tại. |
| Post-Condition | Trạng thái khóa của tài khoản được cập nhật; tài khoản bị khóa không thể đăng nhập hoặc sử dụng hệ thống theo quy định. |
