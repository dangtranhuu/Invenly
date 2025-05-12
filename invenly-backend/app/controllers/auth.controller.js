const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const config = require("../config/auth.config"); // chứa secretJwt

exports.signin = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('[LOGIN] input:', { username, password });

    const normalizedUsername = username.toLowerCase();

    const user = await User.findOne({ username: normalizedUsername });
    if (!user) {
      console.log('[LOGIN] User not found');
      return res.status(400).json({ message: "User not found" });
    }

    console.log('[LOGIN] DB user found:', user);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('[LOGIN] Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(403).json({ message: "Invalid username or password" });
    }

    console.log(config.secretJwt)

    const token = jwt.sign(
      { username: user.username, roles: user.roles },
      config.secretJwt,
      { expiresIn: "1d" }
    );

    console.log(token)

    return res.status(200).json({
      message: "Login successful",
      user: {
        // id: user._id,
        fullname: user.fullname,
        username: user.username,
        roles: user.roles,
        token,
      },
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};


exports.signout = (req, res) => {
  // Nếu bạn không dùng session, thì đơn giản chỉ cần để frontend xóa token
  return res.status(200).send({ message: "You have been signed out!" });
};
