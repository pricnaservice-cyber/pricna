-- Tabulka pro rezervace
CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    message TEXT,
    totalPrice REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tabulka pro poptávky
CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    service TEXT,
    itemName TEXT,
    message TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tabulka pro nemovitosti (byty a kanceláře) spravované v admin panelu
CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('apartment', 'office')),
    title TEXT NOT NULL,
    building TEXT,
    location TEXT,
    size TEXT,
    capacity TEXT,
    price TEXT,
    utilities TEXT,
    deposit TEXT,
    vatNote TEXT,
    description TEXT,
    features TEXT DEFAULT '[]',   -- JSON pole řetězců
    images TEXT DEFAULT '[]',     -- JSON pole cest/URL obrázků
    available TEXT,
    published INTEGER DEFAULT 1,
    sortOrder INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tabulka pro omezení počtu pokusů o přihlášení
CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    ts INTEGER NOT NULL
);

-- Indexy pro rychlejší vyhledávání
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_email ON reservations(email);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_type ON inquiries(type);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(createdAt);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip, ts);
