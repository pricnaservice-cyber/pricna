// Apartment details data
const apartmentsData = {
    'apt-1': {
        title: 'Byt 1+kk',
        location: 'Příčná, Havířov',
        size: '35 m²',
        price: '15 000 Kč/měsíc',
        deposit: '15 000 Kč',
        utilities: '3 000 Kč/měsíc',
        description: 'Útulný byt 1+kk ideální pro jednotlivce. Kompletně zařízený s moderním nábytkem. V klidné části budovy s výhledem do dvora.',
        images: [
            'images/Byty/byt_11_kuchyne.JPG',
            'images/Byty/byt_11_koupelna.JPG'
        ],
        features: [
            'Plně zařízený',
            'Pračka',
            'Lednice s mrazákem',
            'Varná deska a trouba',
            'Rychlá internetová přípojka',
            'Sklep'
        ],
        available: 'Ihned'
    },
    'apt-2': {
        title: 'Byt 2+kk',
        location: 'Příčná, Havířov',
        size: '50 m²',
        price: '20 000 Kč/měsíc',
        deposit: '20 000 Kč',
        utilities: '3 500 Kč/měsíc',
        description: 'Prostorný byt 2+kk s oddělenou ložnicí. Moderně zařízený, s balkonem. Perfektní pro páry nebo jednotlivce hledající více prostoru.',
        features: [
            'Plně zařízený',
            'Balkon',
            'Pračka a sušička',
            'Myčka nádobí',
            'Vestavěné skříně',
            'Rychlá internetová přípojka',
            'Sklep'
        ],
        available: 'Od 1.11.2025'
    }
};

// Modal functionality
const modal = document.getElementById('apartment-modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.modal-close');

// Open modal
document.querySelectorAll('.apartment-detail-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const apartmentId = this.getAttribute('data-apartment');
        const apartment = apartmentsData[apartmentId];
        
        if (apartment) {
            showApartmentDetails(apartment);
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

// Show apartment details
function showApartmentDetails(apartment) {
    const featuresHTML = apartment.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('');
    
    // Generate images gallery HTML if images exist
    const imagesHTML = apartment.images ? `
        <div class="modal-images-gallery">
            ${apartment.images.map(img => `<img src="${img}" alt="${apartment.title}" class="apartment-image">`).join('')}
        </div>
    ` : '';
    
    modalBody.innerHTML = `
        <h2>${apartment.title}</h2>
        ${imagesHTML}
        <div class="modal-apartment-details">
            <div class="detail-item">
                <i class="fas fa-map-marker-alt"></i>
                <strong>Adresa:</strong> ${apartment.location}
            </div>
            <div class="detail-item">
                <i class="fas fa-ruler-combined"></i>
                <strong>Velikost:</strong> ${apartment.size}
            </div>
            <div class="detail-item">
                <i class="fas fa-euro-sign"></i>
                <strong>Nájem:</strong> ${apartment.price}
            </div>
            <div class="detail-item">
                <i class="fas fa-shield-alt"></i>
                <strong>Kauce:</strong> ${apartment.deposit}
            </div>
            <div class="detail-item">
                <i class="fas fa-bolt"></i>
                <strong>Služby:</strong> ${apartment.utilities}
            </div>
            <div class="detail-item">
                <i class="fas fa-calendar-check"></i>
                <strong>Dostupnost:</strong> ${apartment.available}
            </div>
        </div>
        
        <div class="modal-description">
            <h3>Popis</h3>
            <p>${apartment.description}</p>
        </div>
        
        <div class="modal-features">
            <h3>Vybavení</h3>
            <ul>${featuresHTML}</ul>
        </div>
        
        <div class="modal-contact-form">
            <h3>Mám zájem o tento byt</h3>
            <form class="inquiry-form" onsubmit="handleInquiry(event, '${apartment.title}')">
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
async function handleInquiry(event, apartmentTitle) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const inquiryData = {
        type: 'apartment',
        itemName: apartmentTitle,
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        message: formData.get('message') || `Mám zájem o ${apartmentTitle}`
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
        alert(`Děkujeme za váš zájem o ${apartmentTitle}!\n\nVaše poptávka byla odeslána a potvrzení jsme vám zaslali na email. Ozveme se vám co nejdříve.`);
        modal.style.display = 'none';
        document.body.style.overflow = '';
    } else {
        alert('Chyba při odesílání poptávky: ' + (result.error || 'Zkuste to prosím později'));
    }
}

// Image lightbox functionality
let currentImageIndex = 0;
let galleryImages = [];

function setupImageLightbox() {
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
        
        // Close lightbox on click
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
    
    // Get all gallery images
    galleryImages = Array.from(document.querySelectorAll('.modal-images-gallery img'));
    
    // Add click handlers to all gallery images
    galleryImages.forEach((img, index) => {
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

// Update showApartmentDetails to setup lightbox after rendering
const originalShowApartmentDetails = showApartmentDetails;
showApartmentDetails = function(apartment) {
    originalShowApartmentDetails(apartment);
    // Setup lightbox after images are rendered
    setTimeout(setupImageLightbox, 100);
};
