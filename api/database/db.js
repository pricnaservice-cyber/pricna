const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'pricna.db');
const db = new Database(dbPath);

// Vytvoření tabulek
db.exec(`
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time_slots TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    company TEXT,
    message TEXT,
    total_price INTEGER NOT NULL,
    status TEXT DEFAULT 'confirmed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    item_name TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    service TEXT,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
  CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
  CREATE INDEX IF NOT EXISTS idx_inquiries_type ON inquiries(type);
`);

// CRUD operace pro rezervace
const reservations = {
  // Vytvoření nové rezervace
  create: (data) => {
    const stmt = db.prepare(`
      INSERT INTO reservations (date, time_slots, name, email, phone, company, message, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.date,
      JSON.stringify(data.time_slots),
      data.name,
      data.email,
      data.phone,
      data.company || null,
      data.message || null,
      data.total_price
    );
    return result.lastInsertRowid;
  },

  // Získání všech rezervací
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM reservations ORDER BY date DESC, created_at DESC');
    return stmt.all().map(row => ({
      ...row,
      time_slots: JSON.parse(row.time_slots)
    }));
  },

  // Získání rezervací podle data
  getByDate: (date) => {
    const stmt = db.prepare('SELECT * FROM reservations WHERE date = ? AND status = ?');
    return stmt.all(date, 'confirmed').map(row => ({
      ...row,
      time_slots: JSON.parse(row.time_slots)
    }));
  },

  // Získání rezervací v rozmezí dat
  getByDateRange: (startDate, endDate) => {
    const stmt = db.prepare('SELECT * FROM reservations WHERE date BETWEEN ? AND ? AND status = ? ORDER BY date ASC');
    return stmt.all(startDate, endDate, 'confirmed').map(row => ({
      ...row,
      time_slots: JSON.parse(row.time_slots)
    }));
  },

  // Získání jedné rezervace podle ID
  getById: (id) => {
    const stmt = db.prepare('SELECT * FROM reservations WHERE id = ?');
    const row = stmt.get(id);
    if (row) {
      return {
        ...row,
        time_slots: JSON.parse(row.time_slots)
      };
    }
    return null;
  },

  // Aktualizace rezervace
  update: (id, data) => {
    const stmt = db.prepare(`
      UPDATE reservations 
      SET date = ?, time_slots = ?, name = ?, email = ?, phone = ?, 
          company = ?, message = ?, total_price = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(
      data.date,
      JSON.stringify(data.time_slots),
      data.name,
      data.email,
      data.phone,
      data.company || null,
      data.message || null,
      data.total_price,
      data.status || 'confirmed',
      id
    );
    return result.changes > 0;
  },

  // Zrušení rezervace
  cancel: (id) => {
    const stmt = db.prepare('UPDATE reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run('cancelled', id);
    return result.changes > 0;
  },

  // Smazání rezervace
  delete: (id) => {
    const stmt = db.prepare('DELETE FROM reservations WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // Kontrola dostupnosti časových slotů
  checkAvailability: (date, timeSlots) => {
    const existingReservations = reservations.getByDate(date);
    const bookedSlots = existingReservations.flatMap(res => res.time_slots);
    
    // Kontrola, zda některý z požadovaných slotů je už zabraný
    const hasConflict = timeSlots.some(slot => bookedSlots.includes(slot));
    
    return {
      available: !hasConflict,
      bookedSlots: bookedSlots
    };
  }
};

// CRUD operace pro poptávky
const inquiries = {
  create: (data) => {
    const stmt = db.prepare(`
      INSERT INTO inquiries (type, item_name, name, email, phone, service, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.type,
      data.item_name || null,
      data.name,
      data.email,
      data.phone || null,
      data.service || null,
      data.message
    );
    return result.lastInsertRowid;
  },

  getAll: () => {
    const stmt = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC');
    return stmt.all();
  },

  getById: (id) => {
    const stmt = db.prepare('SELECT * FROM inquiries WHERE id = ?');
    return stmt.get(id);
  },

  getByType: (type) => {
    const stmt = db.prepare('SELECT * FROM inquiries WHERE type = ? ORDER BY created_at DESC');
    return stmt.all(type);
  }
};

module.exports = {
  db,
  reservations,
  inquiries
};
