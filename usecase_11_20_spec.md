# Đặc tả use case 11-20

## UC11 - Bình chọn trong bài khảo sát
| Trường | Nội dung |
|---|---|
| Name of Use Case | Bình chọn trong bài khảo sát |
| Use Case ID | UC11 |
| Brief Description | Người dùng chọn một hoặc nhiều phương án trong poll và hệ thống lưu phiếu bầu theo phiên đăng nhập hiện tại. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng mở bài viết dạng poll và bấm một phương án cần bình chọn. |
| Flow of Events | Basic Flow: 1) Người dùng mở thẻ poll trên feed hoặc trang chi tiết bài viết. 2) Frontend hiển thị câu hỏi, các phương án, số phiếu và trạng thái đã vote. 3) Người dùng chọn phương án phù hợp. 4) Frontend gọi `POST /api/polls/{postId}/vote`. 5) Backend lấy `currentUserId` từ token và kiểm tra poll còn hạn, option hợp lệ, `allowMultiple`. 6) Hệ thống lưu phiếu bầu vào `PollVoteRepository`. 7) Backend trả kết quả vote mới. 8) Frontend cập nhật biểu đồ/tỷ lệ bình chọn. <br> Alternate Flows: poll đã hết hạn; option không hợp lệ; poll không cho phép nhiều lựa chọn; người dùng đã vote và chuyển sang cập nhật phiếu. |
| Pre-Conditions | Người dùng đã đăng nhập; bài viết là poll hợp lệ và còn thời gian bình chọn. |
| Post-Condition | Phiếu bầu của người dùng được ghi nhận và kết quả poll được cập nhật. |
| Extension Points | Xem kết quả poll; hủy vote; cho phép nhiều lựa chọn; ẩn kết quả cho đến khi vote. |

## UC12 - Thích bài viết
| Trường | Nội dung |
|---|---|
| Name of Use Case | Thích bài viết |
| Use Case ID | UC12 |
| Brief Description | Người dùng bấm thích hoặc bỏ thích trên một bài viết để thay đổi trạng thái tương tác của mình. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng bấm nút like/unlike trên bài viết. |
| Flow of Events | Basic Flow: 1) Người dùng xem bài viết trên feed, profile hoặc trang chi tiết. 2) Người dùng bấm biểu tượng like. 3) Frontend gọi `POST /api/posts/{postId}/likes`. 4) Backend lấy `currentUserId` từ token và kiểm tra trạng thái like hiện tại. 5) Nếu chưa thích thì tạo like, nếu đã thích thì bỏ like. 6) Hệ thống cập nhật số lượt thích mới. 7) Backend trả trạng thái `likedByMe` và `likeCount`. 8) Frontend cập nhật giao diện ngay sau thao tác. <br> Alternate Flows: bài viết không tồn tại; người dùng chưa đăng nhập; trạng thái dữ liệu không nhất quán. |
| Pre-Conditions | Người dùng đã đăng nhập; bài viết tồn tại và cho phép tương tác. |
| Post-Condition | Trạng thái like của người dùng trên bài viết được cập nhật. |
| Extension Points | Hiển thị số like, danh sách người đã thích, phản hồi tức thời trên UI. |

## UC13 - Bình luận bài viết
| Trường | Nội dung |
|---|---|
| Name of Use Case | Bình luận bài viết |
| Use Case ID | UC13 |
| Brief Description | Người dùng thêm bình luận hoặc trả lời bình luận trên bài viết. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng nhập nội dung và bấm gửi bình luận. |
| Flow of Events | Basic Flow: 1) Người dùng mở phần bình luận của bài viết. 2) Frontend tải danh sách bình luận hiện có. 3) Người dùng nhập nội dung bình luận hoặc trả lời một bình luận con. 4) Frontend gọi `POST /api/posts/{postId}/comments` hoặc `POST /api/posts/{postId}/comments/{commentId}/replies`. 5) Backend lấy `currentUserId` từ token và kiểm tra nội dung hợp lệ. 6) Hệ thống lưu comment vào `PostCommentRepository`. 7) Backend trả comment mới. 8) Frontend hiển thị bình luận vừa đăng. <br> Alternate Flows: nội dung rỗng; bài viết không cho phép bình luận; người dùng sửa/xóa bình luận qua endpoint khác. |
| Pre-Conditions | Người dùng đã đăng nhập; bài viết tồn tại. |
| Post-Condition | Bình luận hoặc phản hồi được lưu và hiển thị trên giao diện. |
| Extension Points | Sửa bình luận, xóa bình luận, thích bình luận, đính kèm media vào comment. |

## UC14 - Chia sẻ bài viết
| Trường | Nội dung |
|---|---|
| Name of Use Case | Chia sẻ bài viết |
| Use Case ID | UC14 |
| Brief Description | Người dùng chia sẻ một bài viết lên trang cá nhân hoặc tạo một bản share có chú thích riêng. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng bấm nút share trên một bài viết. |
| Flow of Events | Basic Flow: 1) Người dùng mở hộp thoại chia sẻ từ bài viết. 2) Frontend cho phép nhập chú thích và chọn quyền hiển thị nếu có. 3) Người dùng xác nhận chia sẻ. 4) Frontend gọi `POST /api/posts/{postId}/share`. 5) Backend lấy `currentUserId` từ token và kiểm tra bài viết có cho phép share hay không. 6) Hệ thống tạo bản ghi share trong `PostShareRepository`. 7) Backend trả dữ liệu share mới. 8) Frontend cập nhật số lượt chia sẻ hoặc hiển thị bài share trên feed. <br> Alternate Flows: bài viết không chia sẻ được; người dùng hủy thao tác; share trùng lặp. |
| Pre-Conditions | Người dùng đã đăng nhập; bài viết tồn tại và cho phép chia sẻ. |
| Post-Condition | Bài viết được ghi nhận là đã chia sẻ bởi người dùng hiện tại. |
| Extension Points | Xem danh sách share; xóa share; hiển thị share trên feed hoặc profile. |

## UC15 - Gửi tin nhắn
| Trường | Nội dung |
|---|---|
| Name of Use Case | Gửi tin nhắn |
| Use Case ID | UC15 |
| Brief Description | Người dùng gửi tin nhắn riêng hoặc tin nhắn nhóm qua màn hình chat web. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng nhập nội dung tin nhắn và bấm gửi trong trang chat. |
| Flow of Events | Basic Flow: 1) Người dùng mở `ChatPage`, `MiniChat` hoặc khung chat nhóm. 2) Nhập nội dung và/hoặc đính kèm media. 3) Frontend gọi `POST /api/messages` hoặc `POST /api/groups/{groupId}/messages`. 4) Backend lấy `currentUserId` từ token và kiểm tra người nhận hoặc nhóm đích. 5) Hệ thống lưu tin nhắn vào cơ sở dữ liệu. 6) Backend phát sự kiện realtime qua WebSocket tới người nhận hoặc các thành viên nhóm. 7) Frontend cập nhật danh sách tin nhắn và trạng thái đọc. <br> Alternate Flows: nội dung rỗng; file đính kèm vượt kích thước; người dùng không thuộc nhóm; người nhận không hợp lệ. |
| Pre-Conditions | Người dùng đã đăng nhập; có hội thoại hoặc nhóm chat hợp lệ. |
| Post-Condition | Tin nhắn mới được lưu và được đẩy đến phía nhận theo thời gian thực. |
| Extension Points | Gửi ảnh, gửi file, mention người trong nhóm, đánh dấu đã xem. |

## UC16 - Thu hồi tin nhắn
| Trường | Nội dung |
|---|---|
| Name of Use Case | Thu hồi tin nhắn |
| Use Case ID | UC16 |
| Brief Description | Người dùng xóa nội dung tin nhắn đã gửi khỏi cuộc trò chuyện theo quyền sở hữu của mình. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn thao tác thu hồi trên một tin nhắn đã gửi. |
| Flow of Events | Basic Flow: 1) Người dùng mở menu của tin nhắn trong chat. 2) Chọn `Thu hồi`. 3) Frontend gọi `DELETE /api/messages/{messageId}/recall`. 4) Backend lấy `currentUserId` từ token và kiểm tra quyền sở hữu tin nhắn. 5) Hệ thống đánh dấu tin nhắn đã bị thu hồi. 6) Nếu là chat riêng, backend phát WebSocket thông báo thu hồi tới người nhận. 7) Nếu là chat nhóm, backend phát thông báo thu hồi đến toàn bộ nhóm. 8) Frontend cập nhật trạng thái tin nhắn thành đã thu hồi. <br> Alternate Flows: tin nhắn không thuộc về người dùng; tin nhắn đã thu hồi trước đó; lỗi kết nối thời gian thực. |
| Pre-Conditions | Người dùng đã đăng nhập; tin nhắn do chính người dùng gửi. |
| Post-Condition | Tin nhắn được đánh dấu thu hồi và không còn hiển thị nội dung như ban đầu. |
| Extension Points | Thu hồi trong chat riêng hoặc chat nhóm; đồng bộ realtime qua WebSocket. |

## UC17 - Gửi lời mời kết bạn
| Trường | Nội dung |
|---|---|
| Name of Use Case | Gửi lời mời kết bạn |
| Use Case ID | UC17 |
| Brief Description | Người dùng gửi lời mời kết bạn tới một tài khoản khác trong hệ thống. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn nút kết bạn tại trang hồ sơ người khác. |
| Flow of Events | Basic Flow: 1) Người dùng mở trang hồ sơ của tài khoản khác. 2) Frontend kiểm tra trạng thái quan hệ hiện tại bằng `GET /api/users/{viewerId}/friendship-status/{targetId}`. 3) Người dùng bấm `Kết bạn`. 4) Frontend gọi `POST /api/friend-requests?targetId={targetId}`. 5) Backend lấy `currentUserId` từ token. 6) Hệ thống kiểm tra quan hệ hiện tại, trạng thái chờ và các ràng buộc khác. 7) Nếu hợp lệ, backend tạo yêu cầu kết bạn ở trạng thái pending. 8) Frontend hiển thị trạng thái chờ duyệt. <br> Alternate Flows: đã là bạn; đã có lời mời chờ; tài khoản bị chặn; người dùng tự gửi cho chính mình. |
| Pre-Conditions | Người dùng đã đăng nhập; tài khoản đích tồn tại. |
| Post-Condition | Yêu cầu kết bạn được lưu ở trạng thái chờ. |
| Extension Points | Hủy lời mời; xem danh sách lời mời đã gửi/chờ nhận. |

## UC18 - Chấp nhận kết bạn
| Trường | Nội dung |
|---|---|
| Name of Use Case | Chấp nhận kết bạn |
| Use Case ID | UC18 |
| Brief Description | Người dùng nhận lời mời kết bạn và đồng ý để hệ thống tạo quan hệ bạn bè. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng mở danh sách lời mời kết bạn và chọn chấp nhận. |
| Flow of Events | Basic Flow: 1) Người dùng mở tab lời mời trong `FriendsPage`. 2) Frontend tải danh sách yêu cầu chờ từ `GET /api/users/{userId}/friend-requests/pending`. 3) Người dùng chọn một lời mời và bấm chấp nhận. 4) Frontend gọi `PUT /api/friend-requests/{friendshipId}/accept`. 5) Backend lấy `currentUserId` từ token và kiểm tra quyền duyệt. 6) Hệ thống cập nhật trạng thái sang accepted và tạo quan hệ bạn bè. 7) Backend trả về thông tin friendship mới. 8) Frontend cập nhật danh sách bạn bè và yêu cầu chờ. <br> Alternate Flows: lời mời đã hết hạn; không đúng người nhận; yêu cầu đã được xử lý trước đó. |
| Pre-Conditions | Người dùng đã đăng nhập; có lời mời kết bạn đang chờ. |
| Post-Condition | Quan hệ bạn bè mới được tạo trong hệ thống. |
| Extension Points | Từ chối lời mời; xem hồ sơ người gửi; nhắn tin sau khi kết bạn. |

## UC19 - Hủy kết bạn
| Trường | Nội dung |
|---|---|
| Name of Use Case | Hủy kết bạn |
| Use Case ID | UC19 |
| Brief Description | Người dùng chấm dứt quan hệ bạn bè hiện có với một tài khoản khác. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn thao tác `Hủy kết bạn` trên hồ sơ hoặc danh sách bạn bè. |
| Flow of Events | Basic Flow: 1) Người dùng mở hồ sơ bạn bè hoặc danh sách bạn bè. 2) Chọn `Hủy kết bạn`. 3) Frontend hiển thị xác nhận thao tác. 4) Người dùng đồng ý hủy kết bạn. 5) Frontend gọi `DELETE /api/friendships/{friendshipId}`. 6) Backend lấy `currentUserId` từ token và kiểm tra quan hệ friendship hợp lệ. 7) Hệ thống xóa quan hệ bạn bè. 8) Frontend refresh danh sách bạn bè. <br> Alternate Flows: người dùng hủy thao tác; không đủ quyền; quan hệ đã bị xóa trước đó. |
| Pre-Conditions | Người dùng đã đăng nhập; hai tài khoản đang ở trạng thái bạn bè. |
| Post-Condition | Quan hệ bạn bè bị chấm dứt và không còn hiển thị như trước. |
| Extension Points | Chặn người dùng thay vì hủy kết bạn; gửi lại lời mời sau này. |

## UC20 - Xem thông báo
| Trường | Nội dung |
|---|---|
| Name of Use Case | Xem thông báo |
| Use Case ID | UC20 |
| Brief Description | Người dùng xem danh sách thông báo hệ thống, thông báo nhóm và đánh dấu đã đọc. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng bấm biểu tượng chuông thông báo trên `AppLayout`. |
| Flow of Events | Basic Flow: 1) Người dùng vào ứng dụng hoặc mở dropdown thông báo. 2) Frontend gọi `GET /api/users/{userId}/notifications` và `GET /api/users/{userId}/notifications/unread-count`. 3) Đồng thời frontend gọi `GET /api/groups/notifications` và `GET /api/groups/notifications/unread-count` để lấy thông báo nhóm. 4) Danh sách được gộp và sắp xếp theo `createdAt`. 5) Người dùng bấm một thông báo. 6) Frontend gọi `PUT /api/notifications/{id}/read` hoặc endpoint đọc của nhóm. 7) Backend cập nhật trạng thái đã đọc. 8) Frontend điều hướng đến bài viết, hồ sơ hoặc nhóm liên quan. <br> Alternate Flows: không có thông báo mới; lỗi tải thông báo; thông báo thuộc nhóm hoặc đối tượng đã bị xóa. |
| Pre-Conditions | Người dùng đã đăng nhập; có quyền truy cập danh sách thông báo của chính mình. |
| Post-Condition | Trạng thái đọc của thông báo được cập nhật và badge chưa đọc thay đổi tương ứng. |
| Extension Points | Thông báo bài viết, thông báo nhóm, thông báo tin nhắn mới, đọc tất cả. |
