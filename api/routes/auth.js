const express = require('express');
const router = express.Router();
const { loginAdmin, authenticateToken } = require('../middleware/auth');

// Přihlášení
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Vyžadováno uživatelské jméno a heslo' 
      });
    }
    
    const result = await loginAdmin(username, password);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
    
  } catch (error) {
    console.error('Chyba při přihlášení:', error);
    res.status(500).json({ success: false, error: 'Chyba serveru' });
  }
});

// Ověření tokenu
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    success: true, 
    user: req.user 
  });
});

// Odhlášení (token se smaže na klientovi)
router.post('/logout', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Odhlášení proběhlo úspěšně' 
  });
});

module.exports = router;
