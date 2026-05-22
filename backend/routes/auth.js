const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { getJwtSecret } = require('../middleware/auth');

const router = express.Router();
const PASSWORD_MIN_LENGTH = 8;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    birthday: user.birthday,
    avatar: user.avatar,
    background: user.background,
    backgroundOpacity: user.backgroundOpacity,
    glassEffect: user.glassEffect,
    loginBackground: user.loginBackground,
    amapWebKey: user.amapWebKey,
    amapSecurityCode: user.amapSecurityCode,
    amapRestKey: user.amapRestKey
  };
}

// 注册路由
router.post('/register', async (req, res) => {
  try {
    const { birthday, avatar } = req.body;
    const username = normalizeString(req.body.username);
    const nickname = normalizeString(req.body.nickname) || username;
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    const userCount = await User.count();
    if (userCount > 0) {
      return res.status(403).json({ message: '系统已初始化，请由管理员创建用户' });
    }

    if (!username || password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({ message: `用户名不能为空，密码至少 ${PASSWORD_MIN_LENGTH} 位` });
    }
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建新用户
    const newUser = await User.create({
      id: 1,
      username,
      nickname,
      password: hashedPassword,
      birthday,
      avatar: avatar || 'https://i.pravatar.cc/150?u=' + Math.random().toString(36).substr(2, 9)
    });
    
    res.status(201).json({ message: '用户创建成功' });
  } catch (error) {
    res.status(500).json({ message: '注册失败' });
  }
});

// 登录路由
router.post('/login', async (req, res) => {
  try {
    const username = normalizeString(req.body.username);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    
    // 查找用户
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    // 生成token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      getJwtSecret(),
      { expiresIn: '7d' }
    );
    
    // 返回用户信息和token
    res.json({
      token,
      user: publicUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: '登录失败' });
  }
});

module.exports = router;
