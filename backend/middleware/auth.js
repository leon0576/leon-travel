const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

// 认证中间件
const auth = (req, res, next) => {
  try {
    // 从请求头获取token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    // 验证token
    const decoded = jwt.verify(token, getJwtSecret());
    
    // 将用户信息存储在请求对象中
    req.user = decoded;
    
    next();
  } catch (error) {
    res.status(401).json({ message: '无效的认证令牌' });
  }
};

module.exports = auth;
module.exports.getJwtSecret = getJwtSecret;
