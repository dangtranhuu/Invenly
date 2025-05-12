const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");

const verifyToken = (req, res, next) => {
  const tokenHeader = req.header("Authorization");

  console.log(`auth: ${tokenHeader}`);

  if (!tokenHeader || !tokenHeader.startsWith("Bearer ")){
    return res.status(403).send({ message: "No token or malformed token!" });
  }

  const token = tokenHeader.substring(7);

  jwt.verify(token, config.secretJwt, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    req.user = decoded; // Lưu decoded token vào request
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (!req.user?.roles?.includes("ADMIN")) {
    return res.status(403).send({ message: "Admin role required!" });
  }
  next();
};

const isModerator = (req, res, next) => {
  if (!req.user?.roles?.includes("MODERATOR")) {
    return res.status(403).send({ message: "Moderator role required!" });
  }
  next();
};

module.exports = {
  verifyToken,
  isAdmin,
  isModerator,
};
