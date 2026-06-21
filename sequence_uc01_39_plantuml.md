# Sequence Diagram PlantUML - UC01-UC39

Các sequence bên dưới viết theo PlantUML để đưa lên PlantText hoặc PlantUML Online Server render. Luồng bám theo danh sách use case trong `danh sách usecase.xlsx`, mô tả chương 3.3 trong Word và tên lớp/phương thức thực tế của project Spring Boot + React.

## UC01 - Đăng ký tài khoản bằng email trường

```plantuml
@startuml
title UC01 - Đăng ký tài khoản bằng email trường
actor "Sinh viên" as User
boundary "RegisterPage" as UI
control "AuthController" as AuthController
control "UserService" as UserService
control "OtpService" as OtpService
control "AuthTokenService" as TokenService
database "UserRepository" as UserRepo
database "OtpTokenRepository" as OtpRepo
database "Database" as DB

User -> UI: nhập email trường, role, hồ sơ
UI -> AuthController: requestRegistrationOtp(request)
AuthController -> UserService: validateRegistrationEmail(email, role)
AuthController -> UserService: isEmailRegistered(email)
UserService -> UserRepo: findByEmail(email)
UserRepo -> DB: SELECT users WHERE email
DB --> UserRepo: Optional<User>
UserRepo --> UserService: kết quả
UserService --> AuthController: email hợp lệ
AuthController -> OtpService: sendRegistrationOtp(email)
OtpService -> OtpService: createOtpToken(email)
OtpService -> OtpRepo: save(otpToken)
OtpRepo -> DB: INSERT/UPDATE otp_tokens
DB --> OtpRepo: OtpToken
OtpService --> AuthController: OTP đã gửi
AuthController --> UI: 200 OK

User -> UI: nhập OTP và bấm Đăng ký
UI -> AuthController: register(RegisterRequest)
AuthController -> OtpService: verifyOtp(email, otpCode)
OtpService -> OtpRepo: findByEmailAndOtpCode(email, otpCode)
OtpRepo -> DB: SELECT otp_tokens
DB --> OtpRepo: OtpToken
OtpService --> AuthController: VerificationResult.success
AuthController -> UserService: register(request)
UserService -> UserService: validateRegistrationEmail()
UserService -> UserRepo: findByEmail(email)
UserService -> UserRepo: save(user)
UserRepo -> DB: INSERT users
DB --> UserRepo: User
UserService --> AuthController: UserResponse
AuthController -> TokenService: createToken(userId)
TokenService --> AuthController: token
AuthController --> UI: AuthResponse(user, token)
UI --> User: chuyển vào HomePage
@enduml
```

## UC02 - Đăng nhập bằng email trường

```plantuml
@startuml
title UC02 - Đăng nhập bằng email trường
actor "Sinh viên" as User
boundary "LoginPage" as UI
control "AuthController" as AuthController
control "UserService" as UserService
control "AuthTokenService" as TokenService
database "UserRepository" as UserRepo
database "Database" as DB

User -> UI: nhập email và mật khẩu
UI -> AuthController: login(AuthRequest)
AuthController -> UserService: login(request)
UserService -> UserRepo: findByEmail(email)
UserRepo -> DB: SELECT users WHERE email
DB --> UserRepo: User
UserRepo --> UserService: User
UserService -> UserService: passwordEncoder.matches()
UserService -> UserService: kiểm tra accountLocked
UserService --> AuthController: UserResponse
AuthController -> TokenService: createToken(userId)
TokenService --> AuthController: token
AuthController --> UI: AuthResponse(user, token)
UI --> User: lưu phiên đăng nhập
@enduml
```

## UC03 - Đăng xuất

```plantuml
@startuml
title UC03 - Đăng xuất
actor "Sinh viên" as User
boundary "AppLayout" as UI
control "ChatWebSocketHandler" as WS

User -> UI: chọn Đăng xuất
UI -> WS: leaveAllGroupChatRooms(userId)
WS --> UI: đóng trạng thái chat realtime
UI -> UI: remove social_token
UI -> UI: remove social_user
UI -> UI: clear miniChats/session state
UI --> User: điều hướng về LoginPage
@enduml
```

## UC04 - Đổi mật khẩu

```plantuml
@startuml
title UC04 - Đổi mật khẩu
actor "Sinh viên" as User
boundary "PrivacyPage" as UI
control "UserController" as UserController
control "UserService" as UserService
database "UserRepository" as UserRepo
database "Database" as DB

User -> UI: nhập mật khẩu cũ và mật khẩu mới
UI -> UserController: changePassword(userId, payload)
UserController -> UserService: changePassword(userId, oldPassword, newPassword)
UserService -> UserRepo: findById(userId)
UserRepo -> DB: SELECT users WHERE id
DB --> UserRepo: User
UserRepo --> UserService: User
UserService -> UserService: passwordEncoder.matches(oldPassword)
UserService -> UserService: passwordEncoder.encode(newPassword)
UserService -> UserRepo: save(user)
UserRepo -> DB: UPDATE users.password
DB --> UserRepo: User
UserService --> UserController: void
UserController --> UI: 200 OK
UI --> User: thông báo đổi mật khẩu thành công
@enduml
```

## UC05 - Cập nhật thông tin cá nhân

```plantuml
@startuml
title UC05 - Cập nhật thông tin cá nhân
actor "Sinh viên" as User
boundary "SettingsPage" as UI
control "FileUploadController" as FileController
control "CloudinaryStorageService" as StorageService
control "UserController" as UserController
control "UserService" as UserService
database "UserRepository" as UserRepo
database "MajorRepository" as MajorRepo
database "FacultyRepository" as FacultyRepo
database "Database" as DB

User -> UI: chỉnh sửa hồ sơ, avatar, cover
opt có ảnh mới
  UI -> FileController: createUploadSignature(folder, type)
  FileController -> StorageService: createDirectUploadSignature(folder, type)
  StorageService --> FileController: DirectUploadSignature
  FileController --> UI: signature
end
UI -> UserController: updateProfile(userId, ProfileUpdateRequest)
UserController -> UserService: updateProfile(userId, request)
UserService -> UserRepo: findById(userId)
UserRepo -> DB: SELECT users WHERE id
DB --> UserRepo: User
UserService -> FacultyRepo: findById(facultyId)
UserService -> MajorRepo: findById(majorId)
UserService -> UserService: applyRoleProfileFields()
UserService -> UserRepo: save(user)
UserRepo -> DB: UPDATE users
DB --> UserRepo: User
UserService --> UserController: UserResponse
UserController --> UI: 200 OK
UI --> User: hồ sơ đã cập nhật
@enduml
```

## UC06 - Đăng bài viết

```plantuml
@startuml
title UC06 - Đăng bài viết
actor "Sinh viên" as User
boundary "PostComposer" as UI
control "PostController" as PostController
control "AuthenticatedUserService" as AuthUser
control "PostService" as PostService
database "PostRepository" as PostRepo
database "PostMediaRepository" as MediaRepo
database "UserRepository" as UserRepo
database "Database" as DB

User -> UI: nhập nội dung, visibility, media
UI -> PostController: createCurrentUserPost(PostRequest)
PostController -> AuthUser: getCurrentUserId()
AuthUser --> PostController: currentUserId
PostController -> PostService: createPost(currentUserId, request)
PostService -> UserRepo: findById(currentUserId)
UserRepo -> DB: SELECT users WHERE id
DB --> UserRepo: User
PostService -> PostRepo: save(post)
PostRepo -> DB: INSERT posts
DB --> PostRepo: Post
opt có media
  PostService -> MediaRepo: save(PostMedia)
  MediaRepo -> DB: INSERT post_media
  DB --> MediaRepo: PostMedia
end
PostService --> PostController: PostResponse
PostController --> UI: 201 Created
UI --> User: bài viết xuất hiện trên feed
@enduml
```

## UC07 - Chỉnh sửa bài viết

```plantuml
@startuml
title UC07 - Chỉnh sửa bài viết
actor "Sinh viên" as User
boundary "PostComposerModal" as UI
control "PostController" as PostController
control "AuthenticatedUserService" as AuthUser
control "PostService" as PostService
database "PostRepository" as PostRepo
database "PostMediaRepository" as MediaRepo
database "Database" as DB

User -> UI: mở form sửa bài viết
UI -> PostController: updatePost(postId, userId, PostRequest)
PostController -> AuthUser: getCurrentUserId()
AuthUser --> PostController: currentUserId
PostController -> PostService: updatePost(postId, currentUserId, request)
PostService -> PostRepo: findById(postId)
PostRepo -> DB: SELECT posts WHERE id
DB --> PostRepo: Post
PostService -> PostService: kiểm tra author.id == currentUserId
PostService -> PostService: cập nhật content/visibility
PostService -> MediaRepo: findByPostIdOrderByMediaOrderAsc(postId)
PostService -> MediaRepo: save(PostMedia)
PostService -> PostRepo: save(post)
PostRepo -> DB: UPDATE posts
DB --> PostRepo: Post
PostService --> PostController: PostResponse
PostController --> UI: 200 OK
UI --> User: bài viết đã được cập nhật
@enduml
```

## UC08 - Xóa bài viết

```plantuml
@startuml
title UC08 - Xóa bài viết
actor "Sinh viên" as User
boundary "PostCard" as UI
control "PostController" as PostController
control "AuthenticatedUserService" as AuthUser
control "PostService" as PostService
control "CloudinaryCleanupService" as Cleanup
database "PostRepository" as PostRepo
database "Database" as DB

User -> UI: chọn Xóa bài viết
UI -> PostController: deletePost(postId, userId)
PostController -> AuthUser: getCurrentUserId()
AuthUser --> PostController: currentUserId
PostController -> PostService: deletePost(postId, currentUserId)
PostService -> PostRepo: findById(postId)
PostRepo -> DB: SELECT posts WHERE id
DB --> PostRepo: Post
PostService -> PostService: kiểm tra quyền sở hữu
PostService -> Cleanup: schedulePostAssets(postId)
PostService -> PostRepo: delete(post)
PostRepo -> DB: DELETE posts
DB --> PostRepo: done
PostService --> PostController: void
PostController --> UI: 204 No Content
UI --> User: feed được làm mới
@enduml
```

## UC09 - Đăng bình chọn

```plantuml
@startuml
title UC09 - Đăng bình chọn
actor "Sinh viên" as User
boundary "PollCreator" as UI
control "PollController" as PollController
control "AuthenticatedUserService" as AuthUser
control "PollService" as PollService
database "UserRepository" as UserRepo
database "PostRepository" as PostRepo
database "PollOptionRepository" as OptionRepo
database "Database" as DB

User -> UI: nhập câu hỏi và các lựa chọn
UI -> PollController: createPoll(request)
PollController -> AuthUser: getCurrentUserId()
AuthUser --> PollController: currentUserId
PollController -> PollService: createPoll(currentUserId, title, content, visibility, options, allowMultiple, endDate)
PollService -> UserRepo: findById(currentUserId)
UserRepo -> DB: SELECT users WHERE id
DB --> UserRepo: User
PollService -> PostRepo: save(post type=poll)
PostRepo -> DB: INSERT posts
DB --> PostRepo: Post
loop mỗi option
  PollService -> OptionRepo: save(PollOption)
  OptionRepo -> DB: INSERT poll_options
end
PollService --> PollController: Post
PollController --> UI: 201 Created
UI --> User: poll hiển thị trên feed
@enduml
```

## UC10 - Bình chọn

```plantuml
@startuml
title UC10 - Bình chọn
actor "Sinh viên" as User
boundary "PollCard" as UI
control "PollController" as PollController
control "AuthenticatedUserService" as AuthUser
control "PollService" as PollService
database "PostRepository" as PostRepo
database "PollOptionRepository" as OptionRepo
database "PollVoteRepository" as VoteRepo
database "Database" as DB

User -> UI: chọn phương án bình chọn
UI -> PollController: vote(postId, request)
PollController -> AuthUser: getCurrentUserId()
AuthUser --> PollController: currentUserId
PollController -> PollService: vote(postId, currentUserId, optionIds)
PollService -> PostRepo: findById(postId)
PostRepo -> DB: SELECT poll post
DB --> PostRepo: Post
PollService -> OptionRepo: findByPostId(postId)
OptionRepo -> DB: SELECT poll_options
DB --> OptionRepo: List<PollOption>
PollService -> VoteRepo: findByPostIdAndUserId(postId, currentUserId)
VoteRepo -> DB: SELECT poll_votes
DB --> VoteRepo: previous votes
PollService -> VoteRepo: save(PollVote)
VoteRepo -> DB: INSERT/UPDATE poll_votes
PollService -> PollService: getPollResults(postId, currentUserId)
PollService --> PollController: result map
PollController --> UI: 200 OK
UI --> User: cập nhật tỷ lệ bình chọn
@enduml
```

## UC11 - Thích bài viết

```plantuml
@startuml
title UC11 - Thích bài viết
actor "Sinh viên" as User
boundary "PostCard" as UI
control "PostController" as PostController
control "AuthenticatedUserService" as AuthUser
control "PostService" as PostService
control "NotificationService" as NotificationService
database "PostRepository" as PostRepo
database "PostLikeRepository" as LikeRepo
database "Database" as DB

User -> UI: bấm Like/Unlike
UI -> PostController: toggleLike(postId, userId)
PostController -> AuthUser: getCurrentUserId()
AuthUser --> PostController: currentUserId
PostController -> PostService: toggleLike(postId, currentUserId)
PostService -> PostRepo: findById(postId)
PostRepo -> DB: SELECT posts WHERE id
PostService -> LikeRepo: findByPostIdAndUserId(postId, currentUserId)
LikeRepo -> DB: SELECT post_likes
alt đã thích
  PostService -> LikeRepo: delete(existingLike)
  LikeRepo -> DB: DELETE post_likes
else chưa thích
  PostService -> LikeRepo: save(PostLike)
  LikeRepo -> DB: INSERT post_likes
  PostService -> NotificationService: createPostLikeNotification(actorId, postId, postAuthorId)
end
PostService -> LikeRepo: countByPostId(postId)
PostService --> PostController: PostLikeResponse
PostController --> UI: 200 OK
UI --> User: cập nhật số lượt thích
@enduml
```

## UC12 - Bình luận trong bài viết

```plantuml
@startuml
title UC12 - Bình luận trong bài viết
actor "Sinh viên" as User
boundary "PostCard" as UI
control "PostController" as PostController
control "AuthenticatedUserService" as AuthUser
control "PostService" as PostService
control "NotificationService" as NotificationService
database "PostRepository" as PostRepo
database "PostCommentRepository" as CommentRepo
database "CommentMediaRepository" as CommentMediaRepo
database "Database" as DB

User -> UI: nhập bình luận
UI -> PostController: addComment(postId, userId, PostCommentRequest)
PostController -> AuthUser: getCurrentUserId()
AuthUser --> PostController: currentUserId
PostController -> PostService: addComment(postId, currentUserId, request)
PostService -> PostRepo: findById(postId)
PostRepo -> DB: SELECT posts WHERE id
PostService -> CommentRepo: save(comment)
CommentRepo -> DB: INSERT post_comments
opt có media bình luận
  PostService -> CommentMediaRepo: save(CommentMedia)
  CommentMediaRepo -> DB: INSERT comment_media
end
PostService -> NotificationService: createPostCommentNotification(actorId, postId, postAuthorId)
PostService --> PostController: PostCommentResponse
PostController --> UI: 201 Created
UI --> User: bình luận xuất hiện dưới bài viết
@enduml
```

## UC13 - Chia sẻ bài viết

```plantuml
@startuml
title UC13 - Chia sẻ bài viết
actor "Sinh viên" as User
boundary "ShareModal" as UI
control "ShareController" as ShareController
control "AuthenticatedUserService" as AuthUser
control "ShareService" as ShareService
control "NotificationService" as NotificationService
database "PostRepository" as PostRepo
database "PostShareRepository" as ShareRepo
database "Database" as DB

User -> UI: nhập caption và visibility
UI -> ShareController: sharePost(postId, userId, ShareRequest)
ShareController -> AuthUser: getCurrentUserId()
AuthUser --> ShareController: currentUserId
ShareController -> ShareService: sharePost(currentUserId, request)
ShareService -> PostRepo: findById(originalPostId)
PostRepo -> DB: SELECT posts WHERE id
ShareService -> ShareRepo: existsByOriginalPostIdAndSharedByUserId(postId, currentUserId)
ShareRepo -> DB: SELECT COUNT post_shares
ShareService -> ShareRepo: save(PostShare)
ShareRepo -> DB: INSERT post_shares
ShareService -> NotificationService: createShareNotification(actorId, postId, postAuthorId)
ShareService --> ShareController: PostShareResponse
ShareController --> UI: 201 Created
UI --> User: bài viết đã được chia sẻ
@enduml
```

## UC14 - Gửi tin nhắn

```plantuml
@startuml
title UC14 - Gửi tin nhắn
actor "Sinh viên" as User
boundary "ChatPage" as UI
control "MessageController" as MessageController
control "AuthenticatedUserService" as AuthUser
control "MessageService" as MessageService
control "PrivacyAccessService" as PrivacyService
control "ChatWebSocketHandler" as WS
database "UserRepository" as UserRepo
database "MessageRepository" as MessageRepo
database "Database" as DB

User -> UI: nhập nội dung tin nhắn
UI -> MessageController: sendCurrentUserMessage(payload)
MessageController -> AuthUser: getCurrentUserId()
AuthUser --> MessageController: senderId
MessageController -> MessageService: sendMessage(senderId, receiverId, content, mediaUrl)
MessageService -> UserRepo: findById(senderId)
MessageService -> UserRepo: findById(receiverId)
UserRepo -> DB: SELECT users
DB --> UserRepo: sender, receiver
MessageService -> PrivacyService: canMessage(sender, receiver)
PrivacyService --> MessageService: allowed
MessageService -> MessageRepo: save(message)
MessageRepo -> DB: INSERT messages
DB --> MessageRepo: Message
MessageService --> MessageController: MessageResponse
MessageController -> WS: notifyUser(receiverId, payload)
MessageController --> UI: 201 Created
UI --> User: tin nhắn hiển thị trong hội thoại
@enduml
```

## UC15 - Thu hồi tin nhắn

```plantuml
@startuml
title UC15 - Thu hồi tin nhắn
actor "Sinh viên" as User
boundary "ChatMessage" as UI
control "MessageController" as MessageController
control "AuthenticatedUserService" as AuthUser
control "MessageService" as MessageService
control "ChatWebSocketHandler" as WS
database "MessageRepository" as MessageRepo
database "Database" as DB

User -> UI: chọn Thu hồi tin nhắn
UI -> MessageController: recallMessage(messageId, userId)
MessageController -> AuthUser: getCurrentUserId()
AuthUser --> MessageController: currentUserId
MessageController -> MessageService: recallMessage(messageId, currentUserId)
MessageService -> MessageRepo: findById(messageId)
MessageRepo -> DB: SELECT messages WHERE id
DB --> MessageRepo: Message
MessageService -> MessageService: kiểm tra sender.id == currentUserId
MessageService -> MessageRepo: save(message isRecalled=true)
MessageRepo -> DB: UPDATE messages
MessageService --> MessageController: MessageResponse
alt tin nhắn cá nhân
  MessageController -> WS: notifyUser(receiverId, message_recalled)
else tin nhắn nhóm
  MessageController -> WS: notifyGroupChat(groupId, message_recalled)
end
MessageController --> UI: 200 OK
UI --> User: tin nhắn chuyển sang trạng thái đã thu hồi
@enduml
```

## UC16 - Gửi lời mời kết bạn

```plantuml
@startuml
title UC16 - Gửi lời mời kết bạn
actor "Sinh viên" as User
boundary "UserProfilePage" as UI
control "FriendshipController" as FriendshipController
control "AuthenticatedUserService" as AuthUser
control "FriendshipService" as FriendshipService
control "NotificationService" as NotificationService
database "UserRepository" as UserRepo
database "FriendshipRepository" as FriendshipRepo
database "Database" as DB

User -> UI: bấm Kết bạn
UI -> FriendshipController: sendCurrentUserFriendRequest(targetId)
FriendshipController -> AuthUser: getCurrentUserId()
AuthUser --> FriendshipController: requesterId
FriendshipController -> FriendshipService: sendRequest(requesterId, targetId)
FriendshipService -> UserRepo: findById(requesterId)
FriendshipService -> UserRepo: findById(targetId)
FriendshipService -> FriendshipRepo: findByRequesterIdAndAddresseeId(requesterId, targetId)
FriendshipRepo -> DB: SELECT friendships
FriendshipService -> FriendshipRepo: save(friendship status=pending)
FriendshipRepo -> DB: INSERT friendships
FriendshipService -> NotificationService: createFriendRequestNotification(requesterId, targetId)
FriendshipService --> FriendshipController: FriendshipResponse
FriendshipController --> UI: 201 Created
UI --> User: trạng thái Chờ xác nhận
@enduml
```

## UC17 - Chấp nhận kết bạn

```plantuml
@startuml
title UC17 - Chấp nhận kết bạn
actor "Sinh viên" as User
boundary "FriendsPage" as UI
control "FriendshipController" as FriendshipController
control "AuthenticatedUserService" as AuthUser
control "FriendshipService" as FriendshipService
control "NotificationService" as NotificationService
database "FriendshipRepository" as FriendshipRepo
database "Database" as DB

User -> UI: chọn Chấp nhận lời mời
UI -> FriendshipController: acceptFriendRequest(friendshipId, userId)
FriendshipController -> AuthUser: getCurrentUserId()
AuthUser --> FriendshipController: currentUserId
FriendshipController -> FriendshipService: acceptRequestByFriendshipId(friendshipId, currentUserId)
FriendshipService -> FriendshipRepo: findById(friendshipId)
FriendshipRepo -> DB: SELECT friendships WHERE id
DB --> FriendshipRepo: Friendship
FriendshipService -> FriendshipService: kiểm tra addressee.id == currentUserId
FriendshipService -> FriendshipRepo: save(status=accepted)
FriendshipRepo -> DB: UPDATE friendships
FriendshipService -> NotificationService: createFriendAcceptedNotification(requesterId, addresseeId)
FriendshipService --> FriendshipController: FriendshipResponse
FriendshipController --> UI: 200 OK
UI --> User: hai người trở thành bạn bè
@enduml
```

## UC18 - Hủy kết bạn

```plantuml
@startuml
title UC18 - Hủy kết bạn
actor "Sinh viên" as User
boundary "FriendsPage" as UI
control "FriendshipController" as FriendshipController
control "AuthenticatedUserService" as AuthUser
control "FriendshipService" as FriendshipService
database "FriendshipRepository" as FriendshipRepo
database "Database" as DB

User -> UI: chọn Hủy kết bạn
UI -> FriendshipController: unfriend(friendshipId, userId)
FriendshipController -> AuthUser: getCurrentUserId()
AuthUser --> FriendshipController: currentUserId
FriendshipController -> FriendshipService: unfriendByFriendshipId(friendshipId, currentUserId)
FriendshipService -> FriendshipRepo: findById(friendshipId)
FriendshipRepo -> DB: SELECT friendships WHERE id
DB --> FriendshipRepo: Friendship
FriendshipService -> FriendshipService: kiểm tra user thuộc quan hệ bạn bè
FriendshipService -> FriendshipRepo: delete(friendship)
FriendshipRepo -> DB: DELETE friendships
FriendshipService --> FriendshipController: void
FriendshipController --> UI: 204 No Content
UI --> User: danh sách bạn bè được cập nhật
@enduml
```

## UC19 - Xem thông báo

```plantuml
@startuml
title UC19 - Xem thông báo
actor "Sinh viên" as User
boundary "AppLayout" as UI
control "NotificationController" as NotificationController
control "NotificationService" as NotificationService
database "NotificationRepository" as NotificationRepo
database "Database" as DB

User -> UI: mở danh sách thông báo
UI -> NotificationController: getNotifications(userId)
NotificationController -> NotificationService: getNotifications(userId)
NotificationService -> NotificationRepo: findByRecipientIdOrderByCreatedAtDesc(userId)
NotificationRepo -> DB: SELECT notifications
DB --> NotificationRepo: List<Notification>
NotificationService --> NotificationController: List<NotificationResponse>
NotificationController --> UI: 200 OK
User -> UI: đánh dấu đã đọc
UI -> NotificationController: markAllAsRead(userId)
NotificationController -> NotificationService: markAllAsRead(userId)
NotificationService -> NotificationRepo: markAllAsReadByRecipientId(userId)
NotificationRepo -> DB: UPDATE notifications.is_read
NotificationController --> UI: 204 No Content
UI --> User: badge thông báo được cập nhật
@enduml
```

## UC20 - Tìm kiếm

```plantuml
@startuml
title UC20 - Tìm kiếm
actor "Sinh viên" as User
boundary "SearchPage" as UI
control "UserController" as UserController
control "PostController" as PostController
control "GroupController" as GroupController
control "UserService" as UserService
control "PostService" as PostService
control "GroupService" as GroupService
database "UserRepository" as UserRepo
database "PostRepository" as PostRepo
database "GroupRepository" as GroupRepo

User -> UI: nhập từ khóa tìm kiếm
par tìm người dùng
  UI -> UserController: searchUsers(q)
  UserController -> UserService: searchUsers(q)
  UserService -> UserRepo: findByFullNameContainingIgnoreCase(q)
  UserService --> UserController: List<UserResponse>
  UserController --> UI: users
and tìm bài viết
  UI -> PostController: searchPosts(q, viewerId, page, size)
  PostController -> PostService: searchPosts(q, viewerId, page, size)
  PostService -> PostRepo: searchRelevant(q, pageable)
  PostService --> PostController: List<PostFeedResponse>
  PostController --> UI: posts
and tìm nhóm
  UI -> GroupController: searchGroups(keyword, page, size)
  GroupController -> GroupService: searchGroups(keyword, page, size)
  GroupService -> GroupRepo: searchGroups(keyword, pageable)
  GroupService --> GroupController: List<GroupResponse>
  GroupController --> UI: groups
end
UI --> User: hiển thị kết quả theo tab
@enduml
```

## UC21 - Tạo nhóm

```plantuml
@startuml
title UC21 - Tạo nhóm
actor "Sinh viên" as User
boundary "GroupsPage" as UI
control "GroupController" as GroupController
control "AuthenticatedUserService" as AuthUser
control "GroupService" as GroupService
database "UserRepository" as UserRepo
database "GroupRepository" as GroupRepo
database "GroupMemberRepository" as MemberRepo
database "Database" as DB

User -> UI: nhập tên, mô tả, quyền riêng tư nhóm
UI -> GroupController: createGroup(body)
GroupController -> AuthUser: getCurrentUserId()
AuthUser --> GroupController: currentUserId
GroupController -> GroupService: createGroup(currentUserId, GroupRequest)
GroupService -> UserRepo: findById(currentUserId)
GroupService -> GroupRepo: save(group)
GroupRepo -> DB: INSERT groups
DB --> GroupRepo: Group
GroupService -> MemberRepo: save(GroupMember role=gold_key)
MemberRepo -> DB: INSERT group_members
GroupService --> GroupController: GroupResponse
GroupController --> UI: 201 Created
UI --> User: điều hướng sang GroupDetailPage
@enduml
```

## UC22 - Xin vào nhóm

```plantuml
@startuml
title UC22 - Xin vào nhóm
actor "Sinh viên" as User
boundary "GroupDetailPage" as UI
control "GroupController" as GroupController
control "AuthenticatedUserService" as AuthUser
control "GroupService" as GroupService
database "GroupRepository" as GroupRepo
database "GroupMemberRepository" as MemberRepo
database "GroupJoinRequestRepository" as JoinRepo

User -> UI: bấm Tham gia nhóm
UI -> GroupController: joinGroup(groupId, userId)
GroupController -> AuthUser: getCurrentUserId()
AuthUser --> GroupController: currentUserId
GroupController -> GroupService: joinGroup(groupId, currentUserId)
GroupService -> GroupRepo: findById(groupId)
GroupService -> MemberRepo: findByGroupIdAndUserId(groupId, currentUserId)
alt nhóm cần duyệt
  GroupService -> JoinRepo: save(GroupJoinRequest status=pending)
  GroupService --> GroupController: pending response
else nhóm công khai vào thẳng
  GroupService -> MemberRepo: save(GroupMember status=active)
  GroupService --> GroupController: GroupMemberResponse
end
GroupController --> UI: 200 OK hoặc 202 Accepted
UI --> User: cập nhật trạng thái tham gia
@enduml
```

## UC23 - Xóa nhóm

```plantuml
@startuml
title UC23 - Xóa nhóm
actor "Sinh viên" as User
boundary "GroupDetailPage" as UI
control "GroupController" as GroupController
control "AuthenticatedUserService" as AuthUser
control "GroupService" as GroupService
control "CloudinaryCleanupService" as Cleanup
database "GroupRepository" as GroupRepo
database "GroupPostRepository" as GroupPostRepo
database "PostRepository" as PostRepo

User -> UI: chọn Xóa nhóm
UI -> GroupController: deleteGroup(groupId, userId)
GroupController -> AuthUser: getCurrentUserId()
AuthUser --> GroupController: currentUserId
GroupController -> GroupService: deleteGroup(groupId, currentUserId)
GroupService -> GroupRepo: findById(groupId)
GroupService -> GroupService: kiểm tra quyền chủ nhóm/admin nhóm
GroupService -> Cleanup: scheduleGroupAssets(groupId)
GroupService -> GroupPostRepo: findByGroupId(groupId)
GroupService -> GroupRepo: delete(group)
GroupService -> PostRepo: deleteAllById(postIds)
GroupService --> GroupController: void
GroupController --> UI: 204 No Content
UI --> User: quay về danh sách nhóm
@enduml
```

## UC24 - Rời nhóm

```plantuml
@startuml
title UC24 - Rời nhóm
actor "Sinh viên" as User
boundary "GroupDetailPage" as UI
control "GroupController" as GroupController
control "AuthenticatedUserService" as AuthUser
control "GroupService" as GroupService
database "GroupMemberRepository" as MemberRepo
database "Database" as DB

User -> UI: bấm Rời nhóm
UI -> GroupController: leaveGroup(groupId, userId)
GroupController -> AuthUser: getCurrentUserId()
AuthUser --> GroupController: currentUserId
GroupController -> GroupService: leaveGroup(groupId, currentUserId)
GroupService -> MemberRepo: findByGroupIdAndUserId(groupId, currentUserId)
MemberRepo -> DB: SELECT group_members
DB --> MemberRepo: GroupMember
GroupService -> GroupService: kiểm tra không phải gold_key cuối cùng
GroupService -> MemberRepo: delete(member)
MemberRepo -> DB: DELETE group_members
GroupService --> GroupController: void
GroupController --> UI: 204 No Content
UI --> User: cập nhật giao diện nhóm
@enduml
```

## UC25 - Phê duyệt thành viên

```plantuml
@startuml
title UC25 - Phê duyệt thành viên
actor "Sinh viên" as Manager
boundary "GroupDetailPage" as UI
control "GroupController" as GroupController
control "AuthenticatedUserService" as AuthUser
control "GroupService" as GroupService
database "GroupJoinRequestRepository" as JoinRepo
database "GroupMemberRepository" as MemberRepo
database "Database" as DB

Manager -> UI: mở tab yêu cầu tham gia
UI -> GroupController: getPendingJoinRequests(groupId, userId)
GroupController -> AuthUser: getCurrentUserId()
GroupController -> GroupService: getPendingJoinRequests(groupId, currentUserId)
GroupService -> JoinRepo: findPendingRequests(groupId)
JoinRepo -> DB: SELECT group_join_requests
GroupService --> GroupController: List<GroupJoinRequestResponse>
GroupController --> UI: danh sách request
Manager -> UI: bấm Duyệt
UI -> GroupController: approveJoinRequest(groupId, requestId, userId)
GroupController -> GroupService: approveJoinRequest(groupId, requestId, currentUserId)
GroupService -> JoinRepo: findById(requestId)
GroupService -> MemberRepo: save(GroupMember status=active)
MemberRepo -> DB: INSERT group_members
GroupService -> JoinRepo: save(status=approved)
JoinRepo -> DB: UPDATE group_join_requests
GroupService --> GroupController: GroupMemberResponse
GroupController --> UI: 200 OK
UI --> Manager: thành viên được thêm vào nhóm
@enduml
```

## UC26 - Xóa thành viên trong nhóm

```plantuml
@startuml
title UC26 - Xóa thành viên trong nhóm
actor "Sinh viên" as Manager
boundary "GroupDetailPage" as UI
control "GroupController" as GroupController
control "AuthenticatedUserService" as AuthUser
control "GroupService" as GroupService
database "GroupMemberRepository" as MemberRepo
database "Database" as DB

Manager -> UI: chọn thành viên cần xóa
UI -> GroupController: removeMember(groupId, memberId, userId)
GroupController -> AuthUser: getCurrentUserId()
AuthUser --> GroupController: currentUserId
GroupController -> GroupService: removeMember(groupId, memberId, currentUserId)
GroupService -> MemberRepo: findByGroupIdAndUserId(groupId, currentUserId)
GroupService -> MemberRepo: findById(memberId)
MemberRepo -> DB: SELECT group_members
DB --> MemberRepo: adminMember, targetMember
GroupService -> GroupService: kiểm tra quyền gold_key/silver_key
GroupService -> MemberRepo: delete(targetMember)
MemberRepo -> DB: DELETE group_members
GroupService --> GroupController: void
GroupController --> UI: 204 No Content
UI --> Manager: danh sách thành viên được cập nhật
@enduml
```

## UC27 - Báo cáo người dùng

```plantuml
@startuml
title UC27 - Báo cáo người dùng
actor "Sinh viên" as User
boundary "ReportButton" as UI
control "ReportController" as ReportController
control "AuthenticatedUserService" as AuthUser
control "ReportService" as ReportService
database "UserRepository" as UserRepo
database "ReportRepository" as ReportRepo
database "Database" as DB

User -> UI: mở modal báo cáo người dùng
UI -> ReportController: create(reporterId, ReportRequest targetType=user)
ReportController -> AuthUser: getCurrentUserId()
AuthUser --> ReportController: reporterId
ReportController -> ReportService: create(reporterId, request)
ReportService -> UserRepo: findById(targetUserId)
UserRepo -> DB: SELECT users WHERE id
ReportService -> ReportRepo: existsByReporterIdAndTargetTypeAndTargetIdAndStatus(...)
ReportRepo -> DB: SELECT reports
ReportService -> ReportRepo: save(report status=pending)
ReportRepo -> DB: INSERT reports
ReportService --> ReportController: ReportResponse
ReportController --> UI: 201 Created
UI --> User: báo cáo đã được gửi
@enduml
```

## UC28 - Báo cáo bài viết

```plantuml
@startuml
title UC28 - Báo cáo bài viết
actor "Sinh viên" as User
boundary "ReportButton" as UI
control "ReportController" as ReportController
control "AuthenticatedUserService" as AuthUser
control "ReportService" as ReportService
database "PostRepository" as PostRepo
database "ReportRepository" as ReportRepo
database "Database" as DB

User -> UI: mở modal báo cáo bài viết
UI -> ReportController: create(reporterId, ReportRequest targetType=post)
ReportController -> AuthUser: getCurrentUserId()
AuthUser --> ReportController: reporterId
ReportController -> ReportService: create(reporterId, request)
ReportService -> PostRepo: findById(targetPostId)
PostRepo -> DB: SELECT posts WHERE id
ReportService -> ReportRepo: existsByReporterIdAndTargetTypeAndTargetIdAndStatus(...)
ReportRepo -> DB: SELECT reports
ReportService -> ReportRepo: save(report status=pending)
ReportRepo -> DB: INSERT reports
ReportService --> ReportController: ReportResponse
ReportController --> UI: 201 Created
UI --> User: báo cáo bài viết đã được gửi
@enduml
```

## UC29 - Thêm sinh viên vào nhóm bằng file Excel

```plantuml
@startuml
title UC29 - Thêm sinh viên vào nhóm bằng file Excel
actor "Giảng viên/Đoàn khoa" as Manager
boundary "GroupDetailPage" as UI
control "GroupController" as GroupController
control "AuthenticatedUserService" as AuthUser
control "GroupService" as GroupService
database "UserRepository" as UserRepo
database "GroupMemberRepository" as MemberRepo
database "Database" as DB

Manager -> UI: chọn file Excel MSSV
UI -> GroupController: bulkInviteStudents(groupId, userId, file)
GroupController -> AuthUser: getCurrentUserId()
AuthUser --> GroupController: currentUserId
GroupController -> GroupService: validateStudentManager(groupId, currentUserId)
GroupService -> MemberRepo: findByGroupIdAndUserId(groupId, currentUserId)
MemberRepo -> DB: SELECT group_members
GroupService --> GroupController: GroupMember manager
GroupController -> GroupController: parseMssvFromExcel(file)
loop mỗi MSSV/email sinh viên
  GroupController -> UserRepo: findByEmail(studentEmail)
  UserRepo -> DB: SELECT users WHERE email
  alt đã có tài khoản
    GroupController -> GroupService: addStudentToGroup(groupId, studentId, currentUserId)
    GroupService -> MemberRepo: save(GroupMember)
    MemberRepo -> DB: INSERT group_members
  else chưa có tài khoản
    GroupController -> GroupController: sendStudentInviteEmail(email, groupName, inviteLink, qrImageUrl)
  end
end
GroupController --> UI: kết quả import thành công/lỗi
UI --> Manager: hiển thị thống kê nhập file
@enduml
```

## UC30 - Thêm cố vấn học tập vào nhóm

```plantuml
@startuml
title UC30 - Thêm cố vấn học tập vào nhóm
actor "Đoàn khoa" as FacultyUnion
boundary "GroupDetailPage" as UI
control "GroupController" as GroupController
control "AuthenticatedUserService" as AuthUser
control "GroupService" as GroupService
database "UserRepository" as UserRepo
database "GroupMemberRepository" as MemberRepo
database "Database" as DB

FacultyUnion -> UI: mở modal chọn cố vấn
UI -> GroupController: getAdvisorsByFaculty(userId)
GroupController -> AuthUser: getCurrentUserId()
GroupController -> UserRepo: findByRoleAndFaculty("advisor", faculty)
UserRepo -> DB: SELECT users WHERE role='advisor'
UserRepo --> GroupController: List<User>
GroupController --> UI: List<UserResponse>
FacultyUnion -> UI: chọn cố vấn và bấm Thêm
UI -> GroupController: addAdvisorToGroup(groupId, advisorId, userId)
GroupController -> AuthUser: getCurrentUserId()
AuthUser --> GroupController: currentUserId
GroupController -> GroupService: addAdvisorToGroup(groupId, advisorId, currentUserId)
GroupService -> UserRepo: findById(advisorId)
GroupService -> MemberRepo: findByGroupIdAndUserId(groupId, advisorId)
GroupService -> MemberRepo: save(GroupMember role=silver_key/advisor)
MemberRepo -> DB: INSERT/UPDATE group_members
GroupService --> GroupController: GroupMemberResponse
GroupController --> UI: 200 OK
UI --> FacultyUnion: cố vấn được thêm vào nhóm
@enduml
```

## UC31 - Tạo nhóm bằng file Excel

```plantuml
@startuml
title UC31 - Tạo nhóm bằng file Excel
actor "Đoàn khoa" as FacultyUnion
boundary "GroupsPage" as UI
control "GroupController" as GroupController
control "AuthenticatedUserService" as AuthUser
control "GroupService" as GroupService
database "GroupRepository" as GroupRepo
database "GroupMemberRepository" as MemberRepo
database "UserRepository" as UserRepo

FacultyUnion -> UI: nhập thông tin nhóm và chọn file Excel
UI -> GroupController: createGroup(body)
GroupController -> AuthUser: getCurrentUserId()
AuthUser --> GroupController: currentUserId
GroupController -> GroupService: createGroup(currentUserId, GroupRequest)
GroupService -> GroupRepo: save(group)
GroupService -> MemberRepo: save(owner membership)
GroupService --> GroupController: GroupResponse
GroupController --> UI: groupId
UI -> GroupController: bulkInviteStudents(groupId, userId, file)
GroupController -> GroupService: validateStudentManager(groupId, currentUserId)
GroupController -> GroupController: parseMssvFromExcel(file)
loop mỗi dòng Excel
  GroupController -> UserRepo: findByEmail(studentEmail)
  GroupController -> GroupService: addStudentToGroup(groupId, studentId, currentUserId)
  GroupService -> MemberRepo: save(GroupMember)
end
GroupController --> UI: kết quả tạo nhóm và nhập sinh viên
UI --> FacultyUnion: nhóm lớp được tạo hoàn tất
@enduml
```

## UC32 - Gửi thông báo đến các nhóm

```plantuml
@startuml
title UC32 - Gửi thông báo đến các nhóm
actor "Giảng viên/Đoàn khoa" as Manager
boundary "GroupsPage" as UI
control "GroupController" as GroupController
control "AuthenticatedUserService" as AuthUser
control "GroupService" as GroupService
database "GroupPostRepository" as GroupPostRepo
database "GroupNotificationRepository" as NotiRepo
database "Database" as DB

Manager -> UI: nhập nội dung thông báo và chọn nhóm
loop mỗi groupId được chọn
  UI -> GroupController: createGroupAnnouncement(groupId, userId, PostRequest)
  GroupController -> AuthUser: getCurrentUserId()
  AuthUser --> GroupController: currentUserId
  GroupController -> GroupService: createGroupAnnouncement(groupId, currentUserId, request)
  GroupService -> GroupService: kiểm tra quyền gửi thông báo nhóm
  GroupService -> GroupPostRepo: save(GroupPost announcement)
  GroupPostRepo -> DB: INSERT group_posts/posts
  GroupService -> NotiRepo: save(GroupNotification)
  NotiRepo -> DB: INSERT group_notifications
  GroupService --> GroupController: GroupPostResponse
  GroupController --> UI: 201 Created
end
UI --> Manager: thông báo đã gửi đến các nhóm
@enduml
```

## UC33 - Gửi thông báo cho các đoàn khoa

```plantuml
@startuml
title UC33 - Gửi thông báo cho các đoàn khoa
actor "Đoàn Trường" as SchoolUnion
boundary "GroupsPage" as UI
control "UserController" as UserController
control "UserService" as UserService
control "GroupController" as GroupController
control "GroupService" as GroupService
database "UserRepository" as UserRepo
database "GroupNotificationRepository" as NotiRepo

SchoolUnion -> UI: chọn danh sách Đoàn khoa nhận thông báo
UI -> UserController: getFacultyUnions(requesterId)
UserController -> UserService: getFacultyUnionsForSchoolUnion(currentUserId)
UserService -> UserRepo: findByRole("faculty_union")
UserRepo --> UserService: List<User>
UserService --> UserController: List<UserResponse>
UserController --> UI: danh sách Đoàn khoa
loop mỗi nhóm/đơn vị nhận thông báo
  UI -> GroupController: createGroupAnnouncement(groupId, currentUserId, request)
  GroupController -> GroupService: createGroupAnnouncement(groupId, currentUserId, request)
  GroupService -> NotiRepo: save(GroupNotification)
  GroupService --> GroupController: GroupPostResponse
  GroupController --> UI: 201 Created
end
UI --> SchoolUnion: hiển thị trạng thái phát hành
@enduml
```

## UC34 - Phê duyệt báo cáo người dùng

```plantuml
@startuml
title UC34 - Phê duyệt báo cáo người dùng
actor "Admin" as Admin
boundary "AdminReportsPage" as UI
control "ReportController" as ReportController
control "AuthenticatedUserService" as AuthUser
control "ReportService" as ReportService
database "ReportRepository" as ReportRepo
database "UserRepository" as UserRepo
database "Database" as DB

Admin -> UI: mở danh sách báo cáo người dùng
UI -> ReportController: list(adminId, status, page, size)
ReportController -> AuthUser: getCurrentUserId()
AuthUser --> ReportController: adminId
ReportController -> ReportService: list(adminId, status, page, size)
ReportService -> UserRepo: findById(adminId)
ReportService -> ReportRepo: findByStatusOrderByCreatedAtDesc(status, pageable)
ReportRepo -> DB: SELECT reports
ReportService --> ReportController: List<ReportResponse>
ReportController --> UI: reports
Admin -> UI: chọn xử lý báo cáo
UI -> ReportController: resolve(reportId, adminId, ReportResolveRequest)
ReportController -> ReportService: resolve(reportId, adminId, request)
ReportService -> ReportRepo: findById(reportId)
ReportService -> ReportService: inspectTarget("user", targetId, adminId)
alt action = delete_target
  ReportService -> UserRepo: delete(targetUser)
end
ReportService -> ReportRepo: save(report resolved)
ReportRepo -> DB: UPDATE reports
ReportService --> ReportController: ReportResponse
ReportController --> UI: 200 OK
UI --> Admin: báo cáo đã được xử lý
@enduml
```

## UC35 - Xem danh sách bài viết

```plantuml
@startuml
title UC35 - Xem danh sách bài viết
actor "Admin" as Admin
boundary "AdminPage" as UI
control "AdminController" as AdminController
control "AuthenticatedUserService" as AuthUser
control "AdminService" as AdminService
database "PostRepository" as PostRepo
database "PostCommentRepository" as CommentRepo
database "GroupPostRepository" as GroupPostRepo
database "Database" as DB

Admin -> UI: mở tab Bài viết
UI -> AdminController: posts(adminId, q, visibility, page, size)
AdminController -> AuthUser: getCurrentUserId()
AuthUser --> AdminController: adminId
AdminController -> AdminService: listPosts(adminId, q, visibility, page, size)
AdminService -> AdminService: requireAdmin(adminId)
AdminService -> PostRepo: findAll()
PostRepo -> DB: SELECT posts
DB --> PostRepo: List<Post>
AdminService -> CommentRepo: countByPostId(postId)
AdminService -> GroupPostRepo: findByPostId(postId)
AdminService --> AdminController: List<Map<String,Object>>
AdminController --> UI: 200 OK
UI --> Admin: hiển thị danh sách bài viết
@enduml
```

## UC36 - Xóa bài viết (Kiểm duyệt)

```plantuml
@startuml
title UC36 - Xóa bài viết (Kiểm duyệt)
actor "Admin" as Admin
boundary "AdminPage" as UI
control "AdminController" as AdminController
control "AuthenticatedUserService" as AuthUser
control "AdminService" as AdminService
control "CloudinaryCleanupService" as Cleanup
database "PostRepository" as PostRepo
database "Database" as DB

Admin -> UI: chọn bài viết cần xóa
UI -> AdminController: deletePost(adminId, id)
AdminController -> AuthUser: getCurrentUserId()
AuthUser --> AdminController: adminId
AdminController -> AdminService: deletePost(adminId, id)
AdminService -> AdminService: requireAdmin(adminId)
AdminService -> Cleanup: schedulePostAssets(id)
AdminService -> PostRepo: findById(id)
PostRepo -> DB: SELECT posts WHERE id
DB --> PostRepo: Post
AdminService -> PostRepo: delete(post)
PostRepo -> DB: DELETE posts
AdminService --> AdminController: void
AdminController --> UI: 204 No Content
UI --> Admin: danh sách bài viết được làm mới
@enduml
```

## UC37 - Xem danh sách người dùng

```plantuml
@startuml
title UC37 - Xem danh sách người dùng
actor "Admin" as Admin
boundary "AdminPage" as UI
control "AdminController" as AdminController
control "AuthenticatedUserService" as AuthUser
control "AdminService" as AdminService
database "UserRepository" as UserRepo
database "Database" as DB

Admin -> UI: mở tab Người dùng
UI -> AdminController: users(adminId, q, role, status, page, size)
AdminController -> AuthUser: getCurrentUserId()
AuthUser --> AdminController: adminId
AdminController -> AdminService: listUsers(adminId, q, role, status, page, size)
AdminService -> AdminService: requireAdmin(adminId)
AdminService -> UserRepo: findAll()
UserRepo -> DB: SELECT users
DB --> UserRepo: List<User>
AdminService -> AdminService: lọc theo q, role, status
AdminService --> AdminController: List<Map<String,Object>>
AdminController --> UI: 200 OK
UI --> Admin: hiển thị bảng người dùng
@enduml
```

## UC38 - Xóa người dùng

```plantuml
@startuml
title UC38 - Xóa người dùng
actor "Admin" as Admin
boundary "AdminPage" as UI
control "AdminController" as AdminController
control "AuthenticatedUserService" as AuthUser
control "AdminService" as AdminService
control "CloudinaryCleanupService" as Cleanup
database "UserRepository" as UserRepo
database "GroupRepository" as GroupRepo
database "MessageRepository" as MessageRepo
database "ReportRepository" as ReportRepo
database "OtpTokenRepository" as OtpRepo
database "Database" as DB

Admin -> UI: chọn tài khoản và bấm Xóa
UI -> AdminController: deleteUser(adminId, id)
AdminController -> AuthUser: getCurrentUserId()
AuthUser --> AdminController: adminId
AdminController -> AdminService: deleteUser(adminId, id)
AdminService -> AdminService: requireAdmin(adminId)
AdminService -> UserRepo: findById(id)
UserRepo -> DB: SELECT users WHERE id
DB --> UserRepo: targetUser
AdminService -> Cleanup: scheduleUserAssets(id)
AdminService -> GroupRepo: findByCreatorId(id)
AdminService -> MessageRepo: deleteBySenderIdOrReceiverId(id, id)
AdminService -> ReportRepo: deleteByTargetOwnerId(id)
AdminService -> OtpRepo: deleteByEmail(target.email)
AdminService -> UserRepo: delete(targetUser)
UserRepo -> DB: DELETE users
AdminService --> AdminController: void
AdminController --> UI: 204 No Content
UI --> Admin: tài khoản bị xóa khỏi danh sách
@enduml
```

## UC39 - Khóa người dùng

```plantuml
@startuml
title UC39 - Khóa người dùng
actor "Admin" as Admin
boundary "AdminPage" as UI
control "AdminController" as AdminController
control "AuthenticatedUserService" as AuthUser
control "AdminService" as AdminService
database "UserRepository" as UserRepo
database "Database" as DB

Admin -> UI: bật/tắt khóa tài khoản
UI -> AdminController: lock(adminId, id, locked)
AdminController -> AuthUser: getCurrentUserId()
AuthUser --> AdminController: adminId
AdminController -> AdminService: setUserLocked(adminId, id, locked)
AdminService -> AdminService: requireAdmin(adminId)
AdminService -> UserRepo: findById(id)
UserRepo -> DB: SELECT users WHERE id
DB --> UserRepo: targetUser
AdminService -> AdminService: kiểm tra không khóa admin/chính mình
AdminService -> UserRepo: save(targetUser accountLocked=locked)
UserRepo -> DB: UPDATE users.account_locked
DB --> UserRepo: User
AdminService --> AdminController: userMap(targetUser)
AdminController --> UI: 200 OK
UI --> Admin: trạng thái tài khoản được cập nhật
@enduml
```
