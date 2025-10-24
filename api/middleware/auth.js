const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Middleware pro ověření JWT tokenu
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Chybí autentizační token' 
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Neplatný nebo expirovaný token' 
      });
    }
    
    req.user = user;
    next();
  });
}

// Přihlášení admin uživatele
async function loginAdmin(username, password) {
  try {
    // Kontrola username
    if (username !== process.env.ADMIN_USERNAME) {
      return { success: false, error: 'Neplatné přihlašovací údaje' };
    }
    
    // Kontrola hesla
    const isValidPassword = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    
    if (!isValidPassword) {
      return { success: false, error: 'Neplatné přihlašovací údaje' };
    }
    
    // Vytvoření JWT tokenu (platnost 24 hodin)
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return { 
      success: true, 
      token,
      user: { username, role: 'admin' }
    };
    
  } catch (error) {
    console.error('Chyba při přihlášení:', error);
    return { success: false, error: 'Chyba serveru' };
  }
}

// Pomocná funkce pro hashování hesla (použijte pro vytvoření hash hesla)
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

module.exports = {
  authenticateToken,
  loginAdmin,
  hashPassword
};
