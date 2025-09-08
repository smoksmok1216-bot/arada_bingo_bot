import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

router.post('/confirm', upload.single('screenshot'), async (req, res) => {
  const { telegramId, amount, method, txId, phone } = req.body;
  const screenshotPath = req.file?.path;

  if (!telegramId || !amount || !method || !txId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  if (amount < 30) {
    return res.status(400).json({ success: false, message: 'Minimum deposit is 30 Br' });
  }

  if (!['CBE', 'CBE_BIRR', 'TELEBIRR'].includes(method)) {
    return res.status(400).json({ success: false, message: 'Invalid deposit method' });
  }

  try {
    const player = await Player.findOne({ telegramId });
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    const confirmation = new DepositConfirmation({
      telegramId,
      username: player.username,
      amount,
      method,
      txId,
      phone,
      screenshot: screenshotPath,
      status: 'pending'
    });

    await confirmation.save();
    res.status(200).json({ success: true, message: 'Deposit submitted with screenshot' });
  } catch (err) {
    console.error('Deposit confirm error:', err);
    res.status(500).json({ success: false, message: 'Server error during deposit confirmation' });
  }
});
