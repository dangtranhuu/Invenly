const authJwt = require("../middlewares/authJwt");
const controller = require('../controllers/item.controller');
const upload = require('../utils/multer'); // nếu dùng multer tách riêng


module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  // CRUD vật phẩm
  app.get('/api/item', controller.getAllItems);
  app.get('/api/items/code/:code', controller.getItemByCode);
  app.get('/api/item/:id', controller.getItemById);
  app.post('/api/item', controller.createItem);
  app.put('/api/item/:id', controller.updateItem);
  app.delete('/api/item/:id', controller.deleteItem);
  app.post('/api/item/import-items', controller.importItems);

  app.post('/api/item/:id/upload-image', upload.single('image'), controller.uploadImage);
  app.get('/api/item/code/:code', controller.getItemByCode);
  // Nếu có các route mở rộng sau này (nhập thêm số lượng, lọc theo category...)
  //   app.post('/api/items', authJwt.verifyToken, authJwt.isAdmin, controller.createItem);

};
