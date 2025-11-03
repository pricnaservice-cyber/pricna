// Office details data
const officesData = {
    // Příčná 1
    'pricna1-15': {
        title: 'Kancelář 15 m²',
        building: 'Příčná 1',
        location: 'Příčná 1, Havířov - Město',
        size: '15 m²',
        capacity: 'Ideální pro 1-2 osoby',
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
        description: 'Nabízíme k pronájmu útulnou kancelář o velikosti 30 m², ideální pro dvě až čtyři osoby. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Kancelář je světlá, čistá a připravená k okamžitému nastěhování.',
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
        description: 'Nabízíme k pronájmu útulnou kancelář o velikosti 30 m², ideální pro dvě až čtyři osoby. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Kancelář je světlá, čistá a připravená k okamžitému nastěhování.',
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
        description: 'Nabízíme k pronájmu útulnou kancelář o velikosti 15 m², ideální pro jednu až dvě osoby. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Kancelář je světlá, čistá a připravená k okamžitému nastěhování.',
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
        description: 'Nabízíme k pronájmu zrekonstruované prostory o velikosti 120 m² vhodné pro menší až střední firmy. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Možnost výběru Vámi preferované podlahové krytiny.',
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

// Modal functionality - wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('office-modal');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.querySelector('.modal-close');

    if (!modal || !modalBody || !closeBtn) {
        console.error('Modal elements not found');
        return;
    }

    // Open modal
    document.querySelectorAll('.office-detail-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const officeId = this.getAttribute('data-office');
            const office = officesData[officeId];
            
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
});

// Show office details
function showOfficeDetails(office, modalBody) {
    const featuresHTML = office.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('');
    
    modalBody.innerHTML = `
        <h2>${office.title}</h2>
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
        </div>
        
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
                <button type="submit" class="btn btn-primary">Odeslat poptávku</button>
            </form>
        </div>
    `;
}

// Handle inquiry form submission
async function handleInquiry(event, officeTitle) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
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
