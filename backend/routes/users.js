const express = require('express');
const bcrypt = require('bcrypt');
const { User } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();
const PASSWORD_MIN_LENGTH = 8;

function isAdmin(req) {
  return req.user && req.user.username === 'admin';
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function canManageUser(req, id) {
  return isAdmin(req) || Number(req.user.id) === Number(id);
}

function userAttributes(includePrivateSettings = false) {
  const attrs = ['id', 'username', 'nickname', 'birthday', 'avatar', 'background', 'backgroundOpacity', 'glassEffect', 'loginBackground'];
  if (includePrivateSettings) {
    attrs.push('amapWebKey', 'amapSecurityCode', 'amapRestKey');
  }
  return attrs;
}

// 获取用户列表（需要认证）
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'nickname', 'birthday', 'avatar', 'createdAt']
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: '获取用户列表失败', error: error.message });
  }
});

// 获取当前用户信息（需要认证）
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: userAttributes(true)
    });
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: '获取用户信息失败', error: error.message });
  }
});

// 获取指定用户信息（不需要认证，仅用于获取登录背景图片）
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(parseInt(id), {
      attributes: ['loginBackground']
    });
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: '获取用户信息失败', error: error.message });
  }
});

// 创建新用户（需要认证）
router.post('/', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: '无权创建用户' });
    }
    const { birthday, avatar } = req.body;
    const username = normalizeString(req.body.username);
    const nickname = normalizeString(req.body.nickname) || username;
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    
    // 验证必填字段
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
      username,
      nickname: nickname || username,
      password: hashedPassword,
      birthday: birthday || null,
      avatar: avatar || 'https://i.pravatar.cc/150?u=' + Math.random().toString(36).substr(2, 9)
    });
    
    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      nickname: newUser.nickname,
      birthday: newUser.birthday,
      avatar: newUser.avatar
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: '创建用户失败' });
  }
});

// 更新用户信息（需要认证）
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, password, birthday, avatar, background, backgroundOpacity, glassEffect, loginBackground, amapWebKey, amapSecurityCode, amapRestKey } = req.body;
    if (!canManageUser(req, id)) {
      return res.status(403).json({ message: '无权更新此用户' });
    }
    
    // 查找用户
    const user = await User.findByPk(parseInt(id));
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 更新用户信息
    const updateData = {};
    if (nickname !== undefined) updateData.nickname = normalizeString(nickname);
    if (password !== undefined && password !== '') {
      if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
        return res.status(400).json({ message: `密码至少 ${PASSWORD_MIN_LENGTH} 位` });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }
    // 处理生日：空字符串转为null
    if (birthday !== undefined) {
      updateData.birthday = birthday !== '' ? birthday : null;
    }
    if (avatar !== undefined) updateData.avatar = avatar;
    if (background !== undefined) updateData.background = background;
    if (backgroundOpacity !== undefined) updateData.backgroundOpacity = backgroundOpacity;
    if (glassEffect !== undefined) updateData.glassEffect = glassEffect;
    if (loginBackground !== undefined) updateData.loginBackground = loginBackground;
    if (amapWebKey !== undefined) updateData.amapWebKey = normalizeString(amapWebKey) || null;
    if (amapSecurityCode !== undefined) updateData.amapSecurityCode = normalizeString(amapSecurityCode) || null;
    if (amapRestKey !== undefined) updateData.amapRestKey = normalizeString(amapRestKey) || null;
    
    await user.update(updateData);
    
    res.json({
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
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: '更新用户信息失败' });
  }
});

// 删除用户（需要认证）
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: '无权删除用户' });
    }
    const { id } = req.params;
    
    // 不允许删除ID为1的管理员账户
    if (parseInt(id) === 1) {
      return res.status(400).json({ message: '不能删除管理员账户' });
    }
    
    // 查找用户
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 删除用户
    await user.destroy();
    
    res.json({ message: '用户删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除用户失败' });
  }
});

module.exports = router;
