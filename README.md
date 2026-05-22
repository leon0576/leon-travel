# leon-travel

一个轻量的行程规划项目，包含：

- 用户登录与个人资料（头像/背景、主题设置）
- 行程创建与每日计划
- 费用记录与导出 PDF
- 高德地图集成（JS API + Web 服务）用于路线/地图

## 快速开始（Docker）

1. 从示例创建本地环境变量文件：

```bash
cp .env.example .env
```

2. 启动服务：

```bash
docker compose up -d --build
```

3. 访问：

- 应用：http://localhost:3000
- 健康检查：http://localhost:3000/health

## GHCR 镜像

项目配置了 GitHub Actions 自动构建并推送后端镜像到 GHCR：

- `ghcr.io/leon0576/leon-travel-backend:latest`
- `ghcr.io/leon0576/leon-travel-backend:sha-<commit>`

## 配置说明

后端读取以下环境变量（见 `.env.example`）：

- `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST`, `DB_PORT`
- `JWT_SECRET`（必填）
- `DEFAULT_ADMIN_PASSWORD`（可选：首次部署用于创建管理员）
- `MAX_UPLOAD_SIZE`, `JSON_BODY_LIMIT`, `CORS_ORIGINS`
- `DB_SYNC_ALTER`（仅建议开发环境；生产建议使用 migrations）

## 高德 Key 配置

高德 Key 在应用内的“设置”页面填写：

- JS API Key（Web端）：用于加载高德 JS SDK 与交互式地图
- `securityJsCode`：可选（开启 JS API 安全校验时填写）
- Web 服务 Key：用于静态地图/地理编码等 HTTP 接口

## License

MIT，见 `LICENSE`。
