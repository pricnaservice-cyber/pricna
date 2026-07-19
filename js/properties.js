/**
 * Dynamické nabídky nemovitostí (byty + kanceláře).
 * Data se načítají z API (spravují se v admin panelu).
 *
 * Použití v HTML:
 *  - kancelare.html: <div class="offices-grid" data-building="Příčná 1"></div> (pro každou budovu)
 *  - byty.html:      <div class="apartments-grid" data-apartments></div>
 *  - obě stránky:    modal s id "property-modal" a vnitřním "modal-body"
 */

(function () {
    'use strict';

    let propertiesById = {};

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // === RENDER KARET ===

    function cardImageHtml(property) {
        const firstImage = property.images && property.images[0];
        if (firstImage) {
            return `<img src="${escapeHtml(API.resolveImage(firstImage))}" alt="${escapeHtml(property.title)}" loading="lazy">`;
        }
        return '<i class="fas fa-image"></i>';
    }

    function officeCardHtml(property) {
        return `
            <div class="office-card scale-in">
                <div class="office-img-placeholder">${cardImageHtml(property)}</div>
                <div class="office-info">
                    <h4>${escapeHtml(property.title)}</h4>
                    ${property.size ? `<p class="office-size"><i class="fas fa-ruler-combined"></i> ${escapeHtml(property.size)}</p>` : ''}
                    ${property.capacity ? `<p class="office-capacity"><i class="fas fa-users"></i> ${escapeHtml(property.capacity)}</p>` : ''}
                    ${property.location ? `<p class="office-location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(property.location)}</p>` : ''}
                    <button class="btn btn-primary property-detail-btn" data-property-id="${property.id}">Více informací</button>
                </div>
            </div>
        `;
    }

    function apartmentCardHtml(property) {
        return `
            <div class="apartment-card scale-in">
                <div class="apartment-img-placeholder">${cardImageHtml(property)}</div>
                <div class="apartment-info">
                    <h3>${escapeHtml(property.title)}</h3>
                    ${property.size ? `<p class="apartment-size"><i class="fas fa-ruler-combined"></i> ${escapeHtml(property.size)}</p>` : ''}
                    ${property.location ? `<p class="apartment-location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(property.location)}</p>` : ''}
                    ${property.price ? `<p class="apartment-price"><i class="fas fa-tag"></i> ${escapeHtml(property.price)}</p>` : ''}
                    <button class="btn btn-primary property-detail-btn" data-property-id="${property.id}">Více informací</button>
                </div>
            </div>
        `;
    }

    function emptyStateHtml(text) {
        return `
            <div class="properties-empty">
                <i class="fas fa-door-open"></i>
                <p>${escapeHtml(text)}</p>
            </div>
        `;
    }

    async function renderOffices() {
        const grids = document.querySelectorAll('.offices-grid[data-building]');
        if (grids.length === 0) return false;

        const offices = await API.getProperties('office');
        offices.forEach(p => { propertiesById[p.id] = p; });

        const knownBuildings = new Set();
        grids.forEach(grid => knownBuildings.add(grid.dataset.building));

        grids.forEach(grid => {
            const building = grid.dataset.building;
            const items = offices.filter(p => p.building === building);
            grid.innerHTML = items.length
                ? items.map(officeCardHtml).join('')
                : emptyStateHtml('V této budově momentálně nejsou volné kanceláře.');
        });

        // Kanceláře v budovách, které nemají vlastní sekci
        const extraSection = document.getElementById('other-offices-section');
        if (extraSection) {
            const extras = offices.filter(p => !knownBuildings.has(p.building));
            if (extras.length) {
                extraSection.style.display = '';
                extraSection.querySelector('.offices-grid').innerHTML = extras.map(officeCardHtml).join('');
            } else {
                extraSection.style.display = 'none';
            }
        }
        return true;
    }

    async function renderApartments() {
        const grid = document.querySelector('.apartments-grid[data-apartments]');
        if (!grid) return false;

        const apartments = await API.getProperties('apartment');
        apartments.forEach(p => { propertiesById[p.id] = p; });

        grid.innerHTML = apartments.length
            ? apartments.map(apartmentCardHtml).join('')
            : emptyStateHtml('Momentálně nejsou k dispozici žádné volné byty. Zkuste to prosím později.');
        return true;
    }

    // === MODAL DETAIL ===

    function detailItem(icon, label, value) {
        if (!value) return '';
        return `
            <div class="detail-item">
                <i class="fas ${icon}"></i>
                <strong>${label}:</strong> ${escapeHtml(value)}
            </div>
        `;
    }

    function showPropertyDetail(property) {
        const modal = document.getElementById('property-modal');
        const modalBody = document.getElementById('modal-body');
        if (!modal || !modalBody) return;

        const isOffice = property.type === 'office';
        const featuresHtml = (property.features || [])
            .map(f => `<li><i class="fas fa-check"></i> ${escapeHtml(f)}</li>`).join('');
        const imagesHtml = property.images && property.images.length ? `
            <div class="modal-images-gallery">
                ${property.images.map(img =>
                    `<img src="${escapeHtml(API.resolveImage(img))}" alt="${escapeHtml(property.title)}" class="property-image" loading="lazy">`
                ).join('')}
            </div>
        ` : '';

        modalBody.innerHTML = `
            <h2>${escapeHtml(property.title)}</h2>
            ${imagesHtml}
            <div class="modal-property-details">
                ${isOffice ? detailItem('fa-building', 'Budova', property.building) : ''}
                ${detailItem('fa-map-marker-alt', 'Adresa', property.location)}
                ${detailItem('fa-ruler-combined', 'Velikost', property.size)}
                ${isOffice ? detailItem('fa-users', 'Kapacita', property.capacity) : ''}
                ${detailItem('fa-tag', 'Nájem', property.price)}
                ${detailItem('fa-bolt', 'Služby', property.utilities)}
                ${detailItem('fa-shield-alt', 'Kauce', property.deposit)}
                ${!isOffice ? detailItem('fa-calendar-check', 'Dostupnost', property.available) : ''}
            </div>
            ${property.vatNote ? `<div class="vat-note"><i class="fas fa-info-circle"></i> ${escapeHtml(property.vatNote)}</div>` : ''}
            ${property.description ? `
            <div class="modal-description">
                <h3>Popis</h3>
                <p>${escapeHtml(property.description)}</p>
            </div>` : ''}
            ${featuresHtml ? `
            <div class="modal-features">
                <h3>${isOffice ? 'Vybavení a výhody' : 'Vybavení'}</h3>
                <ul>${featuresHtml}</ul>
            </div>` : ''}
            <div class="modal-contact-form">
                <h3>${isOffice ? 'Mám zájem o tuto kancelář' : 'Mám zájem o tento byt'}</h3>
                <form class="inquiry-form" id="property-inquiry-form">
                    <div class="form-group">
                        <input type="text" name="name" placeholder="Jméno a příjmení *" required>
                    </div>
                    <div class="form-group">
                        <input type="email" name="email" placeholder="E-mail *" required>
                    </div>
                    <div class="form-group">
                        <input type="tel" name="phone" placeholder="Telefon *" required>
                    </div>
                    <div class="form-group">
                        <textarea name="message" rows="3" placeholder="Vaše zpráva"></textarea>
                    </div>
                    <div style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;">
                        <input type="text" name="website" tabindex="-1" autocomplete="off">
                    </div>
                    <button type="submit" class="btn btn-primary">Odeslat poptávku</button>
                </form>
            </div>
        `;

        modalBody.querySelector('#property-inquiry-form')
            .addEventListener('submit', e => handleInquiry(e, property));

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        setupImageLightbox(modalBody);
    }

    function closeModal() {
        const modal = document.getElementById('property-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // === POPTÁVKA ===

    function isSpam(formData) {
        const honeypot = formData.get('website');
        if (honeypot && honeypot.trim() !== '') return 'Chyba při odesílání zprávy. Zkuste to prosím později.';

        const name = formData.get('name') || '';
        if (name.length > 3) {
            const uppercaseRatio = (name.match(/[A-Z]/g) || []).length / name.length;
            if (uppercaseRatio > 0.7) return 'Prosím zadejte platné jméno.';
            if (name.length > 15 && !name.includes(' ')) return 'Prosím zadejte celé jméno včetně mezery.';
        }

        const message = formData.get('message') || '';
        if (message.length > 10 && /^[A-Z]{15,}$/i.test(message.replace(/\s/g, ''))) {
            return 'Prosím zadejte smysluplnou zprávu.';
        }
        return null;
    }

    async function handleInquiry(event, property) {
        event.preventDefault();
        const formData = new FormData(event.target);

        const spamMessage = isSpam(formData);
        if (spamMessage) {
            alert(spamMessage);
            return;
        }

        const inquiryData = {
            type: property.type === 'office' ? 'office' : 'apartment',
            itemName: property.title + (property.building ? ` (${property.building})` : ''),
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            message: formData.get('message') || `Mám zájem o ${property.title}`
        };

        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Odesílání...';

        const result = await API.createInquiry(inquiryData);

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;

        if (result.success) {
            alert(`Děkujeme za váš zájem o ${property.title}!\n\nVaše poptávka byla odeslána a potvrzení jsme vám zaslali na email. Ozveme se vám co nejdříve.`);
            closeModal();
        } else {
            alert('Chyba při odesílání poptávky: ' + (result.error || 'Zkuste to prosím později'));
        }
    }

    // === LIGHTBOX ===

    let currentImageIndex = 0;
    let galleryImages = [];

    function ensureLightbox() {
        let lightbox = document.getElementById('image-lightbox');
        if (lightbox) return lightbox;

        lightbox = document.createElement('div');
        lightbox.id = 'image-lightbox';
        lightbox.className = 'image-lightbox';
        lightbox.innerHTML = `
            <span class="lightbox-close">&times;</span>
            <button class="lightbox-prev" aria-label="Předchozí fotka"><i class="fas fa-chevron-left"></i></button>
            <img src="" alt="" class="lightbox-image">
            <button class="lightbox-next" aria-label="Další fotka"><i class="fas fa-chevron-right"></i></button>
            <div class="lightbox-counter"></div>
        `;
        document.body.appendChild(lightbox);

        lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
        lightbox.querySelector('.lightbox-prev').addEventListener('click', showPreviousImage);
        lightbox.querySelector('.lightbox-next').addEventListener('click', showNextImage);
        document.addEventListener('keydown', handleKeyboardNav);
        return lightbox;
    }

    function setupImageLightbox(scope) {
        galleryImages = Array.from(scope.querySelectorAll('.modal-images-gallery img'));
        galleryImages.forEach((img, index) => {
            img.addEventListener('click', () => openLightbox(index));
        });
    }

    function openLightbox(index) {
        currentImageIndex = index;
        const lightbox = ensureLightbox();
        updateLightboxImage();
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        const lightbox = document.getElementById('image-lightbox');
        if (lightbox) lightbox.style.display = 'none';
        // modal pod lightboxem zůstává otevřený
        document.body.style.overflow = 'hidden';
    }

    function updateLightboxImage() {
        const lightbox = ensureLightbox();
        const lightboxImg = lightbox.querySelector('.lightbox-image');
        lightboxImg.src = galleryImages[currentImageIndex].src;
        lightboxImg.alt = galleryImages[currentImageIndex].alt;
        lightbox.querySelector('.lightbox-counter').textContent = `${currentImageIndex + 1} / ${galleryImages.length}`;
        lightbox.querySelector('.lightbox-prev').style.display = currentImageIndex === 0 ? 'none' : 'flex';
        lightbox.querySelector('.lightbox-next').style.display = currentImageIndex === galleryImages.length - 1 ? 'none' : 'flex';
    }

    function showPreviousImage(e) {
        e.stopPropagation();
        if (currentImageIndex > 0) { currentImageIndex--; updateLightboxImage(); }
    }

    function showNextImage(e) {
        e.stopPropagation();
        if (currentImageIndex < galleryImages.length - 1) { currentImageIndex++; updateLightboxImage(); }
    }

    function handleKeyboardNav(e) {
        const lightbox = document.getElementById('image-lightbox');
        if (!lightbox || lightbox.style.display !== 'flex') return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') showPreviousImage(e);
        else if (e.key === 'ArrowRight') showNextImage(e);
    }

    // === INIT ===

    async function init() {
        const modal = document.getElementById('property-modal');
        if (modal) {
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) closeBtn.addEventListener('click', closeModal);
            window.addEventListener('click', e => { if (e.target === modal) closeModal(); });
        }

        document.addEventListener('click', e => {
            const btn = e.target.closest('.property-detail-btn');
            if (!btn) return;
            const property = propertiesById[btn.dataset.propertyId];
            if (property) showPropertyDetail(property);
        });

        await Promise.all([renderOffices(), renderApartments()]);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
