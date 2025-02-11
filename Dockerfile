# Sử dụng hình ảnh Node.js phiên bản 18
FROM node:18

# Tạo thư mục ứng dụng
WORKDIR /usr/src/app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Xóa node_modules nếu tồn tại
RUN rm -rf node_modules

# Cài đặt các phụ thuộc
RUN npm install

# Sao chép toàn bộ mã nguồn ứng dụng
COPY . .

# Mở cổng mà ứng dụng sẽ chạy
EXPOSE 3000

# Chạy ứng dụng
CMD ["npm", "start"]