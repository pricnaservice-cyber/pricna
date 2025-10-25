document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links li a');
    const mobileOverlay = document.querySelector('.mobile-overlay');

    console.log('Mobile menu elements:', { hamburger, navLinks, mobileOverlay });

    function toggleMobileMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Toggle mobile menu clicked');
        
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        if (mobileOverlay) {
            mobileOverlay.classList.toggle('active');
        }
        document.body.style.overflow = hamburger.classList.contains('active') ? 'hidden' : '';
    }

    function closeMobileMenu() {
        console.log('Closing mobile menu');
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        if (mobileOverlay) {
            mobileOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
    }

    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
        console.log('Hamburger click listener added');
    } else {
        console.error('Hamburger element not found!');
    }

    // Close mobile menu when clicking on overlay
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileMenu);
    }

    // Close mobile menu when clicking on a nav link
    navItems.forEach(item => {
        item.addEventListener('click', closeMobileMenu);
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Sticky header on scroll
    const header = document.querySelector('header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.classList.remove('scroll-up');
            return;
        }
        
        if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
            // Scroll down
            header.classList.remove('scroll-up');
            header.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
            // Scroll up
            header.classList.remove('scroll-down');
            header.classList.add('scroll-up');
        }
        
        lastScroll = currentScroll;
    });

    // Form submission
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            
            const inquiryData = {
                type: 'contact',
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                service: formData.get('service'),
                message: formData.get('message')
            };
            
            // Disable submit button
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Odesílání...';
            
            // Send to API
            const result = await API.createInquiry(inquiryData);
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            
            if (result.success) {
                alert('Děkujeme za vaši zprávu! Potvrzení jsme vám zaslali na email. Ozveme se vám co nejdříve.');
                this.reset();
            } else {
                alert('Chyba při odesílání zprávy: ' + (result.error || 'Zkuste to prosím později'));
            }
        });
    }

    // Add animation on scroll
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.service-card, .apartment-card');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (elementPosition < screenPosition) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    // Set initial styles for animation
    document.querySelectorAll('.service-card, .apartment-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    // Run animation on load and scroll
    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);

    // ========== BOOKING CALENDAR SYSTEM ==========
    
    // Booking data (loaded from API)
    let bookedSlots = {};
    let allReservations = [];
    
    // Load reservations from API
    async function loadReservations() {
        try {
            const response = await fetch('https://pricna-api.pricna-service.workers.dev/api/reservations/public');
            if (response.ok) {
                allReservations = await response.json();
                console.log('✅ Loaded reservations:', allReservations.length, 'total');
                
                // Build bookedSlots from reservations (only active ones - cancelled are already filtered by API)
                bookedSlots = {};
                allReservations.forEach(reservation => {
                    const times = reservation.time.split(', ');
                    if (!bookedSlots[reservation.date]) {
                        bookedSlots[reservation.date] = [];
                    }
                    bookedSlots[reservation.date].push(...times);
                });
                console.log('✅ Active reservations:', allReservations.length);
                console.log('✅ Booked slots by date:', bookedSlots);
            } else {
                console.error('❌ Failed to load reservations:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ Error loading reservations:', error);
        }
    }

    // Available time slots (7:00 - 19:00, hourly, last booking 18:00-19:00)
    const timeSlots = [
        '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', 
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];

    // Pricing
    const PRICE_PER_HOUR = 99;
    const PRICE_FULL_DAY = 399; // 4+ hours
    const FULL_DAY_THRESHOLD = 4;

    // Automatické generování českých státních svátků
    function calculateEaster(year) {
        // Gaussův algoritmus pro výpočet Velikonoc
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
        
        // Fixní svátky
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
        
        // Pohyblivé svátky (Velikonoce)
        const goodFriday = new Date(easter);
        goodFriday.setDate(easter.getDate() - 2);
        holidays.push(goodFriday.toISOString().split('T')[0]); // Velký pátek
        
        const easterMonday = new Date(easter);
        easterMonday.setDate(easter.getDate() + 1);
        holidays.push(easterMonday.toISOString().split('T')[0]); // Velikonoční pondělí
        
        return holidays;
    }
    
    // Generování svátků pro aktuální a příští 2 roky
    const currentYear = new Date().getFullYear();
    const czechHolidays = [
        ...getCzechHolidays(currentYear),
        ...getCzechHolidays(currentYear + 1),
        ...getCzechHolidays(currentYear + 2)
    ];

    let currentDate = new Date();
    let selectedDate = null;
    let selectedTimeSlots = []; // Array to store multiple selected time slots

    // Calendar elements
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const selectedDateText = document.getElementById('selected-date-text');
    const timeSlotsContainer = document.getElementById('time-slots-container');
    const timeSlotsElement = document.getElementById('time-slots');
    const bookingForm = document.getElementById('booking-form');
    const cancelBookingBtn = document.getElementById('cancel-booking');

    // Month names in Czech
    const monthNames = [
        'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
        'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
    ];

    // Helper function to check if date is a Czech holiday
    function isCzechHoliday(date) {
        const dateString = formatDate(date);
        return czechHolidays.includes(dateString);
    }

    // Helper function to check if date is weekend
    function isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
    }

    // Helper function to check if office is closed
    function isOfficeClosed(date) {
        return isWeekend(date) || isCzechHoliday(date);
    }

    // Calculate price based on duration
    function calculatePrice(hours) {
        if (hours >= FULL_DAY_THRESHOLD) {
            return PRICE_FULL_DAY;
        }
        return hours * PRICE_PER_HOUR;
    }

    // Initialize calendar
    async function initCalendar() {
        // Load reservations first
        await loadReservations();
        
        renderCalendar();
        
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });

        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });

        cancelBookingBtn.addEventListener('click', resetBooking);
        
        bookingForm.addEventListener('submit', handleBookingSubmit);
        
        // Auto-refresh reservations every 30 seconds to sync with admin panel
        setInterval(async () => {
            await loadReservations();
            renderCalendar();
            // If user has date selected, refresh time slots too
            if (selectedDate) {
                const currentTimeSlots = document.getElementById('time-slots-grid');
                if (currentTimeSlots) {
                    showTimeSlots(selectedDate);
                }
            }
        }, 30000); // 30 seconds
    }

    // Render calendar
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        calendarMonthYear.textContent = `${monthNames[month]} ${year}`;
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const numDays = lastDay.getDate();
        
        // Get day of week (0 = Sunday, adjust to Monday = 0)
        let firstDayOfWeek = firstDay.getDay() - 1;
        if (firstDayOfWeek === -1) firstDayOfWeek = 6;
        
        // Clear calendar days (keep headers)
        const headers = calendarGrid.querySelectorAll('.calendar-day-header');
        calendarGrid.innerHTML = '';
        headers.forEach(header => calendarGrid.appendChild(header));
        
        // Add empty cells for days before month starts
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'other-month');
            calendarGrid.appendChild(emptyDay);
        }
        
        // Add days of month
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let day = 1; day <= numDays; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.textContent = day;
            
            const dayDate = new Date(year, month, day);
            dayDate.setHours(0, 0, 0, 0);
            const dateString = formatDate(dayDate);
            
            // Mark today
            if (dayDate.getTime() === today.getTime()) {
                dayElement.classList.add('today');
            }
            
            // Disable past dates, weekends, and holidays
            if (dayDate < today || isOfficeClosed(dayDate)) {
                dayElement.classList.add('disabled');
            } else {
                // Check if date has bookings
                if (bookedSlots[dateString]) {
                    dayElement.classList.add('has-bookings');
                }
                
                // Add click handler
                dayElement.addEventListener('click', () => selectDate(dayDate));
            }
            
            // Mark selected date
            if (selectedDate && dayDate.getTime() === selectedDate.getTime()) {
                dayElement.classList.add('selected');
            }
            
            calendarGrid.appendChild(dayElement);
        }
    }

    // Select date
    function selectDate(date) {
        selectedDate = date;
        selectedTimeSlots = [];
        renderCalendar();
        showTimeSlots(date);
    }

    // Show available time slots
    function showTimeSlots(date) {
        const dateString = formatDate(date);
        const bookedTimes = bookedSlots[dateString] || [];
        
        // Update selected date display
        selectedDateText.textContent = formatDateCzech(date);
        
        // Clear and show time slots
        timeSlotsElement.innerHTML = '';
        
        // Add instruction text
        const instructionText = document.createElement('p');
        instructionText.className = 'time-slots-instruction';
        instructionText.innerHTML = '<strong>Vyberte časové sloty:</strong> Klikněte na hodiny, které chcete rezervovat. Můžete vybrat více hodin.';
        timeSlotsElement.appendChild(instructionText);
        
        // Create time slot buttons container
        const slotsGrid = document.createElement('div');
        slotsGrid.id = 'time-slots-grid';
        slotsGrid.className = 'time-slots-grid';
        timeSlotsElement.appendChild(slotsGrid);
        
        // Create individual time slot buttons
        timeSlots.forEach((time, index) => {
            const slotElement = document.createElement('div');
            slotElement.classList.add('time-slot');
            slotElement.dataset.time = time;
            slotElement.dataset.index = index;
            
            // Show time range (e.g., "09:00-10:00")
            const endTime = index + 1 < timeSlots.length ? timeSlots[index + 1] : '19:00';
            slotElement.textContent = `${time}-${endTime}`;
            
            if (bookedTimes.includes(time)) {
                slotElement.classList.add('booked');
            } else {
                slotElement.addEventListener('click', () => toggleTimeSlot(time, slotElement));
            }
            
            slotsGrid.appendChild(slotElement);
        });
        
        // Add selection summary
        const selectionSummary = document.createElement('div');
        selectionSummary.id = 'selection-summary';
        selectionSummary.className = 'selection-summary';
        selectionSummary.style.display = 'none';
        timeSlotsElement.appendChild(selectionSummary);
        
        // Add confirm button
        const confirmButton = document.createElement('button');
        confirmButton.id = 'confirm-selection-btn';
        confirmButton.className = 'btn btn-primary';
        confirmButton.textContent = 'Pokračovat k rezervaci';
        confirmButton.style.display = 'none';
        confirmButton.addEventListener('click', showBookingForm);
        timeSlotsElement.appendChild(confirmButton);
        
        timeSlotsContainer.style.display = 'block';
        bookingForm.style.display = 'none';
    }

    // Toggle time slot selection
    function toggleTimeSlot(time, slotElement) {
        const index = selectedTimeSlots.indexOf(time);
        
        if (index > -1) {
            // Deselect
            selectedTimeSlots.splice(index, 1);
            slotElement.classList.remove('selected');
        } else {
            // Select
            selectedTimeSlots.push(time);
            slotElement.classList.add('selected');
        }
        
        // Sort selected slots by time
        selectedTimeSlots.sort((a, b) => {
            return timeSlots.indexOf(a) - timeSlots.indexOf(b);
        });
        
        // Update selection summary
        updateSelectionSummary();
    }
    
    // Update selection summary with duration and price
    function updateSelectionSummary() {
        const selectionSummary = document.getElementById('selection-summary');
        const confirmButton = document.getElementById('confirm-selection-btn');
        
        if (selectedTimeSlots.length === 0) {
            selectionSummary.style.display = 'none';
            confirmButton.style.display = 'none';
            return;
        }
        
        const duration = selectedTimeSlots.length;
        const totalPrice = calculatePrice(duration);
        const startTime = selectedTimeSlots[0];
        const lastSlotIndex = timeSlots.indexOf(selectedTimeSlots[selectedTimeSlots.length - 1]);
        const endTime = lastSlotIndex + 1 < timeSlots.length ? timeSlots[lastSlotIndex + 1] : '19:00';
        
        const hoursText = duration === 1 ? 'hodina' : duration < 5 ? 'hodiny' : 'hodin';
        
        selectionSummary.innerHTML = `
            <p><strong>Vybrané hodiny:</strong> ${duration} ${hoursText}</p>
            <p><strong>Čas:</strong> ${startTime} - ${endTime}</p>
            <p><strong>Celková cena:</strong> <span class="price-highlight">${totalPrice} Kč</span></p>
        `;
        
        selectionSummary.style.display = 'block';
        confirmButton.style.display = 'block';
    }

    // Show booking form
    function showBookingForm() {
        if (selectedTimeSlots.length === 0) return;
        
        const duration = selectedTimeSlots.length;
        const startTime = selectedTimeSlots[0];
        const lastSlotIndex = timeSlots.indexOf(selectedTimeSlots[selectedTimeSlots.length - 1]);
        const endTime = lastSlotIndex + 1 < timeSlots.length ? timeSlots[lastSlotIndex + 1] : '19:00';
        const totalPrice = calculatePrice(duration);
        const hoursText = duration === 1 ? 'hodina' : duration < 5 ? 'hodiny' : 'hodin';
        
        document.getElementById('summary-date').textContent = formatDateCzech(selectedDate);
        document.getElementById('summary-time').textContent = `${startTime} - ${endTime} (${duration} ${hoursText})`;
        
        // Update or create price display
        let priceElement = document.getElementById('summary-price');
        if (!priceElement) {
            const summaryContainer = document.querySelector('.booking-summary');
            const priceP = document.createElement('p');
            priceP.innerHTML = '<strong>Celková cena:</strong> <span id="summary-price"></span>';
            summaryContainer.appendChild(priceP);
            priceElement = document.getElementById('summary-price');
        }
        priceElement.textContent = `${totalPrice} Kč`;
        
        bookingForm.style.display = 'block';
        
        // Scroll to form
        bookingForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Handle booking submission
    async function handleBookingSubmit(e) {
        e.preventDefault();
        
        if (selectedTimeSlots.length === 0) {
            alert('Prosím vyberte alespoň jednu hodinu.');
            return;
        }
        
        const formData = new FormData(bookingForm);
        const duration = selectedTimeSlots.length;
        const startTime = selectedTimeSlots[0];
        const lastSlotIndex = timeSlots.indexOf(selectedTimeSlots[selectedTimeSlots.length - 1]);
        const endTime = lastSlotIndex + 1 < timeSlots.length ? timeSlots[lastSlotIndex + 1] : '19:00';
        const totalPrice = calculatePrice(duration);
        const hoursText = duration === 1 ? 'hodina' : duration < 5 ? 'hodiny' : 'hodin';
        
        const bookingData = {
            date: formatDate(selectedDate),
            timeSlots: selectedTimeSlots,
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            company: formData.get('company') || '',
            message: formData.get('message') || '',
            totalPrice: totalPrice
        };
        
        // Disable submit button
        const submitBtn = bookingForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Odesílání...';
        
        // Send to backend API
        const result = await API.createReservation(bookingData);
        
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        if (result.success) {
            // Reload reservations from server to ensure sync
            await loadReservations();
            
            // Re-render calendar to show booked slots
            renderCalendar();
            
            // Show success message
            alert(`Rezervace byla úspěšně vytvořena!\n\nDatum: ${formatDateCzech(selectedDate)}\nČas: ${startTime} - ${endTime}\nDoba: ${duration} ${hoursText}\nCelková cena: ${totalPrice} Kč\n\nPotvrzení jsme vám zaslali na ${bookingData.email}`);
            
            // Reset
            resetBooking();
        } else {
            if (result.error === 'Některé časové sloty již nejsou k dispozici') {
                alert('Omlouváme se, některé z vybraných časových slotů již byly zarezervovány jiným klientem. Prosím, vyberte jiný čas.');
                // Reload slots for this date
                showTimeSlots(selectedDate);
            } else {
                alert('Chyba při vytváření rezervace: ' + (result.error || 'Zkuste to prosím později'));
            }
        }
    }

    // Reset booking
    function resetBooking() {
        selectedDate = null;
        selectedTimeSlots = [];
        bookingForm.reset();
        bookingForm.style.display = 'none';
        timeSlotsContainer.style.display = 'none';
        selectedDateText.textContent = 'Vyberte datum v kalendáři';
        renderCalendar();
    }

    // Format date as YYYY-MM-DD
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Format date in Czech
    function formatDateCzech(date) {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${day}. ${month}. ${year}`;
    }

    // Initialize calendar if booking section exists
    if (calendarGrid) {
        initCalendar();
    }

    // ========== IMAGE GALLERY LIGHTBOX ==========
    
    let currentImageIndex = 0;
    let galleryImages = [];
    
    function setupGalleryLightbox() {
        // Get all gallery images
        galleryImages = Array.from(document.querySelectorAll('.gallery-image'));
        
        if (galleryImages.length === 0) return; // No gallery on this page
        
        // Create lightbox element if it doesn't exist
        let lightbox = document.getElementById('image-lightbox');
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'image-lightbox';
            lightbox.className = 'image-lightbox';
            lightbox.innerHTML = `
                <span class="lightbox-close">&times;</span>
                <button class="lightbox-prev" aria-label="Previous image">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <img src="" alt="" class="lightbox-image">
                <button class="lightbox-next" aria-label="Next image">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <div class="lightbox-counter"></div>
            `;
            document.body.appendChild(lightbox);
            
            // Close lightbox
            const closeBtn = lightbox.querySelector('.lightbox-close');
            closeBtn.addEventListener('click', closeLightbox);
            
            lightbox.addEventListener('click', function(e) {
                if (e.target === lightbox) {
                    closeLightbox();
                }
            });
            
            // Navigation buttons
            lightbox.querySelector('.lightbox-prev').addEventListener('click', showPreviousImage);
            lightbox.querySelector('.lightbox-next').addEventListener('click', showNextImage);
            
            // Keyboard navigation
            document.addEventListener('keydown', handleKeyboardNav);
        }
        
        // Add click handlers to all gallery images
        galleryImages.forEach((img, index) => {
            img.style.cursor = 'pointer';
            img.addEventListener('click', function() {
                openLightbox(index);
            });
        });
    }
    
    function openLightbox(index) {
        currentImageIndex = index;
        const lightbox = document.getElementById('image-lightbox');
        updateLightboxImage();
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    function closeLightbox() {
        const lightbox = document.getElementById('image-lightbox');
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    function updateLightboxImage() {
        const lightbox = document.getElementById('image-lightbox');
        const lightboxImg = lightbox.querySelector('.lightbox-image');
        const counter = lightbox.querySelector('.lightbox-counter');
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');
        
        lightboxImg.src = galleryImages[currentImageIndex].src;
        lightboxImg.alt = galleryImages[currentImageIndex].alt;
        
        // Update counter
        counter.textContent = `${currentImageIndex + 1} / ${galleryImages.length}`;
        
        // Show/hide navigation buttons
        prevBtn.style.display = currentImageIndex === 0 ? 'none' : 'flex';
        nextBtn.style.display = currentImageIndex === galleryImages.length - 1 ? 'none' : 'flex';
    }
    
    function showPreviousImage(e) {
        e.stopPropagation();
        if (currentImageIndex > 0) {
            currentImageIndex--;
            updateLightboxImage();
        }
    }
    
    function showNextImage(e) {
        e.stopPropagation();
        if (currentImageIndex < galleryImages.length - 1) {
            currentImageIndex++;
            updateLightboxImage();
        }
    }
    
    function handleKeyboardNav(e) {
        const lightbox = document.getElementById('image-lightbox');
        if (lightbox && lightbox.style.display === 'flex') {
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                showPreviousImage(e);
            } else if (e.key === 'ArrowRight') {
                showNextImage(e);
            }
        }
    }
    
    // Initialize gallery lightbox
    setupGalleryLightbox();
});
