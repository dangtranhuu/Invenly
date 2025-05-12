const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

// Lấy danh sách tất cả người dùng
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // ẩn mật khẩu
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Lấy chi tiết 1 người dùng
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: 'Không tìm thấy user' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Tạo người dùng mới
exports.createUser = async (req, res) => {
  try {
    const { username, fullname, password, roles } = req.body;
    const normalizedUsername = username.toLowerCase();

    // Kiểm tra username đã tồn tại
    const existing = await User.findOne({ username: normalizedUsername });
    if (existing) return res.status(400).json({ error: 'Username đã tồn tại' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username: normalizedUsername,
      fullname,
      password: hashedPassword,
      roles,
      createDate: new Date()
    });

    await user.save();
    res.status(201).json({ message: 'Tạo user thành công' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Cập nhật thông tin người dùng
exports.updateUser = async (req, res) => {
  try {
    const { fullname, password, roles } = req.body;

    const updateData = {
      fullname,
      roles
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy user' });

    res.json({ message: 'Cập nhật thành công', user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Xoá người dùng
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Không tìm thấy user' });
    res.json({ message: 'Xoá user thành công' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};
