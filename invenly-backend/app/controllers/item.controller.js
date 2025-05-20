const Item = require("../models/item.model");
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('../utils/cloudinary');

// Lấy danh sách tất cả vật phẩm chưa bị xóa
// 8/5/2025 - tạm thời lấy list sách vừa nhập để lưu ảnh
// exports.getAllItems = async (req, res) => {
//   try {
//     const items = await Item.find({ isDeleted: { $ne: true } });
//     res.json(items);
//   } catch (err) {
//     res.status(500).json({ error: 'Lỗi server' });
//   }
// };
exports.getAllItems = async (req, res) => {
  try {
    const items = await Item.find({ isDeleted: { $ne: true } });

    const sorted = items.sort((a, b) => {
      const aDesc = parseInt(a.description || '0', 10);
      const bDesc = parseInt(b.description || '0', 10);
      return aDesc - bDesc;
    });

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};


// Lấy chi tiết vật phẩm theo ID (nếu chưa bị xóa)
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ error: 'Không tìm thấy vật phẩm' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Lấy theo mã code (cho scan QR)
exports.getItemByCode = async (req, res) => {
  try {
    const item = await Item.findOne({ code: req.params.code, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ error: 'Không tìm thấy vật phẩm' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};


// Tạo mới vật phẩm
exports.createItem = async (req, res) => {
  try {
    const {
      name, category, description, totalQuantity,
      minThreshold, imageUrl, manager, source
    } = req.body;

    const timestamp = Date.now();
    const code = `ITEM-${timestamp}`; // Ví dụ: ITEM-1714990109923

    const item = new Item({
      name,
      code,
      category,
      description,
      totalQuantity,
      remainingQuantity: totalQuantity,
      minThreshold,
      imageUrl,
      manager,
      source
    });

    await item.save();

    res.status(201).json({
      message: "Tạo vật phẩm thành công",
      item
    });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

// Cập nhật vật phẩm
exports.updateItem = async (req, res) => {
  try {
    const userId = req.user?._id; // lấy _id từ middleware

    if (!userId) {
      return res.status(401).json({ error: 'Không xác định được người dùng cập nhật' });
    }

    const updateData = req.body;

    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Không tìm thấy vật phẩm' });

    // Cập nhật dữ liệu
    Object.assign(item, updateData);

    // Ghi lịch sử cập nhật
    item.updateHistory = item.updateHistory || [];
    item.updateHistory.push({
      user: userId,
      updatedAt: new Date()
    });

    await item.save();

    res.json({ message: 'Cập nhật thành công', item });
  } catch (err) {
    console.error('[UPDATE ERROR]', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};



// Xóa mềm vật phẩm (soft delete)
exports.deleteItem = async (req, res) => {
  try {
    const deleted = await Item.findByIdAndUpdate(req.params.id, { isDeleted: true });
    if (!deleted) return res.status(404).json({ error: 'Không tìm thấy vật phẩm' });
    res.json({ message: 'Đã xoá vật phẩm (ẩn)' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

exports.importItems = async (req, res) => {
  try {
    const { manager, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Không có dữ liệu sản phẩm để import' });
    }

    const createdItems = await Promise.all(
      items.map(async (item) => {
        const code = `ITEM-${Date.now()}-${uuidv4().slice(0, 6)}`; // sinh mã code duy nhất

        const newItem = new Item({
          name: item.name,
          code,
          category: item.category,
          description: item.description || '',
          source: item.source || '',
          manager,
          minThreshold: item.minThreshold || 0,
        });

        return await newItem.save();
      })
    );

    res.status(201).json({ message: `Đã import ${createdItems.length} sản phẩm`, items: createdItems });
  } catch (err) {
    console.error('[IMPORT ERROR]', err);
    res.status(500).json({ message: 'Lỗi khi import sản phẩm', error: err.message });
  }
};


exports.uploadImage = async (req, res) => {
  try {
    const file = req.file;
    const itemId = req.params.id;

    if (!file) return res.status(400).json({ error: 'No image uploaded' });

    // Step 1: Find the current item to get the old image URL
    const item = await Item.findById(itemId);
    const oldImageUrl = item?.imageUrl;

    // Step 2: If exists, extract public_id and delete from Cloudinary
    if (oldImageUrl) {
      const parts = oldImageUrl.split('/');
      const filename = parts[parts.length - 1];
      const publicId = 'ivenly-items/' + filename.split('.')[0];

      await cloudinary.uploader.destroy(publicId);
    }

    // Step 3: Upload the new image
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'ivenly-items' },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary error:', error);
          return res.status(500).json({ error: 'Image upload failed' });
        }

        // Optionally update item with new URL
        item.imageUrl = result.secure_url;
        await item.save();

        return res.status(200).json({ imageUrl: result.secure_url });
      }
    );

    require('streamifier').createReadStream(file.buffer).pipe(stream);
  } catch (err) {
    console.error('[UPLOAD ERROR]', err);
    res.status(500).json({ error: 'Server error during upload' });
  }
};