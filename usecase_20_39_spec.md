# Đặc tả use case 20-39

## UC20 - Xem thông báo
| Trường | Nội dung |
|---|---|
| Name of Use Case | Xem thông báo |
| Use Case ID | UC20 |
| Brief Description | Người dùng xem danh sách thông báo của hệ thống và thông báo nhóm, đồng thời đánh dấu trạng thái đã đọc cho từng thông báo liên quan. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng bấm biểu tượng chuông thông báo trên giao diện chính. |
| Flow of Events | Basic Flow: 1) Người dùng mở khu vực thông báo. 2) Frontend tải danh sách thông báo cá nhân và thông báo nhóm. 3) Hệ thống trả về danh sách theo thời gian tạo và số lượng chưa đọc. 4) Người dùng chọn một thông báo cần xem. 5) Frontend gửi yêu cầu đánh dấu đã đọc. 6) Backend cập nhật trạng thái thông báo. 7) Frontend điều hướng đến nội dung liên quan. <br> Alternate Flows: không có thông báo mới; thông báo đã bị xóa ở phía nguồn; lỗi tải dữ liệu. |
| Pre-Conditions | Người dùng đã đăng nhập và có quyền xem thông báo của chính mình. |
| Post-Condition | Danh sách thông báo được hiển thị và trạng thái đã đọc được cập nhật phù hợp. |
| Extension Points | Đánh dấu tất cả đã đọc; lọc thông báo theo loại; mở rộng sang thông báo bài viết, nhóm hoặc tin nhắn. |

## UC21 - Tìm kiếm
| Trường | Nội dung |
|---|---|
| Name of Use Case | Tìm kiếm |
| Use Case ID | UC21 |
| Brief Description | Người dùng tìm kiếm nhanh người dùng, bài viết hoặc nhóm theo từ khóa để truy cập đúng nội dung cần thiết. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng nhập từ khóa vào thanh tìm kiếm trên giao diện. |
| Flow of Events | Basic Flow: 1) Người dùng nhập từ khóa tìm kiếm. 2) Frontend điều hướng đến màn hình tìm kiếm và gửi truy vấn. 3) Hệ thống tìm trên các đối tượng được hỗ trợ như người dùng và bài viết, đồng thời có thể mở rộng sang nhóm. 4) Backend trả về danh sách kết quả phù hợp. 5) Frontend phân loại kết quả theo từng tab hiển thị. 6) Người dùng chọn một kết quả để mở trang chi tiết. <br> Alternate Flows: từ khóa rỗng; không có kết quả; lỗi truy vấn hoặc dữ liệu trả về. |
| Pre-Conditions | Người dùng đã đăng nhập hoặc được phép truy cập chức năng tìm kiếm. |
| Post-Condition | Kết quả tìm kiếm được hiển thị theo từ khóa người dùng nhập. |
| Extension Points | Tìm theo tên người dùng, nội dung bài viết, nhóm; lọc kết quả theo loại đối tượng. |

## UC22 - Tạo nhóm
| Trường | Nội dung |
|---|---|
| Name of Use Case | Tạo nhóm |
| Use Case ID | UC22 |
| Brief Description | Người dùng có quyền tạo một nhóm mới để phục vụ hoạt động học tập, sinh hoạt lớp hoặc điều phối cộng đồng. |
| Actor(s) | Sinh viên, giảng viên, đoàn khoa |
| Trigger | Người dùng chọn chức năng tạo nhóm trên trang nhóm. |
| Flow of Events | Basic Flow: 1) Người dùng mở màn hình nhóm. 2) Hệ thống hiển thị form tạo nhóm. 3) Người dùng nhập thông tin nhóm và xác nhận tạo. 4) Frontend gửi yêu cầu tạo nhóm. 5) Backend kiểm tra dữ liệu hợp lệ và quyền tạo nhóm. 6) Hệ thống lưu nhóm mới và gán người tạo làm chủ nhóm. 7) Frontend hiển thị nhóm vừa tạo và chuyển sang trang chi tiết nhóm. <br> Alternate Flows: thiếu thông tin bắt buộc; quyền tạo nhóm không hợp lệ; tên nhóm trùng hoặc không đạt quy tắc đặt tên. |
| Pre-Conditions | Người dùng đã đăng nhập và có quyền tạo nhóm. |
| Post-Condition | Nhóm mới được tạo và sẵn sàng quản lý thành viên, bài viết và thông báo. |
| Extension Points | Tạo nhóm công khai hoặc riêng tư; đính kèm ảnh đại diện/ảnh bìa; nhập thêm danh sách thành viên từ file Excel. |

## UC23 - Xin vào nhóm
| Trường | Nội dung |
|---|---|
| Name of Use Case | Xin vào nhóm |
| Use Case ID | UC23 |
| Brief Description | Người dùng gửi yêu cầu tham gia nhóm để được duyệt hoặc vào thẳng nhóm tùy chính sách của nhóm. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng bấm nút `Tham gia` trên thẻ hoặc trang chi tiết nhóm. |
| Flow of Events | Basic Flow: 1) Người dùng xem thông tin nhóm. 2) Hệ thống hiển thị trạng thái tham gia hiện tại. 3) Người dùng bấm xin vào nhóm. 4) Frontend gửi yêu cầu tham gia. 5) Backend kiểm tra trạng thái thành viên, trạng thái cấm và rule duyệt của nhóm. 6) Nếu nhóm yêu cầu duyệt, hệ thống tạo yêu cầu chờ xử lý. 7) Nếu nhóm cho vào thẳng, hệ thống thêm người dùng vào nhóm. 8) Frontend cập nhật trạng thái phù hợp. <br> Alternate Flows: đã là thành viên; đang chờ duyệt; bị cấm tham gia; nhóm không tồn tại. |
| Pre-Conditions | Nhóm tồn tại và người dùng có quyền gửi yêu cầu tham gia. |
| Post-Condition | Người dùng trở thành thành viên hoặc có yêu cầu chờ duyệt hợp lệ. |
| Extension Points | Xin vào nhóm công khai/riêng tư; gửi yêu cầu kèm ghi chú; nhận thông báo khi được duyệt. |

## UC24 - Xóa nhóm
| Trường | Nội dung |
|---|---|
| Name of Use Case | Xóa nhóm |
| Use Case ID | UC24 |
| Brief Description | Chủ nhóm hoặc người có thẩm quyền xóa một nhóm không còn sử dụng để giải phóng dữ liệu và quyền truy cập liên quan. |
| Actor(s) | Chủ nhóm, quản trị viên nhóm, admin |
| Trigger | Người dùng chọn chức năng xóa nhóm trong khu vực quản lý nhóm. |
| Flow of Events | Basic Flow: 1) Người dùng mở trang quản lý nhóm. 2) Hệ thống hiển thị thông tin nhóm và các thao tác quản trị. 3) Người dùng chọn xóa nhóm và xác nhận thao tác. 4) Frontend gửi yêu cầu xóa nhóm. 5) Backend kiểm tra quyền xóa và trạng thái của nhóm. 6) Hệ thống xóa nhóm và các liên kết liên quan theo chính sách nghiệp vụ. 7) Frontend cập nhật danh sách nhóm hiện tại. <br> Alternate Flows: không đủ quyền; nhóm không tồn tại; thao tác bị hủy ở hộp thoại xác nhận. |
| Pre-Conditions | Nhóm tồn tại và người thao tác có quyền xóa nhóm. |
| Post-Condition | Nhóm bị xóa khỏi hệ thống hoặc chuyển sang trạng thái không còn khả dụng. |
| Extension Points | Xóa mềm để phục hồi sau này; ghi log kiểm duyệt; thông báo cho thành viên nhóm. |

## UC25 - Rời nhóm
| Trường | Nội dung |
|---|---|
| Name of Use Case | Rời nhóm |
| Use Case ID | UC25 |
| Brief Description | Thành viên tự rời khỏi nhóm để ngừng tham gia và ngắt quyền truy cập vào nội dung nội bộ của nhóm. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng bấm `Rời nhóm` trên trang chi tiết nhóm. |
| Flow of Events | Basic Flow: 1) Người dùng mở trang nhóm đã tham gia. 2) Hệ thống hiển thị nút rời nhóm. 3) Người dùng xác nhận rời nhóm. 4) Frontend gửi yêu cầu rời nhóm. 5) Backend kiểm tra trạng thái thành viên và quy tắc của nhóm. 6) Hệ thống xóa quan hệ thành viên hiện tại. 7) Frontend điều hướng về danh sách nhóm hoặc cập nhật trạng thái không còn là thành viên. <br> Alternate Flows: người dùng không phải thành viên; người dùng là chủ nhóm và không thể rời theo rule hiện tại; lỗi xử lý dữ liệu. |
| Pre-Conditions | Người dùng đang là thành viên hợp lệ của nhóm. |
| Post-Condition | Người dùng không còn là thành viên của nhóm. |
| Extension Points | Chuyển quyền chủ nhóm trước khi rời; lưu lý do rời nhóm; gửi thông báo nội bộ nếu cần. |

## UC26 - Phê duyệt thành viên
| Trường | Nội dung |
|---|---|
| Name of Use Case | Phê duyệt thành viên |
| Use Case ID | UC26 |
| Brief Description | Chủ nhóm hoặc quản trị viên phê duyệt yêu cầu tham gia để chuyển người dùng từ trạng thái chờ sang thành viên chính thức. |
| Actor(s) | Chủ nhóm, quản trị viên nhóm |
| Trigger | Người dùng bấm `Duyệt` trong danh sách yêu cầu tham gia. |
| Flow of Events | Basic Flow: 1) Người quản lý mở danh sách yêu cầu chờ. 2) Hệ thống hiển thị các yêu cầu chưa xử lý. 3) Người quản lý chọn một yêu cầu và bấm phê duyệt. 4) Frontend gửi yêu cầu phê duyệt. 5) Backend kiểm tra quyền xử lý và trạng thái request. 6) Hệ thống chuyển yêu cầu thành thành viên chính thức. 7) Frontend loại request khỏi danh sách chờ và làm mới danh sách thành viên. <br> Alternate Flows: request hết hạn; request không thuộc nhóm; người thao tác không có quyền. |
| Pre-Conditions | Có yêu cầu tham gia đang chờ duyệt và người thao tác có quyền phê duyệt. |
| Post-Condition | Người dùng được thêm vào danh sách thành viên nhóm. |
| Extension Points | Gửi thông báo chấp thuận; gán vai trò mặc định; cập nhật badge số lượng request. |

## UC27 - Xóa thành viên trong nhóm
| Trường | Nội dung |
|---|---|
| Name of Use Case | Xóa thành viên trong nhóm |
| Use Case ID | UC27 |
| Brief Description | Người có quyền quản lý nhóm loại bỏ một thành viên khỏi nhóm khi cần kiểm soát nội dung hoặc cơ cấu thành viên. |
| Actor(s) | Chủ nhóm, quản trị viên nhóm |
| Trigger | Người dùng bấm `Xóa khỏi nhóm` trên một thành viên. |
| Flow of Events | Basic Flow: 1) Người quản lý mở danh sách thành viên. 2) Hệ thống hiển thị vai trò và trạng thái từng thành viên. 3) Người quản lý chọn thành viên cần xóa và xác nhận. 4) Frontend gửi yêu cầu xóa thành viên. 5) Backend xác thực quyền và kiểm tra thành viên mục tiêu. 6) Hệ thống xóa thành viên khỏi nhóm. 7) Frontend làm mới danh sách thành viên. <br> Alternate Flows: không đủ quyền; thành viên không tồn tại; cố xóa chủ nhóm; thao tác bị hủy. |
| Pre-Conditions | Nhóm tồn tại và người thao tác có quyền quản lý thành viên. |
| Post-Condition | Thành viên được loại khỏi nhóm và mất quyền truy cập nội dung nhóm. |
| Extension Points | Gửi lý do xóa; khóa tham gia lại tạm thời; ghi log kiểm duyệt. |

## UC28 - Báo cáo người dùng
| Trường | Nội dung |
|---|---|
| Name of Use Case | Báo cáo người dùng |
| Use Case ID | UC28 |
| Brief Description | Người dùng gửi báo cáo về một tài khoản có dấu hiệu vi phạm để hệ thống chuyển cho quản trị viên xem xét. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn chức năng `Báo cáo` trên hồ sơ người dùng. |
| Flow of Events | Basic Flow: 1) Người dùng mở hồ sơ tài khoản cần báo cáo. 2) Hệ thống hiển thị form báo cáo. 3) Người dùng chọn lý do và nhập mô tả. 4) Frontend gửi yêu cầu báo cáo. 5) Backend kiểm tra dữ liệu và đối tượng bị báo cáo. 6) Hệ thống lưu báo cáo ở trạng thái chờ xử lý. 7) Frontend hiển thị thông báo gửi thành công. <br> Alternate Flows: thiếu lý do; target không tồn tại; báo cáo trùng lặp; lỗi kết nối. |
| Pre-Conditions | Người dùng đã đăng nhập và đối tượng cần báo cáo tồn tại. |
| Post-Condition | Báo cáo được ghi nhận và chờ quản trị viên xử lý. |
| Extension Points | Gửi kèm ảnh minh chứng; báo cáo nhanh từ trang hồ sơ; thêm loại vi phạm chi tiết. |

## UC29 - Báo cáo bài viết
| Trường | Nội dung |
|---|---|
| Name of Use Case | Báo cáo bài viết |
| Use Case ID | UC29 |
| Brief Description | Người dùng gửi báo cáo cho một bài viết không phù hợp để quản trị viên đánh giá và xử lý theo quy định. |
| Actor(s) | Sinh viên |
| Trigger | Người dùng chọn `Báo cáo` trên bài viết. |
| Flow of Events | Basic Flow: 1) Người dùng mở bài viết cần báo cáo. 2) Hệ thống hiển thị hộp thoại báo cáo. 3) Người dùng chọn lý do và nhập mô tả. 4) Frontend gửi yêu cầu báo cáo bài viết. 5) Backend kiểm tra tính hợp lệ của bài viết và nội dung báo cáo. 6) Hệ thống lưu báo cáo chờ duyệt. 7) Frontend hiển thị trạng thái đã gửi. <br> Alternate Flows: bài viết không tồn tại; nội dung báo cáo trống; báo cáo trùng; lỗi mạng. |
| Pre-Conditions | Người dùng đã đăng nhập và bài viết vẫn còn tồn tại. |
| Post-Condition | Báo cáo bài viết được ghi nhận trong hệ thống. |
| Extension Points | Báo cáo kèm ảnh; báo cáo nhiều lý do; chặn tương tác sau khi gửi báo cáo. |

## UC30 - Thêm sinh viên vào nhóm bằng file Excel
| Trường | Nội dung |
|---|---|
| Name of Use Case | Thêm sinh viên vào nhóm bằng file Excel |
| Use Case ID | UC30 |
| Brief Description | Giảng viên hoặc đoàn khoa tải lên file Excel danh sách sinh viên để thêm hàng loạt thành viên vào nhóm. |
| Actor(s) | Giảng viên, đoàn khoa |
| Trigger | Người dùng chọn chức năng nhập danh sách sinh viên từ file Excel. |
| Flow of Events | Basic Flow: 1) Người quản lý mở trang nhóm. 2) Hệ thống cho phép chọn file Excel danh sách sinh viên. 3) Người dùng tải file lên và xác nhận. 4) Frontend gửi yêu cầu xử lý danh sách. 5) Backend kiểm tra định dạng file và quyền thực hiện. 6) Hệ thống đọc danh sách sinh viên và thêm các tài khoản hợp lệ vào nhóm. 7) Frontend hiển thị kết quả import thành công hoặc các dòng lỗi. <br> Alternate Flows: file sai định dạng; danh sách rỗng; một số sinh viên không tồn tại; không đủ quyền xử lý. |
| Pre-Conditions | Nhóm tồn tại và người thao tác có quyền nhập thành viên bằng file. |
| Post-Condition | Danh sách sinh viên hợp lệ được thêm vào nhóm. |
| Extension Points | Gộp kết quả import; bỏ qua dòng lỗi; xuất báo cáo file import sau khi xử lý. |

## UC31 - Thêm cố vấn học tập vào nhóm
| Trường | Nội dung |
|---|---|
| Name of Use Case | Thêm cố vấn học tập vào nhóm |
| Use Case ID | UC31 |
| Brief Description | Đơn vị quản lý nhóm thêm cố vấn học tập vào nhóm để hỗ trợ theo dõi, điều phối và tư vấn nội dung học thuật. |
| Actor(s) | Đoàn khoa |
| Trigger | Người dùng chọn chức năng thêm cố vấn cho nhóm. |
| Flow of Events | Basic Flow: 1) Người quản lý mở trang nhóm. 2) Hệ thống hiển thị danh sách cố vấn khả dụng hoặc form nhập thông tin. 3) Người dùng chọn cố vấn cần thêm. 4) Frontend gửi yêu cầu thêm cố vấn. 5) Backend kiểm tra quyền và thông tin cố vấn. 6) Hệ thống thêm cố vấn vào nhóm với vai trò phù hợp. 7) Frontend cập nhật danh sách thành viên và vai trò. <br> Alternate Flows: cố vấn không tồn tại; đã là thành viên; không đủ quyền; dữ liệu đầu vào không hợp lệ. |
| Pre-Conditions | Nhóm tồn tại và người thao tác có quyền quản lý cố vấn. |
| Post-Condition | Cố vấn học tập được gắn vào nhóm và có thể tham gia điều phối. |
| Extension Points | Gửi lời mời thay vì thêm trực tiếp; cấp vai trò đặc biệt; đồng bộ danh sách cố vấn theo khoa. |

## UC32 - Tạo nhóm bằng file Excel
| Trường | Nội dung |
|---|---|
| Name of Use Case | Tạo nhóm bằng file Excel |
| Use Case ID | UC32 |
| Brief Description | Đoàn khoa tạo nhóm và nạp danh sách thành viên từ file Excel để phục vụ lớp học hoặc hoạt động quản lý theo lô. |
| Actor(s) | Đoàn khoa |
| Trigger | Người dùng chọn chức năng tạo nhóm kèm file Excel. |
| Flow of Events | Basic Flow: 1) Người dùng mở chức năng tạo nhóm. 2) Hệ thống hiển thị form nhập thông tin nhóm và tải file Excel. 3) Người dùng nhập thông tin và chọn file danh sách. 4) Frontend gửi yêu cầu tạo nhóm. 5) Backend tạo nhóm mới và kiểm tra file danh sách. 6) Hệ thống import các thành viên hợp lệ từ file Excel vào nhóm. 7) Frontend hiển thị nhóm mới và kết quả nhập thành viên. <br> Alternate Flows: file lỗi định dạng; thiếu thông tin nhóm; danh sách có dòng lỗi; không đủ quyền tạo nhóm. |
| Pre-Conditions | Người dùng đã đăng nhập và có quyền tạo nhóm hàng loạt. |
| Post-Condition | Nhóm mới được tạo cùng danh sách thành viên ban đầu từ file Excel. |
| Extension Points | Tạo nhóm công khai/riêng tư; nhập thêm ảnh nhóm; gắn thêm cố vấn học tập sau khi tạo. |

## UC33 - Gửi thông báo đến các nhóm
| Trường | Nội dung |
|---|---|
| Name of Use Case | Gửi thông báo đến các nhóm |
| Use Case ID | UC33 |
| Brief Description | Giảng viên hoặc đoàn khoa gửi thông báo tới một hoặc nhiều nhóm để truyền đạt nội dung học vụ hoặc hoạt động nội bộ. |
| Actor(s) | Giảng viên, đoàn khoa |
| Trigger | Người dùng chọn chức năng gửi thông báo cho các nhóm. |
| Flow of Events | Basic Flow: 1) Người quản lý mở màn hình thông báo nhóm. 2) Hệ thống hiển thị danh sách nhóm mục tiêu. 3) Người dùng nhập nội dung thông báo và chọn nhóm nhận. 4) Frontend gửi yêu cầu tạo thông báo. 5) Backend kiểm tra quyền gửi và lưu thông báo tương ứng. 6) Hệ thống sinh thông báo cho các nhóm được chọn. 7) Frontend hiển thị trạng thái gửi thành công. <br> Alternate Flows: nhóm mục tiêu không hợp lệ; nội dung trống; không đủ quyền gửi thông báo. |
| Pre-Conditions | Người dùng có quyền gửi thông báo cho các nhóm mục tiêu. |
| Post-Condition | Thông báo được phát hành đến các nhóm đã chọn. |
| Extension Points | Gửi một lần cho nhiều nhóm; ghim thông báo; đính kèm media hoặc file. |

## UC34 - Gửi thông báo cho các đoàn khoa
| Trường | Nội dung |
|---|---|
| Name of Use Case | Gửi thông báo cho các đoàn khoa |
| Use Case ID | UC34 |
| Brief Description | Đoàn trường gửi thông báo tới các đơn vị đoàn khoa để truyền đạt nội dung cấp trường hoặc điều phối hoạt động chung. |
| Actor(s) | Đoàn trường |
| Trigger | Người dùng chọn chức năng gửi thông báo cho các đoàn khoa. |
| Flow of Events | Basic Flow: 1) Người dùng mở chức năng gửi thông báo cấp trường. 2) Hệ thống hiển thị danh sách đơn vị đoàn khoa nhận thông báo. 3) Người dùng nhập nội dung và xác nhận. 4) Frontend gửi yêu cầu phát hành thông báo. 5) Backend kiểm tra quyền cấp trường và lưu thông báo. 6) Hệ thống phân phối thông báo tới các đoàn khoa được chọn. 7) Frontend hiển thị kết quả gửi. <br> Alternate Flows: nội dung trống; chọn sai nhóm nhận; người dùng không có quyền cấp trường. |
| Pre-Conditions | Người dùng có vai trò đoàn trường. |
| Post-Condition | Thông báo được gửi tới các đơn vị đoàn khoa tương ứng. |
| Extension Points | Gửi theo danh sách nhiều khoa; đính kèm file; lưu lịch sử thông báo đã gửi. |

## UC35 - Phê duyệt báo cáo người dùng
| Trường | Nội dung |
|---|---|
| Name of Use Case | Phê duyệt báo cáo người dùng |
| Use Case ID | UC35 |
| Brief Description | Quản trị viên xem xét báo cáo vi phạm của người dùng và quyết định xử lý theo trạng thái phù hợp. |
| Actor(s) | Admin |
| Trigger | Quản trị viên mở danh sách báo cáo chờ xử lý. |
| Flow of Events | Basic Flow: 1) Quản trị viên mở trang báo cáo. 2) Hệ thống tải danh sách báo cáo và thống kê tổng quan. 3) Quản trị viên chọn một báo cáo cần xử lý. 4) Frontend gửi yêu cầu duyệt hoặc cập nhật trạng thái báo cáo. 5) Backend kiểm tra quyền admin và tính hợp lệ của báo cáo. 6) Hệ thống cập nhật trạng thái báo cáo hoặc thực hiện hành động tương ứng lên đối tượng vi phạm. 7) Frontend làm mới danh sách và thống kê. <br> Alternate Flows: báo cáo đã được xử lý; không đủ quyền; đối tượng vi phạm không còn tồn tại. |
| Pre-Conditions | Người thao tác là admin và có báo cáo hợp lệ ở trạng thái chờ. |
| Post-Condition | Báo cáo được chuyển sang trạng thái xử lý phù hợp. |
| Extension Points | Khóa tài khoản; xóa nội dung vi phạm; bỏ qua báo cáo không hợp lệ. |

## UC36 - Xem danh sách bài viết
| Trường | Nội dung |
|---|---|
| Name of Use Case | Xem danh sách bài viết |
| Use Case ID | UC36 |
| Brief Description | Quản trị viên xem danh sách bài viết trong hệ thống để phục vụ kiểm duyệt và giám sát nội dung. |
| Actor(s) | Admin |
| Trigger | Quản trị viên mở mục bài viết trong trang quản trị. |
| Flow of Events | Basic Flow: 1) Quản trị viên mở khu vực bài viết. 2) Frontend tải danh sách bài viết từ backend. 3) Backend kiểm tra quyền admin. 4) Hệ thống trả về danh sách bài viết theo bộ lọc hiện tại. 5) Frontend hiển thị danh sách và các thao tác quản trị liên quan. <br> Alternate Flows: không có dữ liệu; bộ lọc không hợp lệ; lỗi tải danh sách. |
| Pre-Conditions | Người thao tác là admin. |
| Post-Condition | Danh sách bài viết được hiển thị trên giao diện quản trị. |
| Extension Points | Lọc theo từ khóa; xem bài viết theo trạng thái; chuyển sang thao tác xóa kiểm duyệt. |

## UC37 - Xóa bài viết (Kiểm duyệt)
| Trường | Nội dung |
|---|---|
| Name of Use Case | Xóa bài viết (Kiểm duyệt) |
| Use Case ID | UC37 |
| Brief Description | Quản trị viên xóa một bài viết vi phạm quy định nhằm đảm bảo môi trường cộng đồng an toàn và đúng mục đích sử dụng. |
| Actor(s) | Admin |
| Trigger | Quản trị viên chọn bài viết và bấm xóa. |
| Flow of Events | Basic Flow: 1) Quản trị viên xem danh sách bài viết. 2) Chọn bài viết cần kiểm duyệt. 3) Xác nhận thao tác xóa. 4) Frontend gửi yêu cầu xóa bài viết. 5) Backend kiểm tra quyền admin và trạng thái bài viết. 6) Hệ thống xóa hoặc ẩn bài viết theo chính sách kiểm duyệt. 7) Frontend làm mới danh sách bài viết. <br> Alternate Flows: bài viết không tồn tại; không đủ quyền; thao tác xóa bị hủy. |
| Pre-Conditions | Bài viết tồn tại và người thao tác là admin. |
| Post-Condition | Bài viết bị xóa hoặc ẩn khỏi hệ thống. |
| Extension Points | Xóa mềm; lưu lý do kiểm duyệt; kết hợp xử lý báo cáo liên quan. |

## UC38 - Xem danh sách người dùng
| Trường | Nội dung |
|---|---|
| Name of Use Case | Xem danh sách người dùng |
| Use Case ID | UC38 |
| Brief Description | Quản trị viên xem danh sách người dùng để theo dõi trạng thái tài khoản, vai trò và hoạt động trong hệ thống. |
| Actor(s) | Admin |
| Trigger | Quản trị viên mở mục người dùng trong trang quản trị. |
| Flow of Events | Basic Flow: 1) Quản trị viên mở tab danh sách người dùng. 2) Frontend gửi yêu cầu tải danh sách. 3) Backend kiểm tra quyền admin và lấy dữ liệu người dùng. 4) Hệ thống trả về danh sách kèm thông tin lọc theo vai trò hoặc trạng thái. 5) Frontend hiển thị danh sách người dùng và các thao tác quản trị. <br> Alternate Flows: không có dữ liệu; bộ lọc sai; lỗi kết nối hoặc phân trang. |
| Pre-Conditions | Người thao tác là admin. |
| Post-Condition | Danh sách người dùng được hiển thị để quản trị viên theo dõi. |
| Extension Points | Lọc theo vai trò; tìm kiếm theo từ khóa; xem chi tiết tài khoản. |

## UC39 - Xóa người dùng
| Trường | Nội dung |
|---|---|
| Name of Use Case | Xóa người dùng |
| Use Case ID | UC39 |
| Brief Description | Quản trị viên xóa một tài khoản vi phạm hoặc không còn được phép hoạt động trong hệ thống. |
| Actor(s) | Admin |
| Trigger | Quản trị viên chọn tài khoản và bấm xóa. |
| Flow of Events | Basic Flow: 1) Quản trị viên mở danh sách người dùng. 2) Chọn tài khoản cần xóa. 3) Hệ thống hiển thị hộp thoại xác nhận. 4) Người dùng xác nhận thao tác. 5) Frontend gửi yêu cầu xóa tài khoản. 6) Backend kiểm tra quyền admin và trạng thái tài khoản. 7) Hệ thống xóa người dùng hoặc chuyển sang trạng thái không còn hoạt động. 8) Frontend làm mới danh sách người dùng. <br> Alternate Flows: tài khoản không tồn tại; không đủ quyền; thao tác bị hủy; tài khoản đang có ràng buộc nghiệp vụ cần xử lý trước. |
| Pre-Conditions | Người thao tác là admin và tài khoản cần xóa tồn tại. |
| Post-Condition | Tài khoản bị xóa khỏi hệ thống hoặc không còn khả dụng. |
| Extension Points | Khóa tài khoản thay vì xóa cứng; lưu lịch sử xử lý; đồng bộ dữ liệu liên quan trước khi xóa. |
