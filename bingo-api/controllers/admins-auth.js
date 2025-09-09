const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const Admin = mongoose.model('Admin');

// 🔐 Register new admin (optional)
module.exports.register = async function (req, res) {
  const { name, email, password } = req.body;

  const existing = await Admin.findOne({ email });
  if (existing) {
    return res.status(200).json({ isExisted: true });
  }

  const admin = new Admin({ name, email });
  admin.salt = crypto.randomBytes(16).toString('hex');
  admin.hash = crypto.pbkdf2Sync(password, admin.salt, 1000, 64, 'sha512').toString('hex');

  await admin.save();
  const token = generateJwt(admin);
  res.status(200).json({ token });
};

// 🔐 Login admin
module.exports.loginAdmin = async function (req, res) {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });
  if (!admin) return res.status(401).json({ message: 'Admin not found' });

  const hash = crypto.pbkdf2Sync(password, admin.salt, 1000, 64, 'sha512').toString('hex');
  if (admin.hash !== hash) return res.status(401).json({ message: 'Invalid password' });

  const token = generateJwt(admin);
  res.status(200).json({ token });
};

// 🔐 JWT generator
function generateJwt(admin) {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  return jwt.sign({
    _id: admin._id,
    email: admin.email,
    name: admin.name,
    exp: parseInt(expiry.getTime() / 1000)
  }, process.env.ADMIN_SECRET);
}
