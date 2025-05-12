const path = require('path');
const fs = require('fs');

exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const imageUrl = `${process.env.SERVER_URL || 'http://localhost:3000'}/uploads/${req.file.filename}`;
  return res.json({ url: imageUrl });
};
