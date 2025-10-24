// API Configuration
const API_CONFIG = {
    baseURL: 'http://localhost:3000/api', // Změňte na produkční URL
    timeout: 10000
};

// API Helper functions
const API = {
    // Rezervace - vytvoření
    async createReservation(data) {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}/reservations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error creating reservation:', error);
            return { success: false, error: 'Chyba připojení k serveru' };
        }
    },
    
    // Kontrola dostupnosti časových slotů
    async checkAvailability(date, timeSlots) {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}/reservations/check-availability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ date, timeSlots })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error checking availability:', error);
            return { success: false, error: 'Chyba připojení k serveru' };
        }
    },
    
    // Získání rezervací pro datum
    async getReservationsByDate(date) {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}/reservations/by-date/${date}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching reservations:', error);
            return { success: false, error: 'Chyba připojení k serveru', data: [] };
        }
    },
    
    // Získání rezervací v rozmezí
    async getReservationsByRange(startDate, endDate) {
        try {
            const response = await fetch(
                `${API_CONFIG.baseURL}/reservations/range?start=${startDate}&end=${endDate}`
            );
            return await response.json();
        } catch (error) {
            console.error('Error fetching reservations range:', error);
            return { success: false, error: 'Chyba připojení k serveru', data: [] };
        }
    },
    
    // Poptávka - odeslání
    async createInquiry(data) {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}/inquiries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error creating inquiry:', error);
            return { success: false, error: 'Chyba připojení k serveru' };
        }
    }
};

// Export pro použití v ostatních souborech
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}
