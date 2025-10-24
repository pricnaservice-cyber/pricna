// Skript pro vygenerování hash hesla pro admin uživatele
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

// Použití: node scripts/hash-password.js VaseHeslo
const password = process.argv[2];

if (!password) {
  console.error('Použití: node scripts/hash-password.js VaseHeslo');
  process.exit(1);
}

hashPassword(password).then(hash => {
  console.log('\n📌 Hash vašeho hesla:');
  console.log(hash);
  console.log('\n✏️  Zkopírujte tento hash do souboru .env jako ADMIN_PASSWORD_HASH');
  console.log('   Příklad: ADMIN_PASSWORD_HASH=' + hash);
  console.log('');
}).catch(err => {
  console.error('Chyba:', err);
  process.exit(1);
});
