🏋️ Workout Planner API
Hệ thống API quản lý lịch tập luyện chuyên nghiệp được xây dựng trên nền tảng NestJS. Dự án hỗ trợ người dùng lập kế hoạch tập luyện chi tiết, quản lý bài tập và tối ưu hóa hiệu suất thông qua tính năng nhân bản lộ trình.

🛠 Công nghệ sử dụng
Framework: NestJS (Node.js)

Database: PostgreSQL (với TypeORM)

Security: Passport.js, JWT Strategy

Validation: Class-validator, Class-transformer

Documentation: Swagger UI

📂 Cấu trúc thư mục (Project Structure)

Plaintext

src/
├── auth/           # Module đăng ký, đăng nhập & bảo mật JWT
├── common/         # Các Decorator, Interceptor, Guard dùng chung toàn hệ thống
├── exercise/       # Module quản lý bài tập & logic Filter theo nhóm cơ
├── user/           # Module quản lý thông tin người dùng
├── workoutplan/    # Module quản lý lịch tập & logic Clone Plan
├── app.module.ts   # Module gốc của ứng dụng
└── main.ts         # Điểm khởi chạy ứng dụng (Entry point)

🚀 Tính năng chính
Auth & Security: Xác thực người dùng bằng JWT.

Workout Plan Management: CRUD các kế hoạch tập luyện (ví dụ: "Full Body Thứ 2").

Clone Workout Plan: Sao chép một lịch tập có sẵn kèm theo tất cả các bài tập bên trong sang một bản ghi mới.

Exercise Management: Quản lý chi tiết bài tập với các thuộc tính: reps, sets, restTime.

Smart Filtering: Lọc danh sách bài tập dựa trên nhóm cơ (muscleGroup).

⚙️ Hướng dẫn cài đặt
1. Clone dự án
git clone https://github.com/DuongAty/Workout_Planner.git
cd Workout_Planner
2. Cài đặt thư viện
npm install
3. Cài đặt và cấu hình Docker, Database(pgAdmin)
# Chạy lệnh docker:
docker run --name workout-db -e POSTGRES_PASSWORD=your_password -p 5432:5432 -d postgres
điền các tham số connect vào pgAdmin
4. Cấu hình biến môi trường
Tạo file .env (hoặc sử dụng file có sẵn như .env.stage.dev) tại thư mục gốc và cấu hình:
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=workout_db
JWT_SECRET=your_jwt_secret_key
5. Chạy ứng dụng
# Chế độ phát triển
npm run start:dev

🧪 Kiểm thử (Testing) 
Dự án sử dụng Jest cho Unit Testing:

Lệnh chạy test
# Chạy toàn bộ Unit Test
npm run test

# Kiểm tra độ bao phủ code
npm run test:cov

📖 Tài liệu API
Truy cập tài liệu API trực quan qua Swagger UI tại đường dẫn: http://localhost:3000/docs