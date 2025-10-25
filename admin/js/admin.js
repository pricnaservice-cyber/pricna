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
    return reservations.some(r => {
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
                <div class="reservation-status status-${r.status}">
                    ${r.status === 'pending' ? 'Čeká' : r.status === 'confirmed' ? 'Potvrzeno' : 'Zrušeno'}
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
                <label>Datum:</label>
                <span>${reservation.date}</span>
            </div>
            <div class="detail-item">
                <label>Čas:</label>
                <span>${reservation.time} (${reservation.duration}h)</span>
            </div>
            <div class="detail-item">
                <label>Jméno:</label>
                <span>${reservation.name}</span>
            </div>
            <div class="detail-item">
                <label>Email:</label>
                <span>${reservation.email}</span>
            </div>
            <div class="detail-item">
                <label>Telefon:</label>
                <span>${reservation.phone || '-'}</span>
            </div>
            <div class="detail-item">
                <label>Společnost:</label>
                <span>${reservation.company || '-'}</span>
            </div>
            <div class="detail-item">
                <label>Poznámka:</label>
                <span>${reservation.message || '-'}</span>
            </div>
            <div class="detail-item">
                <label>Cena:</label>
                <span><strong>${reservation.totalPrice} Kč</strong></span>
            </div>
            <div class="detail-item">
                <label>Status:</label>
                <span class="status-badge status-${reservation.status}">
                    ${reservation.status === 'pending' ? 'Čeká na potvrzení' : 
                      reservation.status === 'confirmed' ? 'Potvrzeno' : 'Zrušeno'}
                </span>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-danger" onclick="deleteReservation(${reservation.id})">
                <i class="fas fa-trash"></i> Smazat
            </button>
            <button class="btn btn-secondary modal-close">Zavřít</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function showCreateModal() {
    const modal = document.getElementById('create-modal');
    const dateInput = document.getElementById('res-date');
    
    // Set default date to current date
    dateInput.value = formatDate(currentDate);
    dateInput.min = formatDate(new Date());
    
    modal.style.display = 'flex';
    renderModalTimeSlots();
}

function renderModalTimeSlots() {
    const container = document.getElementById('modal-time-slots');
    if (!container) return;
    
    container.innerHTML = TIME_SLOTS.map(slot => `
        <button type="button" class="time-slot-btn" data-slot="${slot}">
            ${slot}
        </button>
    `).join('');
    
    container.querySelectorAll('.time-slot-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('selected');
            calculatePrice();
        });
    });
}

function calculatePrice() {
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
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            document.getElementById('create-modal').style.display = 'none';
            e.target.reset();
            await loadDayView();
            alert('Rezervace byla úspěšně vytvořena!');
        } else {
            alert('Chyba při vytváření rezervace');
        }
    } catch (error) {
        alert('Chyba připojení k serveru');
    }
}

async function deleteReservation(id) {
    if (!confirm('Opravdu chcete smazat tuto rezervaci?')) return;
    
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
window.deleteReservation = deleteReservation;
