const authJwt = require("../middlewares/authJwt");
const controller = require('../controllers/loan.controller');
const  upload  = require('../utils/multer'); // nếu dùng multer tách riêng

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  app.get('/api/loan/user', authJwt.verifyToken, controller.getLoanByUser);
  app.get('/api/loan/return/:id', authJwt.verifyToken, controller.returnLoanItem);
  app.post('/api/loan/upload-image',  upload.single('image'), controller.uploadLoanImage);
  app.post('/api/loan/batch', authJwt.verifyToken, controller.createBatchLoan);
};
