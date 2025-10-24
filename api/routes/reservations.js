const express = require('express');
const router = express.Router();
const { reservations } = require('../database/db');
const emailService = require('../emails/emailService');

// Získání všech rezervací (pro admin)
router.get('/', (req, res) => {
  try {
    const allReservations = reservations.getAll();
    res.json({ success: true, data: allReservations });
  } catch (error) {
    console.error('Chyba při získávání rezervací:', error);
    res.status(500).json({ success: false, error: 'Chyba serveru' });
  }
});

// Získání rezervací podle data
router.get('/by-date/:date', (req, res) => {
  try {
    const { date } = req.params;
    const dateReservations = reservations.getByDate(date);
    res.json({ success: true, data: dateReservations });
  } catch (error) {
    console.error('Chyba při získávání rezervací pro datum:', error);
    res.status(500).json({ success: false, error: 'Chyba serveru' });
  }
});

// Získání rezervací v rozmezí dat
router.get('/range', (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ 
        success: false, 
        error: 'Vyžadovány parametry start a end' 
      });
    }
    
    const rangeReservations = reservations.getByDateRange(start, end);
    res.json({ success: true, data: rangeReservations });
  } catch (error) {
    console.error('Chyba při získávání rezervací v rozmezí:', error);
    res.status(500).json({ success: false, error: 'Chyba serveru' });
  }
});

// Kontrola dostupnosti časových slotů
router.post('/check-availability', (req, res) => {
  try {
    const { date, timeSlots } = req.body;
    
    if (!date || !timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Vyžadovány parametry date a timeSlots (pole)' 
      });
    }
    
    const availability = reservations.checkAvailability(date, timeSlots);
    res.json({ success: true, data: availability });
  } catch (error) {
    console.error('Chyba při kontrole dostupnosti:', error);
    res.status(500).json({ success: false, error: 'Chyba serveru' });
  }
});

// Vytvoření nové rezervace
router.post('/', async (req, res) => {
  try {
    const { date, timeSlots, name, email, phone, company, message, totalPrice } = req.body;
    
    // Validace
    if (!date || !timeSlots || !name || !email || !phone || !totalPrice) {
      return res.status(400).json({ 
        success: false, 
        error: 'Chybějící povinná pole' 
      });
    }
    
    // Kontrola dostupnosti
    const availability = reservations.checkAvailability(date, timeSlots);
    if (!availability.available) {
      return res.status(409).json({ 
        success: false, 
        error: 'Některé časové sloty již nejsou k dispozici',
        bookedSlots: availability.bookedSlots
      });
    }
    
    // Vytvoření rezervace
    const reservationId = reservations.create({
      date,
      time_slots: timeSlots,
      name,
      email,
      phone,
      company,
      message,
      total_price: totalPrice
    });
    
    // Získání vytvořené rezervace pro emaily
    const newReservation = reservations.getById(reservationId);
    
    // Formátování dat pro emaily
    const startTime = timeSlots[0];
    const endTimeIndex = timeSlots.length;
    const allTimeSlots = [
      '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
    ];
    const endTime = allTimeSlots[allTimeSlots.indexOf(startTime) + timeSlots.length] || '19:00';
    
    const duration = timeSlots.length;
    const hoursText = duration === 1 ? 'hodina' : duration < 5 ? 'hodiny' : 'hodin';
    
    const emailData = {
      id: reservationId,
      name,
      email,
      phone,
      company,
      message,
      date: new Date(date).toLocaleDateString('cs-CZ', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: `${startTime} - ${endTime}`,
      duration: `${duration} ${hoursText}`,
      totalPrice: `${totalPrice}`
    };
    
    // Odeslání emailů
    try {
      await Promise.all([
        emailService.sendReservationConfirmation(emailData),
        emailService.sendReservationNotification(emailData)
      ]);
    } catch (emailError) {
      console.error('Chyba při odesílání emailů:', emailError);
      // Pokračujeme i když selže email - rezervace je vytvořena
    }
    
    res.status(201).json({ 
      success: true, 
      data: newReservation,
      message: 'Rezervace byla úspěšně vytvořena'
    });
    
  } catch (error) {
    console.error('Chyba při vytváření rezervace:', error);
    res.status(500).json({ success: false, error: 'Chyba serveru' });
  }
});

// Aktualizace rezervace (pro admin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const success = reservations.update(id, updateData);
    
    if (success) {
      const updatedReservation = reservations.getById(id);
      res.json({ 
        success: true, 
        data: updatedReservation,
        message: 'Rezervace byla aktualizována'
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Rezervace nenalezena' 
      });
    }
  } catch (error) {
    console.error('Chyba při aktualizaci rezervace:', error);
    res.status(500).json({ success: false, error: 'Chyba serveru' });
  }
});

// Zrušení rezervace
router.post('/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const success = reservations.cancel(id);
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Rezervace byla zrušena'
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Rezervace nenalezena' 
      });
    }
  } catch (error) {
    console.error('Chyba při rušení rezervace:', error);
    res.status(500).json({ success: false, error: 'Chyba serveru' });
  }
});

// Smazání rezervace (pro admin)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = reservations.delete(id);
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Rezervace byla smazána'
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Rezervace nenalezena' 
      });
    }
  } catch (error) {
    console.error('Chyba při mazání rezervace:', error);
    res.status(500).json({ success: false, error: 'Chyba serveru' });
  }
});

module.exports = router;
