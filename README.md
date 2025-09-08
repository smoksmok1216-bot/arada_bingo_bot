# Telegram Bingo Bot

Features:
- Buy cards (10/20/30/50/100 ETB)
- Auto-calling numbers every 2-3s (config CALL_INTERVAL_MS)
- Win detection: row/col/diagonal/4 corners
- Commission split: 80% winner, 18% admin, 2% jackpot
- Deposit / Withdrawal (manual approval by admin)
- Bilingual menus (English / Amharic)
- Deployable on Render (Node.js)

Env variables: BOT_TOKEN, DB_URL, ADMIN_ID, PORT, CALL_INTERVAL_MS
Start: `npm install` then `npm start`
