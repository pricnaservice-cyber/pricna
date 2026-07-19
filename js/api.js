// API Configuration
// Na localhostu se automaticky používá lokální wrangler dev server.
const API_CONFIG = {
    baseURL: ['localhost', '127.0.0.1'].includes(window.location.hostname)
        ? 'http://127.0.0.1:8787/api'
        : 'https://pricna-api.pricna-service.workers.dev/api',
    timeout: 10000
};

// API Helper functions
const API = {
    // Rezervace - vytvoření
    async createReservation(data) {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}/reservations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating reservation:', error);
            return { success: false, error: 'Chyba připojení k serveru' };
        }
    },

    // Veřejný přehled rezervací pro kalendář
    async getPublicReservations() {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}/reservations/public`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching reservations:', error);
            return [];
        }
    },

    // Poptávka - odeslání
    async createInquiry(data) {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}/inquiries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating inquiry:', error);
            return { success: false, error: 'Chyba připojení k serveru' };
        }
    },

    // Nemovitosti - publikované nabídky (type: 'apartment' | 'office')
    async getProperties(type) {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}/properties?type=${encodeURIComponent(type)}`);
            const data = await response.json();
            return data.success ? data.properties : [];
        } catch (error) {
            console.error('Error fetching properties:', error);
            return [];
        }
    },

    // Převod uložené cesty obrázku na použitelnou URL
    resolveImage(path) {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        if (path.startsWith('/api/')) {
            return API_CONFIG.baseURL.replace(/\/api$/, '') + path;
        }
        return path; // statické obrázky webu (images/...)
    }
};
