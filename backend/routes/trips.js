const express = require('express');
const { Trip, User } = require('../models');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 处理Base64图片的函数
function handleBase64Image(base64String) {
  if (!base64String || !base64String.startsWith('data:image/')) {
    return base64String;
  }

  // 提取图片类型和数据
  const matches = base64String.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) {
    return base64String;
  }

  const data = matches[2];
  const buffer = Buffer.from(data, 'base64');
  const maxSize = Number(process.env.MAX_UPLOAD_SIZE || 5 * 1024 * 1024);
  if (buffer.length > maxSize) {
    throw new Error('图片大小超出限制');
  }

  // 生成唯一文件名，统一使用 .jpg 后缀
  const filename = `${Date.now()}-${Math.floor(Math.random() * 1000000)}.jpg`;
  const filepath = path.join(uploadsDir, filename);

  // 保存文件
  fs.writeFileSync(filepath, buffer);

  // 返回文件名
  return filename;
}

const router = express.Router();

function participantNames(participants) {
  return String(participants || '')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);
}

function normalizeParticipants(participants) {
  return participantNames(participants).join(',');
}

function canAccessTrip(trip, user, userId) {
  return Number(trip.userId) === Number(userId) || participantNames(trip.participants).includes(user.nickname);
}

// 获取行程列表（需要认证）
router.get('/', auth, async (req, res) => {
  try {
    // 获取用户信息
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 获取用户创建的行程和参与的行程
    const trips = await Trip.findAll({
      where: {
        [Op.or]: [
          { userId: req.user.id },
          { participants: { [Op.iLike]: `%${user.nickname}%` } }
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    const userTrips = trips.filter(trip => canAccessTrip(trip, user, req.user.id));

    res.json(userTrips);
  } catch (error) {
    res.status(500).json({ message: '获取行程列表失败', error: error.message });
  }
});

// 获取单个行程（需要认证）
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findByPk(id);

    if (!trip) {
      return res.status(404).json({ message: '行程不存在' });
    }

    // 获取用户信息
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 检查用户是否是创建者或参与者
    const isCreator = Number(trip.userId) === Number(req.user.id);
    const isParticipant = participantNames(trip.participants).includes(user.nickname);

    if (!isCreator && !isParticipant) {
      return res.status(403).json({ message: '无权访问此行程' });
    }

    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: '获取行程失败', error: error.message });
  }
});

// 创建行程（需要认证）
router.post('/', auth, async (req, res) => {
  try {
    const { cover, title, description, transport, participants, startLocation, endLocation, attractions, startDate, endDate, days, dailyPlans } = req.body;

    // 验证必填字段
    if (!title || !startDate || !endDate || !days) {
      return res.status(400).json({ message: '缺少必填字段' });
    }

    // 处理封面图片
    const processedCover = handleBase64Image(cover);

    // 创建行程
    const newTrip = await Trip.create({
      userId: req.user.id,
      cover: processedCover,
      title,
      description,
      transport,
      participants: normalizeParticipants(participants),
      startLocation,
      endLocation,
      attractions,
      startDate,
      endDate,
      days,
      dailyPlans
    });

    res.status(201).json(newTrip);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(error.message === '图片大小超出限制' ? 413 : 500).json({ message: error.message === '图片大小超出限制' ? error.message : '创建行程失败' });
  }
});

// 更新行程（需要认证）
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { cover, title, description, transport, participants, startLocation, endLocation, attractions, startDate, endDate, days, dailyPlans } = req.body;

    // 查找行程
    const trip = await Trip.findOne({
      where: {
        id: parseInt(id)
      }
    });

    if (!trip) {
      return res.status(404).json({ message: '行程不存在' });
    }

    // 获取用户信息
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 检查用户是否是创建者或参与者
    const isCreator = Number(trip.userId) === Number(req.user.id);
    const isParticipant = participantNames(trip.participants).includes(user.nickname);

    if (!isCreator && !isParticipant) {
      return res.status(403).json({ message: '无权更新此行程' });
    }

    // 更新行程信息
    const updateData = {};
    if (cover !== undefined) updateData.cover = handleBase64Image(cover);
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (transport !== undefined) updateData.transport = transport;
    if (participants !== undefined) updateData.participants = normalizeParticipants(participants);
    if (startLocation !== undefined) updateData.startLocation = startLocation;
    if (endLocation !== undefined) updateData.endLocation = endLocation;
    if (attractions !== undefined) updateData.attractions = attractions;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (days !== undefined) updateData.days = days;
    if (dailyPlans !== undefined) updateData.dailyPlans = dailyPlans;

    await trip.update(updateData);

    res.json(trip);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(error.message === '图片大小超出限制' ? 413 : 500).json({ message: error.message === '图片大小超出限制' ? error.message : '更新行程失败' });
  }
});

// 删除行程（需要认证）
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // 查找行程
    const trip = await Trip.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });
    if (!trip) {
      return res.status(404).json({ message: '行程不存在' });
    }

    // 删除行程
    await trip.destroy();

    res.json({ message: '行程删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除行程失败', error: error.message });
  }
});

module.exports = router;
