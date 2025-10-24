// Office details data
const officesData = {
    'pricna1-101': {
        title: 'Kancelář 101',
        building: 'Příčná 1',
        location: 'Příčná 1, Havířov - Město',
        size: '45 m²',
        price: '18 000 Kč/měsíc',
        description: 'Moderní kancelář v Havířově. Ideální pro malý tým nebo freelancery. Plně vybavená, s klimatizací a vysokorychlostním internetem.',
        features: [
            'Klimatizace',
            'Vysokorychlostní internet',
            'Vlastní kuchyňka',
            'Parkovací místo (za příplatek)',
            'Recepce v budově'
        ]
    },
    'pricna1-102': {
        title: 'Kancelář 102',
        building: 'Příčná 1',
        location: 'Příčná 1, Havířov - Město',
        size: '60 m²',
        price: '24 000 Kč/měsíc',
        description: 'Prostorná kancelář s výhledem na ulici. Vhodná pro menší firmu nebo tým. Moderní vybavení a příjemné pracovní prostředí.',
        features: [
            'Klimatizace',
            'Vysokorychlostní internet',
            'Vlastní sociální zařízení',
            'Parkovací místo (za příplatek)',
            'Recepce v budově',
            'Výhled na ulici'
        ]
    },
    'pricna1-201': {
        title: 'Kancelář 201',
        building: 'Příčná 1',
        location: 'Příčná 1, Havířov - Město',
        size: '80 m²',
        price: '32 000 Kč/měsíc',
        description: 'Velká kancelář na druhém patře s výborným osvětlením. Ideální pro větší tým nebo firmu. Možnost úpravy dispozice podle potřeb.',
        features: [
            'Klimatizace',
            'Vysokorychlostní internet',
            'Vlastní kuchyňka a sociální zařízení',
            '2 parkovací místa (za příplatek)',
            'Recepce v budově',
            'Velká okna - přirozené světlo'
        ]
    },
    'pricna2-105': {
        title: 'Kancelář 105',
        building: 'Příčná 2',
        location: 'Příčná 2, Havířov - Město',
        size: '55 m²',
        price: '22 000 Kč/měsíc',
        description: 'Kancelář v klidné části budovy. Perfektní pro firmy vyžadující soustředěné pracovní prostředí. Moderní design a vybavení.',
        features: [
            'Klimatizace',
            'Vysokorychlostní internet',
            'Sdílená kuchyňka',
            'Parkovací místo (za příplatek)',
            'Klidná část budovy'
        ]
    },
    'pricna2-203': {
        title: 'Kancelář 203',
        building: 'Příčná 2',
        location: 'Příčná 2, Havířov - Město',
        size: '70 m²',
        price: '28 000 Kč/měsíc',
        description: 'Prostorná kancelář s možností rozdělení na dvě místnosti. Vhodná pro firmy s různými odděleními nebo potřebou soukromí.',
        features: [
            'Klimatizace',
            'Vysokorychlostní internet',
            'Možnost rozdělení prostoru',
            'Vlastní sociální zařízení',
            'Parkovací místo (za příplatek)',
            'Balkon'
        ]
    },
    'delnicka-301': {
        title: 'Kancelář 301',
        building: 'Dělnická 41',
        location: 'Dělnická 41, Havířov - Podlesí',
        size: '50 m²',
        price: '20 000 Kč/měsíc',
        description: 'Moderní kancelář v Havířově. Skvělé dopravní spojení, v okolí kavárny a restaurace. Ideální pro kreativní týmy.',
        features: [
            'Klimatizace',
            'Vysokorychlostní internet',
            'Sdílená kuchyňka',
            'Recepce v budově',
            'Výborné dopravní spojení'
        ]
    },
    'delnicka-302': {
        title: 'Kancelář 302',
        building: 'Dělnická 41',
        location: 'Dělnická 41, Havířov - Podlesí',
        size: '90 m²',
        price: '36 000 Kč/měsíc',
        description: 'Velká open-space kancelář s moderním designem. Perfektní pro větší týmy nebo start-upy. Flexibilní uspořádání pracovních míst.',
        features: [
            'Klimatizace',
            'Vysokorychlostní internet',
            'Open-space design',
            'Vlastní kuchyňka a sociální zařízení',
            '2 parkovací místa (za příplatek)',
            'Recepce v budově',
            'Moderní design'
        ]
    },
    'delnicka-401': {
        title: 'Kancelář 401',
        building: 'Dělnická 41',
        location: 'Dělnická 41, Havířov - Podlesí',
        size: '120 m²',
        price: '48 000 Kč/měsíc',
        description: 'Prémiová kancelář na nejvyšším patře s krásným výhledem. Ideální pro etablované firmy. Reprezentativní prostory s možností úprav.',
        features: [
            'Klimatizace',
            'Vysokorychlostní internet',
            'Krásný výhled',
            'Vlastní kuchyňka a 2x sociální zařízení',
            '3 parkovací místa (za příplatek)',
            'Recepce v budově',
            'Možnost úprav interiéru',
            'Terasa'
        ]
    }
};

// Modal functionality
const modal = document.getElementById('office-modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.modal-close');

// Open modal
document.querySelectorAll('.office-detail-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const officeId = this.getAttribute('data-office');
        const office = officesData[officeId];
        
        if (office) {
            showOfficeDetails(office);
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
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

// Show office details
function showOfficeDetails(office) {
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
                <i class="fas fa-euro-sign"></i>
                <strong>Cena:</strong> ${office.price}
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
