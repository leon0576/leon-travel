# 旅行规划系统部署说明

## 项目结构

```
travel-planner/
├── frontend/           # 前端代码
│   ├── index.html      # 主页面
│   └── Dockerfile      # 前端Dockerfile
├── backend/            # 后端代码
│   ├── app.js          # 主应用文件
│   ├── package.json    # 依赖配置
│   ├── config/         # 配置文件
│   ├── middleware/     # 中间件
│   ├── models/         # 数据模型
│   ├── routes/         # 路由
│   └── Dockerfile      # 后端Dockerfile
└── docker-compose.yml  # Docker Compose配置文件
```

## 部署环境要求

- Docker
- Docker Compose

## 部署步骤

### 1. 克隆项目

```bash
git clone <项目地址>
cd travel-planner
```

### 2. 配置环境变量

编辑 `docker-compose.yml` 文件，根据需要修改以下配置：

- `JWT_SECRET`：JWT令牌的密钥，生产环境中应使用强密钥
- 数据库配置：默认使用 `postgres` 作为用户名、密码和数据库名

### 3. 构建和启动容器

```bash
# 构建并启动容器
docker-compose up -d

# 查看容器状态
docker-compose ps
```

### 4. 访问系统

- 前端：http://localhost
- 后端API：http://localhost:3000/api
- 健康检查：http://localhost:3000/health

## 默认账户

系统不会再使用固定默认密码。首次部署时可通过 `DEFAULT_ADMIN_PASSWORD` 创建管理员，或在初始化界面创建首个账户。

## 技术栈

- **前端**：HTML5, Tailwind CSS, JavaScript
- **后端**：Node.js, Express, PostgreSQL, Sequelize
- **容器化**：Docker, Docker Compose

## 功能说明

1. **用户管理**：
   - 注册、登录
   - 用户列表管理
   - 个人信息编辑

2. **行程管理**：
   - 创建、编辑、删除行程
   - 每日行程规划
   - 费用管理

3. **系统设置**：
   - 深色/浅色模式切换
   - 背景图片设置

## 数据库结构

### users表
- id: 主键
- username: 用户名（唯一）
- nickname: 昵称
- password: 密码（加密存储）
- birthday: 生日
- avatar: 头像URL
- createdAt: 创建时间
- updatedAt: 更新时间

### trips表
- id: 主键
- userId: 用户ID（外键）
- cover: 封面图片URL
- title: 行程标题
- description: 行程描述
- transport: 交通方式
- participants: 参与人
- startLocation: 起点
- endLocation: 终点
- attractions: 主要景点
- startDate: 开始日期
- endDate: 结束日期
- days: 行程天数
- dailyPlans: 每日计划（JSON格式）
- createdAt: 创建时间
- updatedAt: 更新时间

## 常见问题

### 1. 容器启动失败

检查容器日志：
```bash
docker-compose logs backend
docker-compose logs db
```

### 2. 前端无法连接后端

确保前端代码中的 `API_BASE_URL` 配置正确，指向后端服务的地址。

### 3. 数据库连接失败

检查数据库容器是否正常运行，以及数据库配置是否正确。

## 生产环境部署建议

1. **安全配置**：
   - 不使用固定默认管理员密码
   - 使用强JWT密钥
   - 通过环境变量提供数据库密码和 JWT 密钥
   - 配置HTTPS

2. **性能优化**：
   - 使用Docker卷持久化数据库数据
   - 配置适当的容器资源限制
   - 考虑使用负载均衡器（如Nginx）

3. **监控和日志**：
   - 配置容器日志收集
   - 监控系统运行状态
   - 定期备份数据库

## 开发环境

### 启动开发服务器

**后端开发**：
```bash
cd backend
npm install
npm run dev
```

**前端开发**：
直接在浏览器中打开 `frontend/index.html` 文件。

### 数据库迁移

```bash
# 自动创建/更新表结构
cd backend
node app.js
```

## 许可证

MIT
