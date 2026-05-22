const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const sequelize = require('./config/database');
const { User, Trip } = require('./models');
const auth = require('./middleware/auth');

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tripRoutes = require('./routes/trips');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE || 5 * 1024 * 1024);

// 确保 uploads 目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 确保 img 目录存在
const imgDir = path.join(__dirname, '../img');
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

// 也确保 /img 目录存在（用于Docker容器）
const dockerImgDir = '/img';
try {
  if (!fs.existsSync(dockerImgDir)) {
    fs.mkdirSync(dockerImgDir, { recursive: true });
  }
} catch (error) {
  console.warn('无法创建 /img 目录，将使用本地 img 目录');
}

function isAllowedImage(file) {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
}

function fileFilter(req, file, cb) {
  if (!isAllowedImage(file)) {
    return cb(new Error('只允许上传 jpg、png、webp 或 gif 图片'));
  }
  cb(null, true);
}

// 配置 multer 存储 - 上传到 uploads 目录
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 配置 multer 存储 - 上传到 img 目录
const imgStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 优先使用 /img 目录（Docker容器），如果不存在则使用本地目录
    const targetDir = fs.existsSync('/img') ? '/img' : imgDir;
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_UPLOAD_SIZE } });
const imgUpload = multer({ storage: imgStorage, fileFilter, limits: { fileSize: MAX_UPLOAD_SIZE } });

function handleUploadErrors(uploadMiddleware) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (error) => {
      if (!error) return next();
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: '图片大小超出限制' });
      }
      return res.status(400).json({ message: error.message || '上传失败' });
    });
  };
}

// 中间件
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true
}));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_BODY_LIMIT || '10mb' }));

// 静态文件服务 - 上传的图片
app.use('/api/uploads', express.static(uploadsDir));
// 优先使用 /img 目录（Docker容器），如果不存在则使用本地目录
const staticImgDir = fs.existsSync('/img') ? '/img' : imgDir;
app.use('/api/img', express.static(staticImgDir));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);

app.get('/api/amap/validate', (req, res) => {
  res.json({ ok: true, message: 'amap validate endpoint ready' });
});

app.post('/api/amap/validate', auth, async (req, res) => {
  try {
    const restKey = typeof req.body.restKey === 'string' ? req.body.restKey.trim() : '';
    if (!restKey) {
      return res.status(400).json({ ok: false, message: '请填写高德 Web服务 Key' });
    }

    const url = new URL('https://restapi.amap.com/v3/geocode/geo');
    url.searchParams.set('address', '北京');
    url.searchParams.set('city', '北京');
    url.searchParams.set('key', restKey);

    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await response.json().catch(() => ({}));

    if (response.ok && data.status === '1') {
      return res.json({ ok: true, message: 'Web服务 Key 验证通过' });
    }

    res.status(400).json({
      ok: false,
      message: data.info || data.infocode || 'Web服务 Key 验证失败'
    });
  } catch (error) {
    res.status(502).json({ ok: false, message: '无法连接高德验证服务' });
  }
});

// 文件上传接口 - 上传到 uploads 目录
app.post('/api/upload', auth, handleUploadErrors(upload.single('image')), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  // 返回上传后的文件路径
  res.json({
    filename: req.file.filename,
    path: `/api/uploads/${req.file.filename}`
  });
});

// 文件上传接口 - 上传到 img 目录
app.post('/api/upload-img', auth, handleUploadErrors(imgUpload.single('image')), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  // 返回上传后的文件路径
  res.json({
    filename: req.file.filename,
    path: `/api/img/${req.file.filename}`
  });
});

// 提供前端静态文件
const frontendPath = path.join(__dirname, 'frontend');
app.use((req, res, next) => {
  let requestPath = req.path;
  try {
    requestPath = decodeURIComponent(req.path);
  } catch (error) {
    return res.status(400).end();
  }
  if (requestPath.includes('副本')) {
    return res.status(404).end();
  }
  next();
});
app.use(express.static(frontendPath));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 所有其他路由都返回 index.html (SPA 支持)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 初始化数据库
async function initDatabase() {
  try {
    // 当前项目仍依赖 sync 创建新字段，可通过 DB_SYNC_ALTER=false 禁用自动变更。
    await sequelize.sync({ alter: process.env.DB_SYNC_ALTER !== 'false' });
    console.log('数据库表结构已更新');

    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (adminUser) {
      console.log('默认管理员账户已存在');
    } else if (process.env.DEFAULT_ADMIN_PASSWORD) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD, 10);
      await User.create({
        id: 1,
        username: 'admin',
        nickname: '管理员',
        password: hashedPassword,
        avatar: 'https://i.pravatar.cc/150?u=admin'
      });
      console.log('默认管理员账户已通过环境变量创建');
    } else {
      console.log('未配置 DEFAULT_ADMIN_PASSWORD，跳过默认管理员创建');
    }
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

// 启动服务器
app.listen(PORT, async () => {
  console.log(`API 服务器运行在 http://localhost:${PORT}`);
  console.log(`前端页面访问 http://localhost:${PORT}`);
  await initDatabase();
});

module.exports = app;
