const Item = require('../models/item.model');
const Loan = require('../models/loan.model').default;

exports.getLoanByUser = async (req, res) => {
  try {
    const user = req.user;
    const isAdmin = user.roles?.includes('ADMIN');
    const isManager = user.roles?.includes('MANAGER');

    if (!isAdmin && !isManager) {
      return res.status(403).json({ error: 'Bạn không có quyền xem dữ liệu này' });
    }

    // Lọc các loan chưa bị xóa (chưa hoàn trả)
    const query = { isDeleted: false };

    // Nếu là manager thì chỉ lấy các món mình cho mượn
    if (isManager && !isAdmin) {
      query.createdBy = user._id; // cần đảm bảo trường này tồn tại trong Loan
    }

    const loans = await Loan.find(query).sort({ loanDate: -1 });

    const codes = loans.map((l) => l.itemId);
    const items = await Item.find({ code: { $in: codes } });

    // Ghép thông tin item vào loan
    const result = loans
      .map((loan) => {
        const item = items.find((i) => i.code === loan.itemId);
        if (!item) return null; // bỏ qua loan không hợp lệ
        return {
          _id: loan._id,
          code: item.code,
          name: item.name,
          borrowerName: loan.borrowerName,
          loanDate: loan.loanDate,
          returnDueDate: loan.returnDueDate,
          imageUrl: item.imageUrl || null,
        };
      })
      .filter(Boolean); // loại bỏ null



    res.status(200).json({ items: result });
  } catch (err) {
    console.error('[GET USER LOAN ERROR]', err);
    res.status(500).json({ error: 'Lỗi server khi tải danh sách mượn' });
  }
};

exports.returnLoanItem = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Tìm loan record
    const loan = await Loan.findById(id);
    if (!loan) return res.status(404).json({ error: 'Không tìm thấy bản ghi mượn' });

    // 2. Cập nhật Loan: đánh dấu là đã trả
    loan.isDeleted = true;
    await loan.save();

    // 3. Cập nhật Item: không còn là đang mượn
    await Item.updateOne({ code: loan.code }, { isLoaned: false });

    res.status(200).json({ message: '✅ Vật phẩm đã được nhận lại thành công' });
  } catch (err) {
    console.error('[RETURN LOAN ERROR]', err);
    res.status(500).json({ error: 'Lỗi server khi xử lý trả vật phẩm' });
  }
};

exports.createBatchLoan = async (req, res) => {
  try {
    const { borrowerName, items } = req.body;

    if (!borrowerName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Thiếu thông tin mượn' });
    }

    const now = new Date();

    // Lấy danh sách mã cần kiểm tra
    const itemCodes = items.map(i => i.code);
    const dbItems = await Item.find({ code: { $in: itemCodes }, isLoaned: false, isDeleted: { $ne: true } });

    const successLoans = [];
    const failedCodes = [];

    for (const itemData of items) {
      const dbItem = dbItems.find(i => i.code === itemData.code);

      if (!dbItem) {
        failedCodes.push(itemData.code);
        continue;
      }

      const loan = new Loan({
        itemId: itemData.code,
        borrowerName,
        loanDate: now,
        returnDueDate: itemData.returnDueDate,
        status: 'borrowed',
        damaged: itemData.damaged || false,
        damageNote: itemData.damageNote || '',
        borrowerImageUrl: itemData.borrowerImageUrl || '',
        createdBy: req.user._id, // ✅ lấy từ token
      });

      await loan.save();
      dbItem.isLoaned = true;
      dbItem.lastLender = req.user._id;
      await dbItem.save();

      successLoans.push(loan);
    }

    return res.json({
      message: `Đã ghi nhận ${successLoans.length} vật phẩm mượn`,
      success: successLoans.length,
      failed: failedCodes,
    });
  } catch (err) {
    console.error('Lỗi tạo phiếu mượn:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
};

exports.uploadLoanImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No image uploaded' });

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'ivenly-loans' },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary error:', error);
          return res.status(500).json({ error: 'Image upload failed' });
        }

        return res.status(200).json({ imageUrl: result.secure_url });
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  } catch (err) {
    console.error('[UPLOAD LOAN IMAGE ERROR]', err);
    res.status(500).json({ error: 'Server error during image upload' });
  }
};


