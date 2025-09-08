export default function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];

  if (!token || token !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: '🚫 Unauthorized admin access' });
  }

  next();
}
