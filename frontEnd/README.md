Chess Online
Chess Online là một ứng dụng web cho phép hai người chơi đấu cờ vua trực tuyến theo thời gian thực. Dự án sử dụng React cho giao diện người dùng và Node.js kết hợp Socket.IO cho phần backend, đảm bảo cập nhật trạng thái game nhanh chóng và mượt mà.

Tính năng
Đăng nhập bằng ID người chơi.
Tạo phòng chơi mới hoặc tham gia phòng có sẵn thông qua mã phòng.
Bắt đầu ván cờ khi có đủ hai người chơi.
Hiển thị bàn cờ và hỗ trợ di chuyển quân cờ theo lượt.
Phát hiện các trạng thái như chiếu, chiếu hết, và hòa cờ.
Cho phép người chơi rời phòng hoặc thoát game bất kỳ lúc nào.
Công nghệ sử dụng
Frontend: React, Socket.IO Client, Chess.js, React Chessboard.
Backend: Node.js, Express, Socket.IO.
Deployment: Render (hoặc các dịch vụ tương tự như Heroku, Vercel).

Hướng dẫn sử dụng
Đăng nhập: Nhập ID người chơi và nhấn "Vào Game".
Tạo phòng: Nhấn "Tạo Phòng Mới" để nhận mã phòng.
Tham gia phòng: Nhập mã phòng và nhấn "Vào Phòng".
Bắt đầu game: Khi có đủ hai người chơi, chủ phòng nhấn "Bắt đầu" để khởi động ván cờ.
Chơi cờ: Di chuyển quân cờ theo lượt, hệ thống sẽ kiểm tra tính hợp lệ của mỗi nước đi.
Rời phòng: Nhấn "Rời Phòng" để thoát khỏi game.
Góp ý và báo lỗi
Nếu bạn gặp vấn đề hoặc có ý tưởng cải thiện, vui lòng mở issue trên GitHub hoặc gửi pull request.