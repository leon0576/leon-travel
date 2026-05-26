# 使用Node.js官方镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json文件
COPY backend/package*.json ./

# 安装依赖
RUN npm install

# 复制后端代码
COPY backend/ .

# 复制前端代码到 /app/frontend
COPY frontend/ ./frontend/

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]