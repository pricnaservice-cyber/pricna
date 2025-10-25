// API Configuration
const API_URL = 'https://pricna-api.pricna-service.workers.dev/api'; // Změňte na produkční URL

// State
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let currentMonth = new Date();
let allReservations = [];
let selectedReservationId = null;

// Czech month names
const monthNames = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

// Time slots
const timeSlots = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        verifyToken();
    } else {
        showLogin();
    }
    
    setupEventListeners();
});

// Event Listeners
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
    
    // Calendar navigation
    document.getElementById('prev-month')?.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month')?.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar();
    });
    
    // Create reservation button
    document.getElementById('create-reservation-btn')?.addEventListener('click', () => {
        openReservationModal();
    });
    
    // Reservation form
    const reservationForm = document.getElementById('reservation-form');
    if (reservationForm) {
        reservationForm.addEventListener('submit', handleReservationSubmit);
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    document.getElementById('cancel-form')?.addEventListener('click', closeModals);
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterReservations(e.target.dataset.filter);
        });
    });
    
    // Time slot selection
    document.getElementById('res-date')?.addEventListener('change', updateTimeSlots);
}

// Authentication
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
            errorDiv.textContent = data.error || 'Neplatné přihlašovací údaje';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Chyba připojení k serveru';
        errorDiv.style.display = 'block';
    }
}

async function verifyToken() {
    try {
        const response = await fetch(`${API_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            showDashboard();
        } else {
            localStorage.removeItem('authToken');
            authToken = null;
            showLogin();
        }
    } catch (error) {
        console.error('Token verification error:', error);
        localStorage.removeItem('authToken');
        authToken = null;
        showLogin();
    }
}

function handleLogout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    showLogin();
}

function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    
    if (currentUser) {
        document.getElementById('logged-user').textContent = currentUser.username;
    }
    
    loadDashboardData();
}

// Dashboard
async function loadDashboardData() {
    await loadReservations();
    renderCalendar();
    updateStats();
}

async function loadReservations() {
    try {
        const response = await fetch(`${API_URL}/reservations`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            allReservations = data.data;
            renderReservationsList('all');
        }
    } catch (error) {
        console.error('Error loading reservations:', error);
    }
}

function updateStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStr = today.toISOString().split('T')[0];
    
    // Today
    const todayReservations = allReservations.filter(r => 
        r.date === todayStr && r.status === 'confirmed'
    );
    document.getElementById('stat-today').textContent = todayReservations.length;
    
    // This week
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekReservations = allReservations.filter(r => {
        const resDate = new Date(r.date);
        return resDate >= weekStart && resDate <= weekEnd && r.status === 'confirmed';
    });
    document.getElementById('stat-week').textContent = weekReservations.length;
    
    // This month
    const monthReservations = allReservations.filter(r => {
        const resDate = new Date(r.date);
        return resDate.getMonth() === today.getMonth() && 
               resDate.getFullYear() === today.getFullYear() &&
               r.status === 'confirmed';
    });
    document.getElementById('stat-month').textContent = monthReservations.length;
    
    // Revenue this month
    const revenue = monthReservations.reduce((sum, r) => sum + r.total_price, 0);
    document.getElementById('stat-revenue').textContent = `${revenue.toLocaleString('cs-CZ')} Kč`;
}

// Calendar
function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    document.getElementById('calendar-month-year').textContent = 
        `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();
    
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek === -1) firstDayOfWeek = 6;
    
    const calendarGrid = document.getElementById('admin-calendar');
    calendarGrid.innerHTML = `
        <div class="calendar-day-header">Po</div>
        <div class="calendar-day-header">Út</div>
        <div class="calendar-day-header">St</div>
        <div class="calendar-day-header">Čt</div>
        <div class="calendar-day-header">Pá</div>
        <div class="calendar-day-header">So</div>
        <div class="calendar-day-header">Ne</div>
    `;
    
    // Empty cells
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day', 'other-month');
        calendarGrid.appendChild(emptyDay);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Days
    for (let day = 1; day <= numDays; day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        
        const dayDate = new Date(year, month, day);
        dayDate.setHours(0, 0, 0, 0);
        const dateString = dayDate.toISOString().split('T')[0];
        
        if (dayDate.getTime() === today.getTime()) {
            dayElement.classList.add('today');
        }
        
        // Check for reservations
        const dayReservations = allReservations.filter(r => 
            r.date === dateString && r.status === 'confirmed'
        );
        
        if (dayReservations.length > 0) {
            dayElement.classList.add('has-reservations');
        }
        
        dayElement.innerHTML = `
            <span class="day-number">${day}</span>
            ${dayReservations.length > 0 ? 
                `<span class="reservation-count">${dayReservations.length} rez.</span>` : ''}
        `;
        
        dayElement.addEventListener('click', () => {
            filterReservationsByDate(dateString);
        });
        
        calendarGrid.appendChild(dayElement);
    }
}

// Reservations List
function renderReservationsList(filter = 'all') {
    const listContainer = document.getElementById('reservations-list');
    
    let filtered = [...allReservations];
    
    if (filter === 'upcoming') {
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(r => r.date >= today && r.status === 'confirmed');
    } else if (filter === 'past') {
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(r => r.date < today || r.status === 'cancelled');
    }
    
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>Žádné rezervace</h3>
                <p>V této kategorii nejsou žádné rezervace</p>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = filtered.map(reservation => `
        <div class="reservation-item">
            <div class="reservation-info">
                <div class="reservation-header">
                    <span class="reservation-date">
                        ${formatDate(reservation.date)}
                    </span>
                    <span class="reservation-name">${reservation.name}</span>
                    <span class="status-badge status-${reservation.status}">
                        ${reservation.status === 'confirmed' ? 'Potvrzeno' : 'Zrušeno'}
                    </span>
                </div>
                <div class="reservation-details">
                    <span><i class="fas fa-clock"></i> ${formatTimeSlots(reservation.time_slots)}</span>
                    <span><i class="fas fa-envelope"></i> ${reservation.email}</span>
                    <span><i class="fas fa-phone"></i> ${reservation.phone}</span>
                    <span><i class="fas fa-coins"></i> ${reservation.total_price} Kč</span>
                </div>
            </div>
            <div class="reservation-actions">
                <button class="btn btn-primary btn-sm" onclick="viewReservation(${reservation.id})">
                    <i class="fas fa-eye"></i> Detail
                </button>
                ${reservation.status === 'confirmed' ? `
                    <button class="btn btn-secondary btn-sm" onclick="editReservation(${reservation.id})">
                        <i class="fas fa-edit"></i> Upravit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="cancelReservation(${reservation.id})">
                        <i class="fas fa-times"></i> Zrušit
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function filterReservations(filter) {
    renderReservationsList(filter);
}

function filterReservationsByDate(date) {
    const filtered = allReservations.filter(r => r.date === date);
    
    const listContainer = document.getElementById('reservations-list');
    
    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>Žádné rezervace</h3>
                <p>Pro tento den nejsou žádné rezervace</p>
            </div>
        `;
        return;
    }
    
    // Render filtered list (same as renderReservationsList but with filtered data)
    listContainer.innerHTML = filtered.map(reservation => `
        <div class="reservation-item">
            <div class="reservation-info">
                <div class="reservation-header">
                    <span class="reservation-date">
                        ${formatDate(reservation.date)}
                    </span>
                    <span class="reservation-name">${reservation.name}</span>
                    <span class="status-badge status-${reservation.status}">
                        ${reservation.status === 'confirmed' ? 'Potvrzeno' : 'Zrušeno'}
                    </span>
                </div>
                <div class="reservation-details">
                    <span><i class="fas fa-clock"></i> ${formatTimeSlots(reservation.time_slots)}</span>
                    <span><i class="fas fa-envelope"></i> ${reservation.email}</span>
                    <span><i class="fas fa-phone"></i> ${reservation.phone}</span>
                    <span><i class="fas fa-coins"></i> ${reservation.total_price} Kč</span>
                </div>
            </div>
            <div class="reservation-actions">
                <button class="btn btn-primary btn-sm" onclick="viewReservation(${reservation.id})">
                    <i class="fas fa-eye"></i> Detail
                </button>
                ${reservation.status === 'confirmed' ? `
                    <button class="btn btn-secondary btn-sm" onclick="editReservation(${reservation.id})">
                        <i class="fas fa-edit"></i> Upravit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="cancelReservation(${reservation.id})">
                        <i class="fas fa-times"></i> Zrušit
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Reservation Modal
function openReservationModal(reservationId = null) {
    const modal = document.getElementById('reservation-modal');
    const form = document.getElementById('reservation-form');
    
    form.reset();
    selectedReservationId = reservationId;
    
    if (reservationId) {
        document.getElementById('modal-title').textContent = 'Upravit rezervaci';
        loadReservationData(reservationId);
    } else {
        document.getElementById('modal-title').textContent = 'Nová rezervace';
        document.getElementById('reservation-id').value = '';
    }
    
    generateTimeSlots();
    modal.style.display = 'block';
}

function loadReservationData(id) {
    const reservation = allReservations.find(r => r.id === id);
    if (!reservation) return;
    
    document.getElementById('reservation-id').value = reservation.id;
    document.getElementById('res-date').value = reservation.date;
    document.getElementById('res-name').value = reservation.name;
    document.getElementById('res-email').value = reservation.email;
    document.getElementById('res-phone').value = reservation.phone;
    document.getElementById('res-company').value = reservation.company || '';
    document.getElementById('res-message').value = reservation.message || '';
    document.getElementById('res-price').value = reservation.total_price;
    
    // Set selected time slots
    generateTimeSlots(reservation.time_slots);
}

function generateTimeSlots(selectedSlots = []) {
    const container = document.getElementById('time-slots-selection');
    container.innerHTML = '';
    
    timeSlots.forEach(time => {
        const label = document.createElement('label');
        label.className = 'time-slot-checkbox';
        if (selectedSlots.includes(time)) {
            label.classList.add('selected');
        }
        
        label.innerHTML = `
            <input type="checkbox" name="timeSlots" value="${time}" 
                ${selectedSlots.includes(time) ? 'checked' : ''}>
            ${time}
        `;
        
        label.addEventListener('click', function(e) {
            if (e.target.tagName !== 'INPUT') {
                const checkbox = this.querySelector('input');
                checkbox.checked = !checkbox.checked;
            }
            this.classList.toggle('selected');
            calculatePrice();
        });
        
        container.appendChild(label);
    });
}

function updateTimeSlots() {
    // TODO: Check availability for selected date and disable booked slots
    calculatePrice();
}

function calculatePrice() {
    const selectedSlots = Array.from(document.querySelectorAll('input[name="timeSlots"]:checked'));
    const duration = selectedSlots.length;
    
    const PRICE_PER_HOUR = 99;
    const PRICE_FULL_DAY = 399;
    const FULL_DAY_THRESHOLD = 4;
    
    const price = duration >= FULL_DAY_THRESHOLD ? PRICE_FULL_DAY : duration * PRICE_PER_HOUR;
    document.getElementById('res-price').value = price;
}

async function handleReservationSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const selectedSlots = Array.from(document.querySelectorAll('input[name="timeSlots"]:checked'))
        .map(cb => cb.value);
    
    if (selectedSlots.length === 0) {
        alert('Vyberte alespoň jeden časový slot');
        return;
    }
    
    const data = {
        date: formData.get('date'),
        timeSlots: selectedSlots,
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        company: formData.get('company'),
        message: formData.get('message'),
        totalPrice: parseInt(formData.get('totalPrice')),
        status: 'confirmed'
    };
    
    const reservationId = document.getElementById('reservation-id').value;
    
    try {
        let response;
        if (reservationId) {
            // Update
            response = await fetch(`${API_URL}/reservations/${reservationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(data)
            });
        } else {
            // Create
            response = await fetch(`${API_URL}/reservations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(data)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            closeModals();
            loadDashboardData();
            alert(reservationId ? 'Rezervace byla aktualizována' : 'Rezervace byla vytvořena');
        } else {
            alert(result.error || 'Chyba při ukládání rezervace');
        }
    } catch (error) {
        console.error('Error saving reservation:', error);
        alert('Chyba při ukládání rezervace');
    }
}

async function cancelReservation(id) {
    if (!confirm('Opravdu chcete zrušit tuto rezervaci?')) return;
    
    try {
        const response = await fetch(`${API_URL}/reservations/${id}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadDashboardData();
            alert('Rezervace byla zrušena');
        } else {
            alert(result.error || 'Chyba při rušení rezervace');
        }
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        alert('Chyba při rušení rezervace');
    }
}

function viewReservation(id) {
    const reservation = allReservations.find(r => r.id === id);
    if (!reservation) return;
    
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('detail-content');
    
    content.innerHTML = `
        <div style="padding: 24px;">
            <div style="background: var(--light-gray); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-bottom: 16px;">Informace o rezervaci</h3>
                <p><strong>ID:</strong> #${reservation.id}</p>
                <p><strong>Datum:</strong> ${formatDate(reservation.date)}</p>
                <p><strong>Čas:</strong> ${formatTimeSlots(reservation.time_slots)}</p>
                <p><strong>Celková cena:</strong> ${reservation.total_price} Kč</p>
                <p><strong>Stav:</strong> <span class="status-badge status-${reservation.status}">
                    ${reservation.status === 'confirmed' ? 'Potvrzeno' : 'Zrušeno'}
                </span></p>
            </div>
            
            <div style="background: var(--light-gray); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-bottom: 16px;">Kontaktní údaje</h3>
                <p><strong>Jméno:</strong> ${reservation.name}</p>
                <p><strong>Email:</strong> <a href="mailto:${reservation.email}">${reservation.email}</a></p>
                <p><strong>Telefon:</strong> <a href="tel:${reservation.phone}">${reservation.phone}</a></p>
                ${reservation.company ? `<p><strong>Společnost:</strong> ${reservation.company}</p>` : ''}
            </div>
            
            ${reservation.message ? `
                <div style="background: var(--light-gray); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="margin-bottom: 16px;">Poznámka</h3>
                    <p>${reservation.message}</p>
                </div>
            ` : ''}
            
            <div style="background: var(--light-gray); padding: 20px; border-radius: 8px;">
                <h3 style="margin-bottom: 16px;">Metadata</h3>
                <p><strong>Vytvořeno:</strong> ${formatDateTime(reservation.created_at)}</p>
                <p><strong>Naposledy upraveno:</strong> ${formatDateTime(reservation.updated_at)}</p>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

function editReservation(id) {
    openReservationModal(id);
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('cs-CZ', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('cs-CZ', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

function formatTimeSlots(slots) {
    if (!slots || slots.length === 0) return '';
    
    const sorted = [...slots].sort();
    const startTime = sorted[0];
    const endIndex = timeSlots.indexOf(sorted[sorted.length - 1]);
    const endTime = endIndex + 1 < timeSlots.length ? timeSlots[endIndex + 1] : '19:00';
    
    return `${startTime} - ${endTime} (${slots.length}h)`;
}
