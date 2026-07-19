// API Configuration
// Na localhostu se automaticky používá lokální wrangler dev server.
const API_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://127.0.0.1:8787/api'
    : 'https://pricna-api.pricna-service.workers.dev/api';

// State
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let currentDate = new Date();
let allReservations = [];
let allProperties = [];
let propertyFilter = 'all';
let editedPropertyId = null;   // null = nová nabídka
let editedImages = [];         // pole cest obrázků právě editované nabídky

// Time slots (stejné jako v rezervačním systému)
const TIME_SLOTS = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

// === HELPERS ===

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function authHeaders(extra = {}) {
    return { 'Authorization': `Bearer ${authToken}`, ...extra };
}

function resolveImage(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/api/')) return API_URL.replace(/\/api$/, '') + path;
    return '../' + path; // statické obrázky webu (images/...)
}

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

    holidays.push(`${year}-01-01`, `${year}-05-01`, `${year}-05-08`, `${year}-07-05`,
        `${year}-07-06`, `${year}-09-28`, `${year}-10-28`, `${year}-11-17`,
        `${year}-12-24`, `${year}-12-25`, `${year}-12-26`);

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
    return czechHolidays.includes(formatDate(date));
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
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Přepínání záložek
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => switchView(tab.dataset.view));
    });

    // Day navigation
    document.getElementById('prev-day')?.addEventListener('click', () => changeDay(-1));
    document.getElementById('next-day')?.addEventListener('click', () => changeDay(1));
    document.getElementById('today-btn')?.addEventListener('click', () => {
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
                currentDate = new Date(e.target.value + 'T12:00:00');
                loadDayView();
            }
        });
    }

    document.getElementById('create-reservation-btn')?.addEventListener('click', showCreateModal);

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    document.getElementById('create-reservation-form')?.addEventListener('submit', handleCreateReservation);

    // === Nemovitosti ===
    document.getElementById('create-property-btn')?.addEventListener('click', () => showPropertyModal(null));
    document.getElementById('property-form')?.addEventListener('submit', handleSaveProperty);
    document.getElementById('prop-image-input')?.addEventListener('change', handleImageUpload);
    document.getElementById('prop-type')?.addEventListener('change', updatePropertyFormFields);

    document.querySelectorAll('.property-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            propertyFilter = btn.dataset.filter;
            document.querySelectorAll('.property-filter').forEach(b => b.classList.toggle('active', b === btn));
            renderPropertiesList();
        });
    });
}

function switchView(view) {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === view);
    });
    document.getElementById('view-reservations').style.display = view === 'reservations' ? '' : 'none';
    document.getElementById('view-properties').style.display = view === 'properties' ? '' : 'none';

    if (view === 'properties') loadProperties();
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
            errorDiv.textContent = data.error === 'Invalid credentials'
                ? 'Neplatné přihlašovací údaje'
                : (data.error || 'Neplatné přihlašovací údaje');
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Chyba připojení k serveru';
        errorDiv.style.display = 'block';
    }
}

async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}/reservations`, { headers: authHeaders() });
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

    dayText.textContent = current.getTime() === today.getTime() ? 'Dnes' : DAY_NAMES[current.getDay()];
    dateText.textContent = `${current.getDate()}. ${MONTH_NAMES[current.getMonth()]} ${current.getFullYear()}`;
}

// === RESERVATIONS ===
async function loadReservations() {
    try {
        const response = await fetch(`${API_URL}/reservations`, { headers: authHeaders() });
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
    return getReservationsForDate(currentDate).some(r => {
        if (r.status === 'cancelled') return false;
        return r.time.split(', ').includes(timeSlot);
    });
}

// === TIME SLOTS RENDERING ===
function renderTimeSlots() {
    const container = document.getElementById('time-slots-grid');
    if (!container) return;

    container.innerHTML = '';

    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        container.innerHTML = `
            <div class="closed-message">
                <i class="fas fa-times-circle"></i>
                <h3>Zavřeno</h3>
                <p>O víkendech nemáme otevřeno</p>
            </div>
        `;
        return;
    }

    if (isHoliday(currentDate)) {
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
            ${isReserved && reservation ? `<div class="time-slot-info">${escapeHtml(reservation.name)}</div>` : ''}
        `;

        if (isReserved && reservation) {
            slotDiv.style.cursor = 'pointer';
            slotDiv.addEventListener('click', () => showReservationDetail(reservation));
        }

        container.appendChild(slotDiv);
    });
}

function getReservationForTimeSlot(timeSlot) {
    return getReservationsForDate(currentDate).find(r => {
        if (r.status === 'cancelled') return false;
        return r.time.split(', ').includes(timeSlot);
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
        statsDiv.textContent = `${reservations.length} rezervací | ${totalSlots} hodin | ${totalRevenue} Kč`;
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

    container.innerHTML = '';
    reservations.forEach(r => {
        const card = document.createElement('div');
        card.className = 'reservation-card';
        card.innerHTML = `
            <div class="reservation-header">
                <div class="reservation-time">
                    <i class="fas fa-clock"></i> ${escapeHtml(r.time)}
                </div>
                <div class="reservation-status ${r.status === 'cancelled' ? 'status-cancelled' : 'status-active'}">
                    ${r.status === 'cancelled' ? 'Zrušeno' : 'Aktivní'}
                </div>
            </div>
            <div class="reservation-info">
                <div><i class="fas fa-user"></i> <strong>${escapeHtml(r.name)}</strong></div>
                <div><i class="fas fa-envelope"></i> ${escapeHtml(r.email)}</div>
                ${r.phone ? `<div><i class="fas fa-phone"></i> ${escapeHtml(r.phone)}</div>` : ''}
                <div><i class="fas fa-coins"></i> ${r.totalPrice} Kč</div>
            </div>
        `;
        card.addEventListener('click', () => showReservationDetail(r));
        container.appendChild(card);
    });
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
                <span>${escapeHtml(reservation.time)}</span>
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
                <span>${escapeHtml(reservation.name)}</span>
            </div>
            <div class="detail-item">
                <label>📧 Email:</label>
                <span>${escapeHtml(reservation.email)}</span>
            </div>
            <div class="detail-item">
                <label>📞 Telefon:</label>
                <span>${escapeHtml(reservation.phone || '-')}</span>
            </div>
            <div class="detail-item full-width">
                <label>🏢 Společnost:</label>
                <span>${escapeHtml(reservation.company || '-')}</span>
            </div>
            <div class="detail-item full-width">
                <label>💬 Poznámka:</label>
                <span>${escapeHtml(reservation.message || '-')}</span>
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
    return `${DAY_NAMES[date.getDay()]}, ${date.getDate()}. ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function showCreateModal() {
    const modal = document.getElementById('create-modal');
    const dateInput = document.getElementById('res-date');

    dateInput.value = formatDate(currentDate);
    dateInput.min = formatDate(new Date());

    dateInput.removeEventListener('change', renderModalTimeSlots);
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

    const dateReservations = allReservations.filter(r => r.date === date && r.status !== 'cancelled');
    const bookedTimes = [];
    dateReservations.forEach(r => bookedTimes.push(...r.time.split(', ')));

    container.innerHTML = '';

    TIME_SLOTS.forEach(slot => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-slot-btn';
        btn.textContent = slot;
        btn.dataset.slot = slot;

        if (bookedTimes.includes(slot)) {
            btn.classList.add('booked');
            btn.disabled = true;
            btn.title = 'Již rezervováno';
        } else {
            btn.addEventListener('click', function() {
                this.classList.toggle('selected');
                updateModalPrice();
            });
        }

        container.appendChild(btn);
    });
    updateModalPrice();
}

function updateModalPrice() {
    const selectedSlots = document.querySelectorAll('.time-slot-btn.selected').length;
    document.getElementById('res-price').value = selectedSlots >= 4 ? 399 : selectedSlots * 99;
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
        message: document.getElementById('res-message').value || null
    };

    try {
        const response = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await response.json();

        if (response.ok && data.success) {
            document.getElementById('create-modal').style.display = 'none';
            e.target.reset();
            await loadDayView();
            alert('Rezervace byla úspěšně vytvořena!');
        } else {
            alert('Chyba při vytváření rezervace: ' + (data.error || ''));
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
            headers: authHeaders({ 'Content-Type': 'application/json' })
        });

        if (response.ok) {
            document.getElementById('detail-modal').style.display = 'none';
            await loadDayView();
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
            headers: authHeaders()
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

// ============================================================
// === NEMOVITOSTI (byty a kanceláře) ===
// ============================================================

async function loadProperties() {
    try {
        const response = await fetch(`${API_URL}/admin/properties`, { headers: authHeaders() });
        const data = await response.json();
        if (response.ok && data.success) {
            allProperties = data.properties;
            renderPropertiesList();
        }
    } catch (error) {
        console.error('Error loading properties:', error);
    }
}

function renderPropertiesList() {
    const container = document.getElementById('properties-list');
    const statsDiv = document.getElementById('properties-stats');
    if (!container) return;

    const filtered = propertyFilter === 'all'
        ? allProperties
        : allProperties.filter(p => p.type === propertyFilter);

    if (statsDiv) {
        const offices = allProperties.filter(p => p.type === 'office').length;
        const apartments = allProperties.filter(p => p.type === 'apartment').length;
        statsDiv.textContent = `${offices} kanceláří | ${apartments} bytů`;
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-building"></i>
                <p>Zatím žádné nabídky. Přidejte první tlačítkem výše.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    filtered.forEach(p => {
        const firstImage = p.images && p.images[0];
        const card = document.createElement('div');
        card.className = 'property-row' + (p.published ? '' : ' unpublished');
        card.innerHTML = `
            <div class="property-thumb">
                ${firstImage ? `<img src="${escapeHtml(resolveImage(firstImage))}" alt="">` : '<i class="fas fa-image"></i>'}
            </div>
            <div class="property-row-info">
                <div class="property-row-title">
                    <strong>${escapeHtml(p.title)}</strong>
                    <span class="property-type-badge ${p.type}">${p.type === 'office' ? 'Kancelář' : 'Byt'}</span>
                    ${p.published ? '' : '<span class="property-type-badge draft">Skryto</span>'}
                </div>
                <div class="property-row-meta">
                    ${p.building ? `<span><i class="fas fa-building"></i> ${escapeHtml(p.building)}</span>` : ''}
                    ${p.size ? `<span><i class="fas fa-ruler-combined"></i> ${escapeHtml(p.size)}</span>` : ''}
                    ${p.price ? `<span><i class="fas fa-tag"></i> ${escapeHtml(p.price)}</span>` : ''}
                    <span><i class="fas fa-images"></i> ${(p.images || []).length} fotek</span>
                </div>
            </div>
            <div class="property-row-actions">
                <button class="btn btn-outline btn-sm" data-action="toggle" title="${p.published ? 'Skrýt z webu' : 'Zveřejnit'}">
                    <i class="fas ${p.published ? 'fa-eye-slash' : 'fa-eye'}"></i>
                </button>
                <button class="btn btn-outline btn-sm" data-action="edit" title="Upravit">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="btn btn-danger btn-sm" data-action="delete" title="Smazat">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        card.querySelector('[data-action="edit"]').addEventListener('click', () => showPropertyModal(p));
        card.querySelector('[data-action="toggle"]').addEventListener('click', () => togglePropertyPublished(p));
        card.querySelector('[data-action="delete"]').addEventListener('click', () => deleteProperty(p));
        container.appendChild(card);
    });
}

function updatePropertyFormFields() {
    const type = document.getElementById('prop-type').value;
    const isOffice = type === 'office';
    document.getElementById('prop-building-group').style.display = isOffice ? '' : 'none';
    document.getElementById('prop-capacity-group').style.display = isOffice ? '' : 'none';
    document.getElementById('prop-available-group').style.display = isOffice ? 'none' : '';
}

function showPropertyModal(property) {
    editedPropertyId = property ? property.id : null;
    editedImages = property ? [...(property.images || [])] : [];

    document.getElementById('property-modal-title').textContent =
        property ? `Upravit: ${property.title}` : 'Nová nabídka';

    document.getElementById('prop-type').value = property?.type || 'office';
    document.getElementById('prop-title').value = property?.title || '';
    document.getElementById('prop-building').value = property?.building || 'Příčná 1';
    document.getElementById('prop-location').value = property?.location || '';
    document.getElementById('prop-size').value = property?.size || '';
    document.getElementById('prop-capacity').value = property?.capacity || '';
    document.getElementById('prop-price').value = property?.price || '';
    document.getElementById('prop-utilities').value = property?.utilities || '';
    document.getElementById('prop-deposit').value = property?.deposit || '';
    document.getElementById('prop-available').value = property?.available || '';
    document.getElementById('prop-vat').value = property?.vatNote || '';
    document.getElementById('prop-description').value = property?.description || '';
    document.getElementById('prop-features').value = (property?.features || []).join('\n');
    document.getElementById('prop-sort').value = property?.sortOrder ?? 0;
    document.getElementById('prop-published').checked = property ? !!property.published : true;
    document.getElementById('prop-upload-status').textContent = '';
    document.getElementById('prop-image-input').value = '';

    updatePropertyFormFields();
    renderEditedImages();

    document.getElementById('property-modal').style.display = 'flex';
}

function renderEditedImages() {
    const container = document.getElementById('prop-images');
    if (!container) return;

    if (editedImages.length === 0) {
        container.innerHTML = '<p class="no-images">Zatím žádné fotky</p>';
        return;
    }

    container.innerHTML = '';
    editedImages.forEach((img, index) => {
        const item = document.createElement('div');
        item.className = 'prop-image-item';
        item.innerHTML = `
            <img src="${escapeHtml(resolveImage(img))}" alt="Fotka ${index + 1}">
            ${index === 0 ? '<span class="main-badge">Hlavní</span>' : ''}
            <div class="prop-image-actions">
                <button type="button" data-act="left" title="Posunout doleva" ${index === 0 ? 'disabled' : ''}><i class="fas fa-arrow-left"></i></button>
                <button type="button" data-act="remove" title="Odebrat"><i class="fas fa-trash"></i></button>
                <button type="button" data-act="right" title="Posunout doprava" ${index === editedImages.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-right"></i></button>
            </div>
        `;
        item.querySelector('[data-act="left"]').addEventListener('click', () => {
            [editedImages[index - 1], editedImages[index]] = [editedImages[index], editedImages[index - 1]];
            renderEditedImages();
        });
        item.querySelector('[data-act="right"]').addEventListener('click', () => {
            [editedImages[index + 1], editedImages[index]] = [editedImages[index], editedImages[index + 1]];
            renderEditedImages();
        });
        item.querySelector('[data-act="remove"]').addEventListener('click', () => {
            editedImages.splice(index, 1);
            renderEditedImages();
        });
        container.appendChild(item);
    });
}

/** Zmenší obrázek na max 1600 px a převede na JPEG, aby se šetřilo místo. */
function resizeImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const MAX = 1600;
            let { width, height } = img;
            if (width > MAX || height > MAX) {
                const scale = MAX / Math.max(width, height);
                width = Math.round(width * scale);
                height = Math.round(height * scale);
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                blob => blob ? resolve(blob) : reject(new Error('Nepodařilo se zpracovat obrázek')),
                'image/jpeg', 0.85
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Soubor není platný obrázek'));
        };
        img.src = url;
    });
}

async function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const status = document.getElementById('prop-upload-status');

    for (let i = 0; i < files.length; i++) {
        status.textContent = `Nahrávám ${i + 1}/${files.length}...`;
        try {
            const blob = await resizeImage(files[i]);
            const response = await fetch(`${API_URL}/admin/images`, {
                method: 'POST',
                headers: authHeaders({ 'Content-Type': 'image/jpeg' }),
                body: blob
            });
            const data = await response.json();
            if (response.ok && data.success) {
                editedImages.push(data.path);
                renderEditedImages();
            } else {
                alert(`Chyba při nahrávání ${files[i].name}: ${data.error || 'neznámá chyba'}`);
            }
        } catch (error) {
            alert(`Chyba při nahrávání ${files[i].name}: ${error.message}`);
        }
    }

    status.textContent = '';
    e.target.value = '';
}

function collectPropertyForm() {
    return {
        type: document.getElementById('prop-type').value,
        title: document.getElementById('prop-title').value,
        building: document.getElementById('prop-type').value === 'office'
            ? document.getElementById('prop-building').value || null
            : null,
        location: document.getElementById('prop-location').value,
        size: document.getElementById('prop-size').value,
        capacity: document.getElementById('prop-capacity').value,
        price: document.getElementById('prop-price').value,
        utilities: document.getElementById('prop-utilities').value,
        deposit: document.getElementById('prop-deposit').value,
        available: document.getElementById('prop-available').value,
        vatNote: document.getElementById('prop-vat').value,
        description: document.getElementById('prop-description').value,
        features: document.getElementById('prop-features').value
            .split('\n').map(s => s.trim()).filter(Boolean),
        images: editedImages,
        published: document.getElementById('prop-published').checked,
        sortOrder: parseInt(document.getElementById('prop-sort').value, 10) || 0
    };
}

async function handleSaveProperty(e) {
    e.preventDefault();

    const saveBtn = document.getElementById('property-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Ukládám...';

    const payload = collectPropertyForm();
    const isNew = editedPropertyId === null;

    try {
        const response = await fetch(
            isNew ? `${API_URL}/admin/properties` : `${API_URL}/admin/properties/${editedPropertyId}`,
            {
                method: isNew ? 'POST' : 'PUT',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload)
            }
        );
        const data = await response.json();

        if (response.ok && data.success) {
            document.getElementById('property-modal').style.display = 'none';
            await loadProperties();
        } else {
            alert('Chyba při ukládání: ' + (data.error || 'neznámá chyba'));
        }
    } catch (error) {
        alert('Chyba připojení k serveru');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Uložit';
    }
}

async function togglePropertyPublished(property) {
    try {
        const payload = {
            ...property,
            published: !property.published
        };
        const response = await fetch(`${API_URL}/admin/properties/${property.id}`, {
            method: 'PUT',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (response.ok && data.success) {
            await loadProperties();
        } else {
            alert('Chyba: ' + (data.error || 'neznámá chyba'));
        }
    } catch (error) {
        alert('Chyba připojení k serveru');
    }
}

async function deleteProperty(property) {
    if (!confirm(`Opravdu chcete smazat nabídku "${property.title}"? Tato akce je nevratná a smaže i nahrané fotky.`)) return;

    try {
        const response = await fetch(`${API_URL}/admin/properties/${property.id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        const data = await response.json();
        if (response.ok && data.success) {
            await loadProperties();
        } else {
            alert('Chyba při mazání: ' + (data.error || 'neznámá chyba'));
        }
    } catch (error) {
        alert('Chyba připojení k serveru');
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
