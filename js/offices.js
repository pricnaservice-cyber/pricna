// Office details data
const officesData = {
    // Příčná 1
    'pricna1-15': {
        title: 'Kancelář 15 m²',
        building: 'Příčná 1',
        location: 'Příčná 1, Havířov - Město',
        size: '15 m²',
        capacity: 'Ideální pro 1-2 osoby',
        price: '2 300 Kč/měsíc',
        utilities: '2 500 Kč/měsíc',
        deposit: '10 000 Kč',
        vatNote: 'Příčná Offices s.r.o. je plátce DPH - uvedené ceny jsou bez DPH',
        description: 'Nabízíme k pronájmu útulnou kancelář o velikosti 15 m², ideální pro jednu až dvě osoby. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Kancelář je světlá, čistá a připravená k okamžitému nastěhování.',
        features: [
            'Recepce v budově',
            'Klidné a příjemné pracovní prostředí',
            'Sdílené sociální zázemí a kuchyňka',
            'Výborná dostupnost – MHD i parkování přímo u objektu',
            'Nízké provozní náklady',
            'Možnost okamžitého nastěhování'
        ]
    },
    'pricna1-30': {
        title: 'Kancelář 30 m²',
        building: 'Příčná 1',
        location: 'Příčná 1, Havířov - Město',
        size: '30 m²',
        capacity: 'Ideální pro 2-4 osoby',
        price: '4 600 Kč/měsíc',
        utilities: '5 000 Kč/měsíc',
        deposit: '20 000 Kč',
        vatNote: 'Příčná Offices s.r.o. je plátce DPH - uvedené ceny jsou bez DPH',
        description: 'Nabízíme k pronájmu útulnou kancelář o velikosti 30 m², ideální pro dvě až čtyři osoby. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Kancelář je světlá, čistá a připravená k okamžitému nastěhování.',
        images: [
            'images/kancelar_pricna/pricna_30_1.JPG',
            'images/kancelar_pricna/pricna_30_2.JPG',
            'images/kancelar_pricna/pricna_30_3.JPG',
            'images/kancelar_pricna/Pricna_30_4.JPG'
        ],
        features: [
            'Recepce v budově',
            'Klidné a příjemné pracovní prostředí',
            'Sdílené sociální zázemí a kuchyňka',
            'Výborná dostupnost – MHD i parkování přímo u objektu',
            'Nízké provozní náklady',
            'Možnost okamžitého nastěhování'
        ]
    },
    'pricna1-45': {
        title: 'Kancelář 45 m²',
        building: 'Příčná 1',
        location: 'Příčná 1, Havířov - Město',
        size: '45 m²',
        capacity: 'Pro menší firmu nebo tým',
        price: '6 900 Kč/měsíc',
        utilities: '7 500 Kč/měsíc',
        deposit: '25 000 Kč',
        vatNote: 'Příčná Offices s.r.o. je plátce DPH - uvedené ceny jsou bez DPH',
        description: 'Nabízíme k pronájmu útulnou kancelář o velikosti 45 m², ideální pro menší firmu nebo tým lidí. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Kancelář je světlá, čistá a připravená k okamžitému nastěhování.',
        features: [
            'Recepce v budově',
            'Klidné a příjemné pracovní prostředí',
            'Sdílené sociální zázemí a kuchyňka',
            'Výborná dostupnost – MHD i parkování přímo u objektu',
            'Nízké provozní náklady',
            'Možnost okamžitého nastěhování'
        ]
    },
    // Příčná 2
    'pricna2-15': {
        title: 'Kancelář 15 m²',
        building: 'Příčná 2',
        location: 'Příčná 2, Havířov - Město',
        size: '15 m²',
        capacity: 'Ideální pro 1-2 osoby',
        price: '2 500 Kč/měsíc',
        utilities: '2 750 Kč/měsíc',
        deposit: '10 000 Kč',
        vatNote: 'Příčná Apartments s.r.o. je neplátce DPH - uvedené ceny jsou s DPH',
        description: 'Nabízíme k pronájmu útulnou kancelář o velikosti 15 m², ideální pro jednu až dvě osoby. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Kancelář je světlá, čistá a připravená k okamžitému nastěhování.',
        features: [
            'Možnost využití recepce ve vedlejší budově',
            'Možnost instalace umyvadla',
            'Klidné a příjemné pracovní prostředí',
            'Sdílené sociální zázemí a kuchyňka',
            'Výborná dostupnost – MHD i parkování přímo u objektu',
            'Nízké provozní náklady',
            'Možnost okamžitého nastěhování'
        ]
    },
    'pricna2-30': {
        title: 'Kancelář 30 m²',
        building: 'Příčná 2',
        location: 'Příčná 2, Havířov - Město',
        size: '30 m²',
        capacity: 'Ideální pro 2-4 osoby',
        price: '5 000 Kč/měsíc',
        utilities: '5 500 Kč/měsíc',
        deposit: '20 000 Kč',
        vatNote: 'Příčná Apartments s.r.o. je neplátce DPH - uvedené ceny jsou s DPH',
        description: 'Nabízíme k pronájmu útulnou kancelář o velikosti 30 m², ideální pro dvě až čtyři osoby. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Kancelář je světlá, čistá a připravená k okamžitému nastěhování.',
        images: [
            'images/kancelar_pricna/pricna_30_1.JPG',
            'images/kancelar_pricna/pricna_30_2.JPG',
            'images/kancelar_pricna/pricna_30_3.JPG',
            'images/kancelar_pricna/Pricna_30_4.JPG'
        ],
        features: [
            'Možnost využití recepce ve vedlejší budově',
            'Možnost instalace umyvadla',
            'Klidné a příjemné pracovní prostředí',
            'Sdílené sociální zázemí a kuchyňka',
            'Výborná dostupnost – MHD i parkování přímo u objektu',
            'Nízké provozní náklady',
            'Možnost okamžitého nastěhování'
        ]
    },
    // Dělnická 41
    'delnicka-15': {
        title: 'Kancelář 15 m²',
        building: 'Dělnická 41',
        location: 'Dělnická 41, Havířov - Prostřední Suchá',
        size: '15 m²',
        capacity: 'Ideální pro 1-2 osoby',
        price: '2 000 Kč/měsíc',
        utilities: '2 700 Kč/měsíc',
        deposit: '10 000 Kč',
        vatNote: 'Příčná Offices s.r.o. je plátce DPH - uvedené ceny jsou bez DPH',
        description: 'Nabízíme k pronájmu útulnou kancelář o velikosti 15 m², ideální pro jednu až dvě osoby. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Kancelář je světlá, čistá a připravená k okamžitému nastěhování.',
        images: [
            'images/kancelar_delnicka/delnicka_15_1.JPG'
        ],
        features: [
            'Recepce v budově',
            'Možnost privátního parkovacího místa',
            'Klidné a příjemné pracovní prostředí',
            'Blízkost obchodního komplexu',
            'Sdílené sociální zázemí a kuchyňka',
            'Výborná dostupnost – MHD i parkování přímo u objektu',
            'Nízké provozní náklady',
            'Možnost okamžitého nastěhování'
        ]
    },
    'delnicka-120': {
        title: 'Kancelář 120 m²',
        building: 'Dělnická 41',
        location: 'Dělnická 41, Havířov - Prostřední Suchá',
        size: '120 m²',
        capacity: 'Pro menší až střední firmy',
        price: '20 000 Kč/měsíc',
        utilities: '21 600 Kč/měsíc',
        deposit: '80 000 Kč',
        vatNote: 'Příčná Offices s.r.o. je plátce DPH - uvedené ceny jsou bez DPH',
        description: 'Nabízíme k pronájmu zrekonstruované prostory o velikosti 120 m² vhodné pro menší až střední firmy. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Možnost výběru Vámi preferované podlahové krytiny.',
        images: [
            'images/kancelar_delnicka/delnicka_120_1.JPG',
            'images/kancelar_delnicka/delnicka_120_2.JPG'
        ],
        features: [
            'Recepce v budově',
            'Možnost privátního parkovacího místa',
            'Klidné a příjemné pracovní prostředí',
            'Blízkost obchodního komplexu',
            'Sdílené sociální zázemí a kuchyňka',
            'Výborná dostupnost – MHD i parkování přímo u objektu',
            'Nízké provozní náklady',
            'Možnost výběru podlahové krytiny'
        ]
    }
};

// Modal functionality - initialize immediately or when DOM is ready
function initializeOfficeModal() {
    const modal = document.getElementById('office-modal');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.querySelector('.modal-close');

    if (!modal || !modalBody || !closeBtn) {
        console.error('Modal elements not found');
        return;
    }

    // Open modal
    document.querySelectorAll('.office-detail-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const officeId = this.getAttribute('data-office');
            const office = officesData[officeId];
            
            console.log('Clicked office:', officeId, office);
            
            if (office) {
                showOfficeDetails(office, modalBody);
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            } else {
                console.error('Office data not found for:', officeId);
            }
        });
    });

    // Close modal
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    });

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
    
    console.log('Office modal initialized');
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOfficeModal);
} else {
    // DOM is already loaded, initialize immediately
    initializeOfficeModal();
}

// Show office details
function showOfficeDetails(office, modalBody) {
    const featuresHTML = office.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('');
    
    // Generate images gallery HTML if images exist
    const imagesHTML = office.images && office.images.length > 0 ? `
        <div class="modal-images-gallery">
            ${office.images.map(img => `<img src="${img}" alt="${office.title}" class="office-image">`).join('')}
        </div>
    ` : '';
    
    modalBody.innerHTML = `
        <h2>${office.title}</h2>
        ${imagesHTML}
        <div class="modal-office-details">
            <div class="detail-item">
                <i class="fas fa-building"></i>
                <strong>Budova:</strong> ${office.building}
            </div>
            <div class="detail-item">
                <i class="fas fa-map-marker-alt"></i>
                <strong>Adresa:</strong> ${office.location}
            </div>
            <div class="detail-item">
                <i class="fas fa-ruler-combined"></i>
                <strong>Velikost:</strong> ${office.size}
            </div>
            <div class="detail-item">
                <i class="fas fa-users"></i>
                <strong>Kapacita:</strong> ${office.capacity}
            </div>
            ${office.price ? `
            <div class="detail-item">
                <i class="fas fa-euro-sign"></i>
                <strong>Nájem:</strong> ${office.price}
            </div>` : ''}
            ${office.utilities ? `
            <div class="detail-item">
                <i class="fas fa-bolt"></i>
                <strong>Služby:</strong> ${office.utilities}
            </div>` : ''}
            ${office.deposit ? `
            <div class="detail-item">
                <i class="fas fa-shield-alt"></i>
                <strong>Kauce:</strong> ${office.deposit}
            </div>` : ''}
        </div>
        
        ${office.vatNote ? `
        <div class="vat-note">
            <i class="fas fa-info-circle"></i> ${office.vatNote}
        </div>` : ''}
        
        <div class="modal-description">
            <h3>Popis</h3>
            <p>${office.description}</p>
        </div>
        
        <div class="modal-features">
            <h3>Vybavení a výhody</h3>
            <ul>${featuresHTML}</ul>
        </div>
        
        <div class="modal-contact-form">
            <h3>Mám zájem o tuto kancelář</h3>
            <form class="inquiry-form" onsubmit="handleInquiry(event, '${office.title}')">
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
                <!-- Honeypot field -->
                <div style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;">
                    <input type="text" name="website" tabindex="-1" autocomplete="off">
                </div>
                <button type="submit" class="btn btn-primary">Odeslat poptávku</button>
            </form>
        </div>
    `;
}

// Handle inquiry form submission
async function handleInquiry(event, officeTitle) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    // SPAM CHECK 1: Honeypot field
    const honeypot = formData.get('website');
    if (honeypot && honeypot.trim() !== '') {
        console.log('🚫 Spam detected in office inquiry: Honeypot field filled');
        alert('Chyba při odesílání zprávy. Zkuste to prosím později.');
        return;
    }
    
    const name = formData.get('name');
    const message = formData.get('message');
    
    // SPAM CHECK 2: Name validation
    if (name && name.length > 3) {
        const uppercaseRatio = (name.match(/[A-Z]/g) || []).length / name.length;
        if (uppercaseRatio > 0.7) {
            console.log('🚫 Spam detected: Name has unusual uppercase pattern');
            alert('Prosím zadejte platné jméno.');
            return;
        }
        
        if (name.length > 15 && !name.includes(' ')) {
            console.log('🚫 Spam detected: Name is too long without spaces');
            alert('Prosím zadejte celé jméno včetně mezery.');
            return;
        }
    }
    
    // SPAM CHECK 3: Message validation
    if (message && message.length > 10) {
        const hasRandomPattern = /^[A-Z]{15,}$/i.test(message.replace(/\s/g, ''));
        if (hasRandomPattern) {
            console.log('🚫 Spam detected: Message contains random character pattern');
            alert('Prosím zadejte smysluplnou zprávu.');
            return;
        }
    }
    
    const inquiryData = {
        type: 'office',
        itemName: officeTitle,
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        message: formData.get('message') || `Mám zájem o ${officeTitle}`
    };
    
    // Disable submit button
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Odesílání...';
    
    // Send to backend API
    const result = await API.createInquiry(inquiryData);
    
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    
    if (result.success) {
        alert(`Děkujeme za váš zájem o ${officeTitle}!\n\nVaše poptávka byla odeslána a potvrzení jsme vám zaslali na email. Ozveme se vám co nejdříve.`);
        modal.style.display = 'none';
        document.body.style.overflow = '';
    } else {
        alert('Chyba při odesílání poptávky: ' + (result.error || 'Zkuste to prosím později'));
    }
}
