// API Configuration
const API_URL = 'https://pricna-api.pricna-service.workers.dev/api';

// State
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let currentDate = new Date();
let allReservations = [];

// Time slots (stejné jako v rezervačním systému)
const TIME_SLOTS = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

// === ČESKÉ STÁTNÍ SVÁTKY ===
function calculateEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

function getCzechHolidays(year) {
    const holidays = [];
    const easter = calculateEaster(year);
    
    holidays.push(`${year}-01-01`); // Nový rok
    holidays.push(`${year}-05-01`); // Svátek práce
    holidays.push(`${year}-05-08`); // Den vítězství
    holidays.push(`${year}-07-05`); // Cyril a Metoděj
    holidays.push(`${year}-07-06`); // Jan Hus
    holidays.push(`${year}-09-28`); // Den české státnosti
    holidays.push(`${year}-10-28`); // Den vzniku Československa
    holidays.push(`${year}-11-17`); // Den boje za svobodu a demokracii
    holidays.push(`${year}-12-24`); // Štědrý den
    holidays.push(`${year}-12-25`); // 1. svátek vánoční
    holidays.push(`${year}-12-26`); // 2. svátek vánoční
    
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    holidays.push(goodFriday.toISOString().split('T')[0]);
    
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    holidays.push(easterMonday.toISOString().split('T')[0]);
    
    return holidays;
}

const currentYear = new Date().getFullYear();
const czechHolidays = [
    ...getCzechHolidays(currentYear),
    ...getCzechHolidays(currentYear + 1),
    ...getCzechHolidays(currentYear + 2)
];

function isHoliday(date) {
    const dateStr = formatDate(date);
    return czechHolidays.includes(dateStr);
}

// Czech month/day names
const MONTH_NAMES = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

const DAY_NAMES = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    if (authToken) {
        checkAuth();
    } else {
        showLoginScreen();
    }
    
    setupEventListeners();
});

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Day navigation
    const prevDayBtn = document.getElementById('prev-day');
    const nextDayBtn = document.getElementById('next-day');
    const todayBtn = document.getElementById('today-btn');
    
    if (prevDayBtn) prevDayBtn.addEventListener('click', () => changeDay(-1));
    if (nextDayBtn) nextDayBtn.addEventListener('click', () => changeDay(1));
    if (todayBtn) todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        loadDayView();
    });
    
    // Date picker
    const pickDateBtn = document.getElementById('pick-date-btn');
    const datePickerInput = document.getElementById('date-picker-input');
    if (pickDateBtn && datePickerInput) {
        pickDateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            datePickerInput.showPicker ? datePickerInput.showPicker() : datePickerInput.click();
        });
        datePickerInput.addEventListener('change', (e) => {
            if (e.target.value) {
                const selectedDate = new Date(e.target.value + 'T12:00:00');
                currentDate = selectedDate;
                loadDayView();
            }
        });
    }
    
    // Create reservation button
    const createBtn = document.getElementById('create-reservation-btn');
    if (createBtn) {
        createBtn.addEventListener('click', showCreateModal);
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Create reservation form
    const createForm = document.getElementById('create-reservation-form');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateReservation);
    }
}

// === AUTHENTICATION ===
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            showDashboard();
        } else {
            errorDiv.textContent = 'Neplatné přihlašovací údaje';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Chyba připojení k serveru';
        errorDiv.style.display = 'block';
    }
}

async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}/reservations`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            showDashboard();
        } else {
            localStorage.removeItem('authToken');
            showLoginScreen();
        }
    } catch (error) {
        localStorage.removeItem('authToken');
        showLoginScreen();
    }
}

function handleLogout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    showLoginScreen();
}

function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    
    if (currentUser) {
        document.getElementById('logged-user').textContent = currentUser.username;
    }
    
    loadDayView();
}

// === DAY NAVIGATION ===
function changeDay(direction) {
    currentDate.setDate(currentDate.getDate() + direction);
    loadDayView();
}

async function loadDayView() {
    updateDayHeader();
    await loadReservations();
    renderTimeSlots();
    renderDayReservations();
}

function updateDayHeader() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const current = new Date(currentDate);
    current.setHours(0, 0, 0, 0);
    
    const dayText = document.getElementById('current-day-text');
    const dateText = document.getElementById('current-date-text');
    
    if (current.getTime() === today.getTime()) {
        dayText.textContent = 'Dnes';
    } else {
        const dayName = DAY_NAMES[current.getDay()];
        dayText.textContent = dayName;
    }
    
    const day = current.getDate();
    const month = MONTH_NAMES[current.getMonth()];
    const year = current.getFullYear();
    
    dateText.textContent = `${day}. ${month} ${year}`;
}

// === RESERVATIONS ===
async function loadReservations() {
    try {
        const response = await fetch(`${API_URL}/reservations`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            allReservations = await response.json();
        }
    } catch (error) {
        console.error('Error loading reservations:', error);
    }
}

function getReservationsForDate(date) {
    const dateStr = formatDate(date);
    return allReservations.filter(r => r.date === dateStr);
}

function isTimeSlotReserved(timeSlot) {
    const reservations = getReservationsForDate(currentDate);
    // Pouze aktivní rezervace blokují sloty
    return reservations.some(r => {
        if (r.status === 'cancelled') return false;
        const times = r.time.split(', ');
        return times.includes(timeSlot);
    });
}

// === TIME SLOTS RENDERING ===
function renderTimeSlots() {
    const container = document.getElementById('time-slots-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const holiday = isHoliday(currentDate);
    
    if (isWeekend) {
        container.innerHTML = `
            <div class="closed-message">
                <i class="fas fa-times-circle"></i>
                <h3>Zavřeno</h3>
                <p>O víkendech nemáme otevřeno</p>
            </div>
        `;
        return;
    }
    
    if (holiday) {
        container.innerHTML = `
            <div class="closed-message">
                <i class="fas fa-calendar-times"></i>
                <h3>Státní svátek</h3>
                <p>Dnes máme zavřeno</p>
            </div>
        `;
        return;
    }
    
    TIME_SLOTS.forEach(timeSlot => {
        const isReserved = isTimeSlotReserved(timeSlot);
        const reservation = getReservationForTimeSlot(timeSlot);
        
        const slotDiv = document.createElement('div');
        slotDiv.className = `time-slot ${isReserved ? 'reserved' : 'available'}`;
        slotDiv.innerHTML = `
            <div class="time-slot-time">${timeSlot}</div>
            <div class="time-slot-status">
                ${isReserved ? '<i class="fas fa-check"></i> Rezervováno' : '<i class="fas fa-circle"></i> Volné'}
            </div>
            ${isReserved && reservation ? `<div class="time-slot-info">${reservation.name}</div>` : ''}
        `;
        
        if (isReserved && reservation) {
            slotDiv.style.cursor = 'pointer';
            slotDiv.addEventListener('click', () => showReservationDetail(reservation));
        }
        
        container.appendChild(slotDiv);
    });
}

function getReservationForTimeSlot(timeSlot) {
    const reservations = getReservationsForDate(currentDate);
    return reservations.find(r => {
        if (r.status === 'cancelled') return false;
        const times = r.time.split(', ');
        return times.includes(timeSlot);
    });
}

function renderDayReservations() {
    const container = document.getElementById('day-reservations-list');
    const statsDiv = document.getElementById('day-stats');
    if (!container) return;
    
    const reservations = getReservationsForDate(currentDate);
    
    if (statsDiv) {
        const totalSlots = reservations.reduce((sum, r) => sum + r.duration, 0);
        const totalRevenue = reservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
        statsDiv.innerHTML = `${reservations.length} rezervací | ${totalSlots} hodin | ${totalRevenue} Kč`;
    }
    
    if (reservations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>Žádné rezervace pro tento den</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reservations.map(r => `
        <div class="reservation-card" onclick="showReservationDetail(${JSON.stringify(r).replace(/"/g, '&quot;')})">
            <div class="reservation-header">
                <div class="reservation-time">
                    <i class="fas fa-clock"></i> ${r.time}
                </div>
                <div class="reservation-status ${r.status === 'cancelled' ? 'status-cancelled' : 'status-active'}">
                    ${r.status === 'cancelled' ? 'Zrušeno' : 'Aktivní'}
                </div>
            </div>
            <div class="reservation-info">
                <div><i class="fas fa-user"></i> <strong>${r.name}</strong></div>
                <div><i class="fas fa-envelope"></i> ${r.email}</div>
                ${r.phone ? `<div><i class="fas fa-phone"></i> ${r.phone}</div>` : ''}
                <div><i class="fas fa-coins"></i> ${r.totalPrice} Kč</div>
            </div>
        </div>
    `).join('');
}

// === MODALS ===
function showReservationDetail(reservation) {
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('detail-content');
    
    content.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <label>📅 Datum:</label>
                <span>${formatDateCzech(reservation.date)}</span>
            </div>
            <div class="detail-item">
                <label>🕐 Čas:</label>
                <span>${reservation.time}</span>
            </div>
            <div class="detail-item">
                <label>⏱️ Délka:</label>
                <span>${reservation.duration} ${reservation.duration === 1 ? 'hodina' : reservation.duration < 5 ? 'hodiny' : 'hodin'}</span>
            </div>
            <div class="detail-item">
                <label>💰 Cena:</label>
                <span><strong>${reservation.totalPrice} Kč</strong></span>
            </div>
            <div class="detail-item full-width">
                <label>👤 Jméno a příjmení:</label>
                <span>${reservation.name}</span>
            </div>
            <div class="detail-item">
                <label>📧 Email:</label>
                <span>${reservation.email}</span>
            </div>
            <div class="detail-item">
                <label>📞 Telefon:</label>
                <span>${reservation.phone || '-'}</span>
            </div>
            <div class="detail-item full-width">
                <label>🏢 Společnost:</label>
                <span>${reservation.company || '-'}</span>
            </div>
            <div class="detail-item full-width">
                <label>💬 Poznámka:</label>
                <span>${reservation.message || '-'}</span>
            </div>
            <div class="detail-item full-width">
                <label>Status:</label>
                <span class="status-badge ${reservation.status === 'cancelled' ? 'status-cancelled' : 'status-active'}">
                    ${reservation.status === 'cancelled' ? '❌ Zrušeno' : '✅ Aktivní'}
                </span>
            </div>
        </div>
        <div class="modal-footer">
            ${reservation.status === 'cancelled' 
                ? `<button class="btn btn-danger" onclick="deleteReservation(${reservation.id})">
                     <i class="fas fa-trash"></i> Smazat rezervaci
                   </button>`
                : `<button class="btn btn-danger" onclick="cancelReservation(${reservation.id})">
                     <i class="fas fa-times-circle"></i> Zrušit rezervaci
                   </button>`
            }
        </div>
    `;
    
    modal.style.display = 'flex';
}

function formatDateCzech(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    const dayName = DAY_NAMES[date.getDay()];
    return `${dayName}, ${day}. ${month} ${year}`;
}

function showCreateModal() {
    const modal = document.getElementById('create-modal');
    const dateInput = document.getElementById('res-date');
    
    // Set default date to current date
    dateInput.value = formatDate(currentDate);
    dateInput.min = formatDate(new Date());
    
    // Add event listener for date change
    dateInput.removeEventListener('change', renderModalTimeSlots); // Remove old listener
    dateInput.addEventListener('change', renderModalTimeSlots);
    
    modal.style.display = 'flex';
    renderModalTimeSlots();
}

function renderModalTimeSlots() {
    const date = document.getElementById('res-date').value;
    const container = document.getElementById('modal-time-slots');
    
    if (!date) {
        container.innerHTML = '<p>Nejprve vyberte datum</p>';
        return;
    }
    
    // Get reservations for selected date
    const selectedDate = new Date(date + 'T12:00:00');
    const dateReservations = allReservations.filter(r => {
        return r.date === date && r.status !== 'cancelled';
    });
    
    // Get booked times
    const bookedTimes = [];
    dateReservations.forEach(r => {
        const times = r.time.split(', ');
        bookedTimes.push(...times);
    });
    
    container.innerHTML = '';
    
    TIME_SLOTS.forEach(slot => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-slot-btn';
        btn.textContent = slot;
        btn.dataset.slot = slot;
        
        // Check if slot is already booked
        if (bookedTimes.includes(slot)) {
            btn.classList.add('booked');
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Již rezervováno';
        } else {
            btn.addEventListener('click', function() {
                this.classList.toggle('selected');
                updateModalPrice();
            });
        }
        
        container.appendChild(btn);
    });
}

function updateModalPrice() {
    const selectedSlots = document.querySelectorAll('.time-slot-btn.selected').length;
    const priceInput = document.getElementById('res-price');
    
    if (selectedSlots >= 4) {
        priceInput.value = 399; // Full day
    } else {
        priceInput.value = selectedSlots * 99;
    }
}

async function handleCreateReservation(e) {
    e.preventDefault();
    
    const selectedSlots = Array.from(document.querySelectorAll('.time-slot-btn.selected'))
        .map(btn => btn.dataset.slot);
    
    if (selectedSlots.length === 0) {
        alert('Vyberte alespoň jeden časový slot');
        return;
    }
    
    const formData = {
        date: document.getElementById('res-date').value,
        timeSlots: selectedSlots,
        name: document.getElementById('res-name').value,
        email: document.getElementById('res-email').value,
        phone: document.getElementById('res-phone').value,
        company: document.getElementById('res-company').value || null,
        message: document.getElementById('res-message').value || null,
        totalPrice: parseInt(document.getElementById('res-price').value)
    };
    
    try {
        const response = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            document.getElementById('create-modal').style.display = 'none';
            e.target.reset();
            // Force reload reservations from server
            allReservations = [];
            await loadReservations();
            renderTimeSlots();
            renderDayReservations();
            alert('Rezervace byla úspěšně vytvořena!');
        } else {
            alert('Chyba při vytváření rezervace');
        }
    } catch (error) {
        alert('Chyba připojení k serveru');
    }
}

async function cancelReservation(id) {
    if (!confirm('Opravdu chcete zrušit tuto rezervaci? Klient obdrží email o zrušení.')) return;
    
    try {
        const response = await fetch(`${API_URL}/reservations/${id}/cancel`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            document.getElementById('detail-modal').style.display = 'none';
            // Force reload reservations from server
            allReservations = [];
            await loadReservations();
            renderTimeSlots();
            renderDayReservations();
            alert('Rezervace byla zrušena a klient byl informován emailem.');
        } else {
            alert('Chyba při rušení rezervace');
        }
    } catch (error) {
        alert('Chyba připojení k serveru');
    }
}

async function deleteReservation(id) {
    if (!confirm('Opravdu chcete SMAZAT tuto rezervaci? Tato akce je nevratná!')) return;
    
    try {
        const response = await fetch(`${API_URL}/reservations/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            document.getElementById('detail-modal').style.display = 'none';
            await loadDayView();
            alert('Rezervace byla smazána');
        }
    } catch (error) {
        alert('Chyba při mazání rezervace');
    }
}

// === HELPERS ===
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Make functions available globally for onclick handlers
window.showReservationDetail = showReservationDetail;
window.cancelReservation = cancelReservation;
window.deleteReservation = deleteReservation;
