# Code tour de quay demo NLU Social

Muc tieu cua file nay: dung de doc code khi quay video, khong can mo tung file lung tung. Cach noi chung:

> Moi chuc nang di qua frontend -> `api.ts` -> controller -> service -> repository/entity. Khi thuyet trinh code, chi can mo file chinh va noi ham chinh lam gi.

## 1. Nen mo file nao trong 20-23 phut code tour

Neu chi co thoi gian ngan, nen mo cac file sau:

| Thu tu | File | Ly do mo |
| --- | --- | --- |
| 1 | `frontend/src/App.tsx` | Khai bao route, session user, logout, theme, mini chat. |
| 2 | `frontend/src/lib/api.ts` | Tat ca frontend goi backend qua day. Day la file nen noi nhieu nhat o FE. |
| 3 | `backend/src/main/java/com/app/backend/config/SecurityConfig.java` | Cau hinh bao mat, endpoint public/private, admin role. |
| 4 | `backend/src/main/java/com/app/backend/config/AuthTokenFilter.java` | Kiem tra token, lay user hien tai, chan gia mao userId. |
| 5 | `backend/src/main/java/com/app/backend/controller/AuthController.java` | Dang ky OTP, dang nhap, lay thong tin user hien tai. |
| 6 | `backend/src/main/java/com/app/backend/service/UserService.java` | Xu ly dang ky, dang nhap, cap nhat ho so, doi mat khau. |
| 7 | `backend/src/main/java/com/app/backend/controller/PostController.java` | API bai viet, comment, like. |
| 8 | `backend/src/main/java/com/app/backend/service/PostService.java` | Nghiep vu feed, dang/sua/xoa bai, comment, like, media. |
| 9 | `backend/src/main/java/com/app/backend/controller/GroupController.java` | Nhom, thanh vien, bai nhom, invite advisor/student, Excel. |
| 10 | `backend/src/main/java/com/app/backend/service/GroupService.java` | Xu ly nghiep vu nhom. |
| 11 | `backend/src/main/java/com/app/backend/controller/MessageController.java` | API chat ca nhan/chat nhom. |
| 12 | `backend/src/main/java/com/app/backend/service/MessageService.java` | Luu va lay tin nhan, thu hoi tin nhan. |
| 13 | `backend/src/main/java/com/app/backend/service/ChatWebSocketHandler.java` | Day thong bao chat realtime qua WebSocket. |
| 14 | `backend/src/main/java/com/app/backend/controller/AdminController.java` | API quan tri: thong ke, khoa/xoa user, xoa bai/comment. |
| 15 | `backend/src/main/java/com/app/backend/service/AdminService.java` | Nghiep vu admin. |

## 2. Frontend src

### File goc

| File | Chuc nang | Ham/chuyen dong chinh |
| --- | --- | --- |
| `frontend/src/main.tsx` | Diem vao React app. | Render `<App />` vao DOM. |
| `frontend/src/App.tsx` | Dinh nghia route, quan ly session dang nhap, theme, mini chat. | `handleLogout()` xoa token va user; `openMiniChat()`/`openMiniGroupChat()` mo chat nho; `closeMiniChat()` dong chat; `toggleMiniChat()` thu nho/phong chat; cac `<Route>` dieu huong trang. |
| `frontend/src/types.ts` | Khai bao type TypeScript dung chung. | `User`, `Post`, `Group`, `Message`, `ReportItem`, `AdminStats`... giup FE biet shape data backend tra ve. |

### Frontend lib va hook

| File | Chuc nang | Ham/chuyen dong chinh |
| --- | --- | --- |
| `frontend/src/lib/api.ts` | Wrapper API tap trung cua frontend. | `request<T>()` gan `Content-Type`, lay `social_token`, gan `Authorization`, parse response va throw loi; `login()`, `register()`, `createPost()`, `toggleLike()`, `sendMessage()`, `createGroup()`, `bulkInviteStudents()`, `resolveReport()`... la cac ham map voi API backend. |
| `frontend/src/lib/upload.ts` | Upload file/media len backend/Cloudinary. | `uploadFileDirect()` upload co progress; `uploadFileUrl()` tra ve URL de gan vao post/comment/message. |
| `frontend/src/lib/userRole.ts` | Xu ly nhan/quyen theo role. | Ham/constant label role, check role de hien menu va quyen. |
| `frontend/src/lib/academicCatalog.ts` | Du lieu/phu tro hoc vu. | `ACADEMIC_YEAR_OPTIONS`, `campusLabel()` dung trong dang ky/cap nhat ho so. |
| `frontend/src/lib/feedback.ts` | Quan ly feedback/toast global. | Dung de hien thong bao thanh cong/loi. |
| `frontend/src/hooks/useModalScrollLock.ts` | Khoa scroll body khi modal mo. | `useModalScrollLock(active)` set/restore overflow cua document. |

### Frontend pages

| File | Chuc nang | Ham/chuyen dong chinh |
| --- | --- | --- |
| `frontend/src/pages/LoginPage.tsx` | Man hinh dang nhap. | Submit form goi `api.login()`, luu `social_token`, goi `onAuth()`, navigate vao app. |
| `frontend/src/pages/RegisterPage.tsx` | Dang ky theo 3 buoc: email/role -> OTP -> thong tin ca nhan. | `validateEmail()` check email theo role; `handleRequestOtp()` goi `api.requestRegistrationOtp()`; `handleVerifyOtp()` chuyen sang buoc details; `handleCompleteRegistration()` goi `api.register()`; upload avatar/cover qua `uploadFileUrl()`. |
| `frontend/src/pages/HomePage.tsx` | Bang tin trang chu. | `loadFeed()` lay feed, share, friend request, group; `handleCreatePoll()` tao poll; `handleComposerSuccess()` reload feed sau dang bai; `likePost()`, `submitComment()`, `submitReply()`, `toggleCommentLike()` xu ly tuong tac bai viet. |
| `frontend/src/pages/UserProfilePage.tsx` | Trang ho so nguoi dung khac/ban than. | `loadProfile()` lay ho so va bai viet; `refreshStatus()` lay trang thai ket ban; `sendRequest()`, `acceptRequest()`, `rejectRequest()`, `unfriend()` xu ly ket ban; cac ham comment/like giong feed. |
| `frontend/src/pages/ProfilePage.tsx` | Trang profile cu/hoac profile rieng. | `loadFeed()` lay bai ca nhan; `loadUserShares()` lay bai da chia se; `deleteShare()` xoa share. |
| `frontend/src/pages/SettingsPage.tsx` | Cap nhat thong tin ca nhan. | `submit()` goi `api.updateProfile()`; `handleAvatarUpload()`/`handleCoverUpload()` upload anh va update profile; `removeProfileImage()` xoa avatar/cover. |
| `frontend/src/pages/PrivacyPage.tsx` | Cai dat rieng tu/tai khoan. | Goi API lien quan account protection va block list. |
| `frontend/src/pages/FriendsPage.tsx` | Quan ly ban be. | Load danh sach ban, loi moi; goi API chap nhan/tu choi/huy ket ban. |
| `frontend/src/pages/SearchPage.tsx` | Tim kiem user va bai viet. | Doc query tu URL; goi song song `api.searchUsers()` va `api.searchPosts()`; `changeTab()` doi tab all/users/posts. |
| `frontend/src/pages/ChatPage.tsx` | Trang chat lon. | Load conversation/group messages; ket noi WebSocket; goi `api.sendMessage()`/`api.sendGroupMessage()`; thu hoi tin nhan qua `api.recallMessage()`. |
| `frontend/src/pages/GroupsPage.tsx` | Danh sach nhom, tao/tim/tham gia nhom. | Load public groups/my groups/pending requests; goi `api.createGroup()`, `api.joinGroup()`, `api.searchGroups()`. |
| `frontend/src/pages/GroupDetailPage.tsx` | Chi tiet nhom: bai nhom, thanh vien, duyet, invite. | Load group/posts/members; goi `api.createGroupPost()`, `api.createGroupPoll()`, `api.approveJoinRequest()`, `api.bulkInviteStudents()`, `api.addAdvisorToGroup()`, `api.inviteStudent()`. |
| `frontend/src/pages/GroupPostDetailPage.tsx` | Chi tiet mot bai trong nhom. | Load bai nhom, comment/like/share cua bai nhom. |
| `frontend/src/pages/PostDetailPage.tsx` | Chi tiet mot bai viet ca nhan. | Load post theo id; comment/like/share. |
| `frontend/src/pages/AdminPage.tsx` | Dashboard admin. | Load `api.getAdminStats()`, `api.getAdminUsers()`, `api.getAdminGroups()`, `api.getAdminPosts()`, `api.getAdminComments()`; khoa/xoa user/post/comment. |
| `frontend/src/pages/AdminReportsPage.tsx` | Trang bao cao admin neu dung rieng. | Load report, resolve/dismiss/delete target. |

### Frontend components

| File | Chuc nang | Ham/chuyen dong chinh |
| --- | --- | --- |
| `frontend/src/components/AppLayout.tsx` | Layout sau dang nhap: topbar, search, notification, avatar menu, mini chat dock. | `submitSearch()` navigate search; `loadNotifications()` lay thong bao chung/nhom moi 5s; `handleNotificationClick()` danh dau da doc va dieu huong; `handleMarkAllRead()` danh dau tat ca; effect auto mo mini chat khi co tin nhan chua doc. |
| `frontend/src/components/AuthCard.tsx` | Khung UI dung cho login/register. | Render title, subtitle, form, footer. |
| `frontend/src/components/BulkMessageModal.tsx` | Modal gui thong bao hang loat cho doan khoa. | `loadFacultyUnions()` lay danh sach doan khoa; `handleFileChange()` chon media; `toggleRecipient()` chon nguoi nhan; `selectAll()` chon tat ca; `handleSend()` gui message/thong bao den cac recipient da chon. |
| `frontend/src/components/ChatComposer.tsx` | O nhap chat co file, emoji, mention. | `updateMentionQuery()` phat hien dang go `@`; `selectMention()` chen mention; `handleFileSelect()` upload file; `handleSend()` goi `onSend`; `handleKeyDown()` Enter gui tin/di chuyen mention. |
| `frontend/src/components/ChatMessage.tsx` | Render mot bong chat. | `getMediaType()` nhan dien anh/video/file; `formatTime()` format gio; `handleContextMenu()` mo menu recall; `renderContent()` highlight mention; nut recall goi `onRecall()`. |
| `frontend/src/components/MiniChat.tsx` | Chat nho o goc man hinh. | `loadChat()` lay profile va conversation; `loadGroupInfo()` lay group; `send()` goi API gui chat ca nhan/nhom. |
| `frontend/src/components/GroupChat.tsx` | Khung chat nhom trong group. | Load tin nhan nhom, join/leave room, gui tin nhan nhom, recall. |
| `frontend/src/components/PostComposerModal.tsx` | Modal tao/sua bai viet. | Quan ly noi dung/media/visibility; submit goi `api.createPost()` hoac `api.updatePost()`; mo `PollCreator` neu tao poll. |
| `frontend/src/components/PostComposer.tsx` | Form composer bai viet dang inline. | Chon media, submit bai, reset form. |
| `frontend/src/components/PostComposerBar.tsx` | Thanh goi mo composer. | Click de mo modal tao bai. |
| `frontend/src/components/PostCard.tsx` | Card hien thi bai viet trong feed/profile. | Nut like/comment/share/edit/delete; render media, poll, comment; goi callback tu page. |
| `frontend/src/components/PostMediaSection.tsx` | Hien thi media cua bai viet. | Render anh/video/file, click anh de mo viewer. |
| `frontend/src/components/PollCreator.tsx` | UI tao poll. | Quan ly option, ngay ket thuc, multiple choice; submit poll data. |
| `frontend/src/components/PollCard.tsx` | UI hien poll va ket qua. | Chon option, goi vote, hien ty le/so vote. |
| `frontend/src/components/ShareModal.tsx` | Modal chia se bai viet. | `handleShare()` goi `api.sharePost()`, chon visibility/group. |
| `frontend/src/components/ShareCard.tsx` | Hien thi bai da chia se. | Render nguoi share + bai goc, link ve bai goc. |
| `frontend/src/components/ReportButton.tsx` | Nut bao cao noi dung. | Mo form report, goi `api.createReport()`. |
| `frontend/src/components/ProfileHeader.tsx` | Header ho so. | Hien cover/avatar/name/role/action. |
| `frontend/src/components/ProfileImagePicker.tsx` | Chon avatar/cover. | Goi callback `onAvatarSelect`, `onCoverSelect`, `onAvatarRemove`, `onCoverRemove`. |
| `frontend/src/components/SearchableSelect.tsx` | Select co tim kiem. | Loc option theo keyword, goi `onChange()` khi chon. |
| `frontend/src/components/MediaViewer.tsx` | Viewer media dang carousel. | `handlePrev()`, `handleNext()`, `renderMedia()`, `formatFileSize()`. |
| `frontend/src/components/CommentMediaSection.tsx` | Hien media trong comment. | `inferType()` nhan dien file; render anh/video/link file. |
| `frontend/src/components/CommentDraftMedia.tsx` | Preview media dang chon cho comment. | `inferType()`, `fileName()`, nut remove. |
| `frontend/src/components/LinkifiedText.tsx` | Bien link trong text thanh the link. | Parse URL trong noi dung text. |
| `frontend/src/components/FormField.tsx` | Field form dung chung. | Render label, input, error. |
| `frontend/src/components/FeedbackHost.tsx` | Noi hien feedback/toast. | Subscribe feedback va render message. |
| `frontend/src/components/GlobalUploadProgress.tsx` | Hien tien do upload toan cuc. | Render progress khi upload file. |
| `frontend/src/components/GroupPostCard.tsx` | Card bai viet trong nhom. | Like/comment/share/approve/reject/delete bai nhom. |

## 3. Backend src

### Backend entry va config

| File | Chuc nang | Ham/chuyen dong chinh |
| --- | --- | --- |
| `BackendApplication.java` | Diem chay Spring Boot. | `main()` goi `SpringApplication.run()`. |
| `config/SecurityConfig.java` | Cau hinh security va CORS. | `filterChain()` tat CSRF, mo public endpoint auth/catalog/ws, yeu cau admin cho `/api/admin/**`, gan `AuthTokenFilter`; `corsConfigurationSource()` cho phep frontend localhost. |
| `config/AuthTokenFilter.java` | Loc request truoc controller. | `shouldNotFilter()` bo qua endpoint public; `doFilterInternal()` doc Bearer token, parse userId, check account locked, check userId trong body/query/path khong gia mao, set authentication; `guardJsonBody()` chan body co userId khac token; `guardRequestIdentity()` chan query/path userId sai. |
| `config/WebSocketConfig.java` | Dang ky WebSocket. | Dang ky handler cho `/ws/chat`. |
| `config/CloudinaryConfig.java` | Cau hinh Cloudinary. | Tao bean Cloudinary tu properties. |
| `config/AdminBootstrapInitializer.java` | Tao admin ban dau neu co env. | Khi app start, doc env admin email/password va tao admin neu chua co. |
| `config/ReportSchemaInitializer.java` | Khoi tao/cap nhat schema report. | Dam bao bang/cot report ton tai neu DB chua cap nhat. |

### Backend controllers

| File | Chuc nang | Ham/chuyen dong chinh |
| --- | --- | --- |
| `controller/AuthController.java` | API dang ky/dang nhap. | `requestRegistrationOtp()` validate email va gui OTP; `resendRegistrationOtp()` gui lai OTP; `register()` verify OTP roi goi `UserService.register()` va tao token; `login()` goi `UserService.login()` va tao token; `me()` tra user hien tai. |
| `controller/UserController.java` | API ho so nguoi dung. | `getProfile()` lay profile; `searchUsers()` tim user; `getFacultyUnions()` lay doan khoa; `updateProfile()` cap nhat ho so; `changePassword()` doi mat khau; `setProtection()` bat/tat bao ve tai khoan. |
| `controller/PostController.java` | API feed/bai viet/comment/like. | `getFeed()`, `searchPosts()`, `getUserPosts()` lay danh sach bai; `createCurrentUserPost()`/`createPost()` tao bai; `updatePost()` sua; `deletePost()` xoa; `addComment()`, `replyComment()`, `updateComment()`, `deleteComment()`; `toggleLike()` va `toggleCommentLike()`. |
| `controller/PollController.java` | API poll. | `createPoll()` tao poll; `vote()` binh chon; `getResults()` lay ket qua; `removeVote()` huy vote. |
| `controller/ShareController.java` | API chia se bai. | `sharePost()` chia se; `getPostShares()`, `getShareCount()`, `getShareStatus()`; `deleteShare()`; `getSharesForFeed()`, `getGroupShares()`, `getUserShares()`. |
| `controller/FriendshipController.java` | API ket ban. | `sendFriendRequest()`/`sendRequest()` gui loi moi; `acceptRequest()` chap nhan; `rejectOrCancelRequest()` tu choi/huy; `getPendingRequests()`, `getFriends()`, `getFriendshipStatus()`, `unfriend()`. |
| `controller/MessageController.java` | API chat ca nhan/chat nhom. | `sendCurrentUserMessage()`/`sendMessage()` luu tin va notify WebSocket; `getUserMessages()`, `getConversations()`, `getUnreadMessages()`, `markConversationRead()`; `recallMessage()` thu hoi; `sendGroupMessage()`, `getGroupMessages()`, `joinGroupChat()`, `leaveGroupChat()`. |
| `controller/GroupController.java` | API nhom. | `createGroup()`, `getGroup()`, `updateGroup()`, `deleteGroup()`; `getPublicGroups()`, `getUserGroups()`, `searchGroups()`; `joinGroup()`, `leaveGroup()`, `approveJoinRequest()`, `rejectJoinRequest()`, `removeMember()`; `createGroupPost()`, `createGroupAnnouncement()`, `createGroupPoll()`; `bulkInviteStudents()` doc Excel va moi/them sinh vien; `addAdvisorToGroup()`/`inviteAdvisor()` them/moi co van; `inviteStudent()` moi 1 sinh vien. |
| `controller/NotificationController.java` | API thong bao chung. | `getNotifications()`, `getUnreadCount()`, `markRead()`, `markAllRead()`. |
| `controller/BlockController.java` | API chan nguoi dung. | `getBlocks()`, `blockUser()`, `unblockUser()`. |
| `controller/FileUploadController.java` | API upload/signature. | `upload()` upload file qua backend; `signature()` lay signature Cloudinary; `registrationSignature()` signature khi chua dang nhap. |
| `controller/CatalogController.java` | API danh muc khoa/nganh. | `getFaculties()`, `getMajors()` tra danh sach khoa/nganh cho dang ky/profile. |
| `controller/ReportController.java` | API bao cao va xu ly report. | `create()` tao report; `list()` admin xem report; `stats()` dem report; `resolve()` admin dismiss/resolve/delete target. |
| `controller/AdminController.java` | API quan tri he thong. | `stats()` dashboard; `users()`, `groups()`, `posts()`, `comments()` list admin; `lock()` khoa/mo user; `deleteUser()`, `deleteGroup()`, `deletePost()`, `deleteComment()`. |

### Backend services

| File | Chuc nang | Ham/chuyen dong chinh |
| --- | --- | --- |
| `service/UserService.java` | Nghiep vu user/auth/profile. | `isEmailRegistered()` check email; `register()` tao user; `login()` check password; `getProfile()` lay profile; `searchUsers()` tim user; `updateProfile()` cap nhat profile; `validateRegistrationEmail()` validate email theo role; `applyRoleProfileFields()` set thong tin theo role; `changePassword()` doi mat khau; `setAccountProtection()` bat/tat bao ve; `toResponse()` map entity sang DTO. |
| `service/OtpService.java` | Tao, gui, verify OTP. | `generateOtpCode()` sinh OTP; `createOtpToken()` luu OTP; `sendRegistrationOtp()` gui OTP; `sendOtpEmail()` gui email; `verifyOtp()` kiem tra OTP; `canResendOtp()`, `getResendCooldownRemaining()`, `resendOtp()`, `cleanupExpiredOtps()`. |
| `service/AuthTokenService.java` | Tao/parse token dang nhap. | `createToken()` tao token; `parseUserId()` doc userId tu token va validate thoi han/chuk ky. |
| `service/AuthenticatedUserService.java` | Lay user hien tai tu Spring Security. | `getCurrentUserId()` doc authentication do `AuthTokenFilter` set. |
| `service/PostService.java` | Nghiep vu bai viet. | `getFeed()`, `searchPosts()`, `getPostsByUser()`; `createPost()`, `updatePost()`, `deletePost()`; `toggleLike()`; `addComment()`, `updateComment()`, `deleteComment()`, `getComments()`, `toggleCommentLike()`; `saveMedia()` luu media bai; `saveCommentMedia()` luu media comment; `toFeedResponse()`, `toResponse()`, `toCommentResponse()` map DTO. |
| `service/PollService.java` | Nghiep vu poll. | `createPoll()` tao post dang poll va option; `vote()` luu vote, xu ly single/multiple; `getPollResults()` tinh ket qua; `removeVote()` huy vote; `normalizeOptions()` loc option hop le. |
| `service/ShareService.java` | Nghiep vu chia se. | `sharePost()` tao record share va notify author; `getPostShares()`, `getShareCount()`, `hasUserShared()`, `deleteShare()`; `getSharesForFeed()`, `getGroupShares()`, `getUserShares()`; `toShareResponse()` map DTO. |
| `service/FriendshipService.java` | Nghiep vu ket ban. | `sendRequest()` gui loi moi; `cancelRequest()` huy; `acceptRequest()` chap nhan; `rejectRequest()` tu choi; `rejectOrCancelRequestByFriendshipId()` xu ly theo id; `getPendingRequests()`, `getFriends()`, `getFriendshipStatus()`, `getFriendshipBetween()`. |
| `service/MessageService.java` | Nghiep vu tin nhan. | `sendMessage()` luu tin ca nhan; `getConversation()` lay hoi thoai; `getUnreadMessages()`, `getConversations()`, `markAsRead()`, `markConversationAsRead()`; `recallMessage()` thu hoi; `sendGroupMessage()` luu tin nhom va mention; `getGroupMessages()`, `getGroupMessagesSince()`; `toResponse()` map DTO. |
| `service/ChatWebSocketHandler.java` | Kenh realtime chat. | `handleTextMessage()` nhan auth/ping; `notifyUser()` gui su kien ca nhan; `joinGroupChatRoom()`, `leaveGroupChatRoom()`, `notifyGroupChat()` gui su kien nhom; `afterConnectionClosed()` cleanup session. |
| `service/GroupService.java` | Nghiep vu nhom lon nhat project. | `createGroup()`, `getGroup()`, `updateGroup()`, `deleteGroup()`; `getPublicGroups()`, `getUserGroups()`, `searchGroups()`; `joinGroup()`, `approveJoinRequest()`, `rejectJoinRequest()`, `removeMember()`, `leaveGroup()`; `addStudentToGroup()` them sinh vien vao nhom; `addAdvisorToGroup()` them co van; `createGroupPost()`, `createGroupAnnouncement()`, `createGroupPoll()`; `getGroupPosts()`, `approveGroupPost()`, `rejectGroupPost()`, `deleteGroupPost()`; `toggleLikeOnGroupPost()`, `addCommentToGroupPost()`; `getGroupNotifications()`, `getUnreadGroupNotificationCount()`, `getGroupMembers()`. |
| `service/NotificationService.java` | Tao va lay thong bao chung. | `createFriendRequestNotification()`, `createFriendAcceptedNotification()`, `createPostLikeNotification()`, `createPostCommentNotification()`, `createNewPostNotification()`, `createShareNotification()`, `createCommentReplyNotification()`, `createCommentLikeNotification()`; `getNotifications()`, `getUnreadCount()`. |
| `service/PrivacyAccessService.java` | Kiem tra quyen xem/nhan tin. | `normalizeScope()`, `normalizeGroupPrivacy()`; `isFriend()`, `isBlocked()`; `canViewProfilePosts()`, `canMessage()`, `canViewGroup()`, `canViewPost()`, `canViewGroupPost()`, `canViewShare()`; `requirePostAccess()`, `requireGroupAccess()`. |
| `service/BlockService.java` | Nghiep vu chan user. | Lay danh sach block, chan, bo chan. |
| `service/CloudinaryStorageService.java` | Upload file len Cloudinary. | `upload()` validate folder/file va tra `UploadResult`. |
| `service/CloudinaryCleanupService.java` | Xoa media cu tren Cloudinary. | Dung khi update/xoa avatar, cover, post media, message media. |
| `service/ReportService.java` | Nghiep vu report. | `create()` tao report va snapshot target; `list()` admin xem report; `stats()` dem; `resolve()` xu ly report; `inspectTarget()` lay thong tin doi tuong bi report; `deleteTarget()` xoa target neu admin chon. |
| `service/AdminService.java` | Nghiep vu admin. | `stats()` thong ke; `users()`, `groups()`, `posts()`, `comments()` list du lieu; `setUserLocked()` khoa/mo user; `deleteUser()`, `deleteGroup()`, `deletePost()`, `deleteComment()`. |

### Backend entities

| File | Chuc nang |
| --- | --- |
| `entity/User.java` | Bang `users`: email, password, role, avatar, cover, bio, faculty/class/year, major, account protection/locked. |
| `entity/Post.java` | Bang `posts`: bai viet ca nhan, visibility, author, poll fields. |
| `entity/PostMedia.java` | Media cua bai viet: image/video/file URL. |
| `entity/PostComment.java` | Comment/reply cua bai viet. |
| `entity/CommentMedia.java` | Media dinh kem comment. |
| `entity/PostLike.java` | Like bai viet. |
| `entity/CommentLike.java` | Like comment. |
| `entity/PostShare.java` | Ban ghi chia se bai viet. |
| `entity/PollOption.java` | Option cua poll. |
| `entity/PollVote.java` | Vote cua user cho option poll. |
| `entity/Friendship.java` | Loi moi/trang thai ket ban. |
| `entity/Message.java` | Tin nhan ca nhan/nhom, media, recall, mention. |
| `entity/Notification.java` | Thong bao chung. |
| `entity/Group.java` | Bang `groups`: ten, mo ta, privacy, creator, approval required. |
| `entity/GroupMember.java` | Thanh vien nhom va role trong nhom. |
| `entity/GroupJoinRequest.java` | Yeu cau xin vao nhom. |
| `entity/GroupPost.java` | Bai viet trong nhom. |
| `entity/GroupNotification.java` | Thong bao rieng cua nhom. |
| `entity/GroupBan.java` | User bi cam trong nhom. |
| `entity/Block.java` | Quan he chan user. |
| `entity/OtpToken.java` | OTP dang ky, thoi han, attempts. |
| `entity/Report.java` | Bao cao vi pham va trang thai xu ly. |
| `entity/Faculty.java` | Danh muc khoa. |
| `entity/Major.java` | Danh muc nganh, lien ket khoa. |

### Backend repositories

Repository la lop thao tac DB. Khi thuyet trinh, chi can noi: service goi repository de tim/luu/xoa entity.

| Nhom | Files |
| --- | --- |
| User/auth/catalog | `UserRepository`, `OtpTokenRepository`, `FacultyRepository`, `MajorRepository` |
| Post/feed | `PostRepository`, `PostMediaRepository`, `PostCommentRepository`, `CommentMediaRepository`, `PostLikeRepository`, `CommentLikeRepository`, `PostShareRepository` |
| Poll | `PollOptionRepository`, `PollVoteRepository` |
| Friend/privacy/block | `FriendshipRepository`, `BlockRepository` |
| Message/notification | `MessageRepository`, `NotificationRepository` |
| Group | `GroupRepository`, `GroupMemberRepository`, `GroupJoinRequestRepository`, `GroupPostRepository`, `GroupNotificationRepository`, `GroupBanRepository` |
| Admin/report | `ReportRepository` |

### Backend DTO

DTO la object request/response de frontend va backend trao doi. Khong can doc getter/setter khi quay, chi noi chung:

| Nhom | Files |
| --- | --- |
| Auth/user | `AuthRequest`, `AuthResponse`, `RegisterRequest`, `ProfileUpdateRequest`, `UserResponse` |
| Catalog | `FacultyResponse`, `MajorResponse` |
| Post/comment/share | `PostRequest`, `PostResponse`, `PostFeedResponse`, `PostMediaResponse`, `PostCommentRequest`, `PostCommentResponse`, `PostLikeResponse`, `CommentMediaResponse`, `CommentLikeResponse`, `ShareRequest`, `PostShareResponse` |
| Poll | Poll data nam trong `PostRequest`/response lien quan `PollOption` va ket qua tu `PollController`. |
| Friend/message/notification | `FriendshipResponse`, `MessageResponse`, `NotificationResponse` |
| Group | `GroupRequest`, `GroupResponse`, `GroupMemberResponse`, `GroupJoinRequestResponse`, `GroupPostResponse`, `GroupNotificationResponse` |
| Report/admin | `ReportRequest`, `ReportResolveRequest`, `ReportResponse` |

## 4. Mapping chuc nang -> file va ham chinh

Bang nay dung de doc nhanh khi thuyet trinh.

| UC | Chuc nang | Frontend ham/API | Backend controller | Backend service |
| --- | --- | --- | --- | --- |
| UC01 | Dang ky bang email truong | `api.requestRegistrationOtp()`, `api.register()` | `AuthController.requestRegistrationOtp()`, `AuthController.register()` | `OtpService.sendRegistrationOtp()`, `OtpService.verifyOtp()`, `UserService.register()` |
| UC02 | Dang nhap | `api.login()` | `AuthController.login()` | `UserService.login()`, `AuthTokenService.createToken()` |
| UC03 | Dang xuat | `App.handleLogout()` | Khong goi backend | Xoa `social_token`, `social_user` tren frontend |
| UC04 | Doi mat khau | `api.changePassword()` | `UserController.changePassword()` | `UserService.changePassword()` |
| UC05 | Cap nhat thong tin ca nhan | `api.updateProfile()` | `UserController.updateProfile()` | `UserService.updateProfile()` |
| UC06 | Dang bai viet | `api.createPost()` | `PostController.createCurrentUserPost()` | `PostService.createPost()` |
| UC07 | Chinh sua bai viet | `api.updatePost()` | `PostController.updatePost()` | `PostService.updatePost()` |
| UC08 | Xoa bai viet | `api.deletePost()` | `PostController.deletePost()` | `PostService.deletePost()` |
| UC09 | Dang binh chon | `api.createPoll()` | `PollController.createPoll()` | `PollService.createPoll()` |
| UC10 | Binh chon | `api.votePoll()` | `PollController.vote()` | `PollService.vote()` |
| UC11 | Thich bai viet | `api.toggleLike()` | `PostController.toggleLike()` | `PostService.toggleLike()` |
| UC12 | Binh luan | `api.addComment()`, `api.replyComment()` | `PostController.addComment()`, `PostController.replyComment()` | `PostService.addComment()` |
| UC13 | Chia se bai viet | `api.sharePost()` | `ShareController.sharePost()` | `ShareService.sharePost()` |
| UC14 | Gui tin nhan | `api.sendMessage()` / `api.sendGroupMessage()` | `MessageController.sendMessage()`, `MessageController.sendGroupMessage()` | `MessageService.sendMessage()`, `MessageService.sendGroupMessage()`, `ChatWebSocketHandler.notifyUser()/notifyGroupChat()` |
| UC15 | Thu hoi tin nhan | `api.recallMessage()` | `MessageController.recallMessage()` | `MessageService.recallMessage()` |
| UC16 | Gui loi moi ket ban | `api.sendFriendRequest()` | `FriendshipController.sendFriendRequest()` | `FriendshipService.sendRequest()` |
| UC17 | Chap nhan ket ban | `api.acceptFriendRequest()` | `FriendshipController.acceptRequest()` | `FriendshipService.acceptRequest()` |
| UC18 | Huy ket ban | `api.unfriend()`/`api.rejectOrCancelFriendRequest()` | `FriendshipController.unfriend()` hoac reject/cancel endpoint | `FriendshipService.unfriendByFriendshipId()` hoac `rejectOrCancelRequestByFriendshipId()` |
| UC19 | Xem thong bao | `api.getNotifications()`, `api.getGroupNotifications()` | `NotificationController.getNotifications()`, `GroupController.getGroupNotifications()` | `NotificationService.getNotifications()`, `GroupService.getGroupNotifications()` |
| UC20 | Tim kiem | `api.searchUsers()`, `api.searchPosts()`, `api.searchGroups()` | `UserController.searchUsers()`, `PostController.searchPosts()`, `GroupController.searchGroups()` | `UserService.searchUsers()`, `PostService.searchPosts()`, `GroupService.searchGroups()` |
| UC21 | Tao nhom | `api.createGroup()` | `GroupController.createGroup()` | `GroupService.createGroup()` |
| UC22 | Xin vao nhom | `api.joinGroup()` | `GroupController.joinGroup()` | `GroupService.joinGroup()` |
| UC23 | Xoa nhom | `api.deleteGroup()` | `GroupController.deleteGroup()` | `GroupService.deleteGroup()` |
| UC24 | Roi nhom | `api.leaveGroup()` | `GroupController.leaveGroup()` | `GroupService.leaveGroup()` |
| UC25 | Phe duyet thanh vien | `api.approveJoinRequest()` | `GroupController.approveJoinRequest()` | `GroupService.approveJoinRequest()` |
| UC26 | Xoa thanh vien trong nhom | `api.removeGroupMember()` | `GroupController.removeMember()` | `GroupService.removeMember()` |
| UC27 | Bao cao nguoi dung | `api.createReport()` | `ReportController.create()` | `ReportService.create()` |
| UC28 | Bao cao bai viet | `api.createReport()` | `ReportController.create()` | `ReportService.create()` |
| UC29 | Them sinh vien vao nhom bang Excel | `api.bulkInviteStudents()` | `GroupController.bulkInviteStudents()` | Doc Excel bang Apache POI, lay MSSV/email, goi `GroupService.addStudentToGroup()` hoac gui invite |
| UC30 | Them co van hoc tap vao nhom | `api.addAdvisorToGroup()`/`api.inviteAdvisorToGroup()` | `GroupController.addAdvisorToGroup()`, `GroupController.inviteAdvisor()` | `GroupService.addAdvisorToGroup()` |
| UC31 | Tao nhom bang Excel | `GroupsPage.handleCreateGroup()` goi `api.createGroup()` roi neu co Excel thi goi `api.bulkInviteStudents()` | `GroupController.createGroup()` va `GroupController.bulkInviteStudents()` | `GroupService.createGroup()` tao nhom, sau do Excel roster di qua `GroupService.addStudentToGroup()` |
| UC32 | Gui thong bao den cac nhom | `api.createGroupAnnouncement()` | `GroupController.createGroupAnnouncement()` | `GroupService.createGroupAnnouncement()` |
| UC33 | Gui thong bao cho cac doan khoa | `BulkMessageModal.handleSend()` | `MessageController.sendMessage()` hoac API group announcement | `MessageService.sendMessage()`/`GroupService.createGroupAnnouncement()` |
| UC34 | Phe duyet bao cao nguoi dung | `api.resolveReport()` | `ReportController.resolve()` | `ReportService.resolve()` |
| UC35 | Xem danh sach bai viet admin | `api.getAdminPosts()` | `AdminController.posts()` | `AdminService.posts()` |
| UC36 | Xoa bai viet kiem duyet | `api.deleteAdminItem('posts', id)` | `AdminController.deletePost()` | `AdminService.deletePost()` |
| UC37 | Xem danh sach nguoi dung admin | `api.getAdminUsers()` | `AdminController.users()` | `AdminService.users()` |
| UC38 | Xoa nguoi dung | `api.deleteAdminItem('users', id)` | `AdminController.deleteUser()` | `AdminService.deleteUser()` |
| UC39 | Khoa nguoi dung | `api.setAdminUserLocked()` | `AdminController.lock()` | `AdminService.setUserLocked()` |

## 5. Mau noi khi quay

Dung mau nay cho bat ky chuc nang nao:

```text
Chuc nang nay o frontend goi ham ... trong api.ts.
Ham api gui request den endpoint ... cua backend.
Backend nhan o ...Controller, controller chi lay du lieu va user hien tai.
Xu ly chinh nam o ...Service, service validate du lieu, goi repository de doc/luu database.
Ket qua duoc map sang DTO ...Response va tra ve frontend.
```

Vi du UC29 Excel sinh vien:

```text
Chuc nang them sinh vien vao nhom bang Excel bat dau tu frontend goi api.bulkInviteStudents.
Request di vao GroupController.bulkInviteStudents. Ham nay nhan file Excel, dung Apache POI de doc tung dong.
Moi dong lay thong tin sinh vien, thuong la MSSV/email, sau do tim user tu database.
Neu user hop le thi goi GroupService.addStudentToGroup de them vao GroupMember hoac gui loi moi.
Ket qua tra ve so dong thanh cong, that bai va thong bao loi neu co.
```
