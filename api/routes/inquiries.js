const express = require('express');
const router = express.Router();
const { inquiries } = require('../database/db');
const emailService = require('../emails/emailService');

// Získání všech poptávek (pro admin)
router.get('/', (req, res) => {
  try {
    const allInquiries = inquiries.getAll();
    res.json({ success: true, data: allInquiries });
  } catch (error) {
    console.error('Chyba při získávání poptávek:', error);
    res.status(500).json({ success: false, error: 'Chyba serveru' });
  }
});

// Získání poptávek podle typu
router.get('/type/:type', (req, res) => {
  try {
    const { type } = req.params;
    const typeInquiries = inquiries.getByType(type);
    res.json({ success: true, data: typeInquiries });
  } catch (error) {
    console.error('Chyba při získávání poptávek podle typu:', error);
    res.status(500).json({ success: false, error: 'Chyba serveru' });
  }
});

// Vytvoření nové poptávky
router.post('/', async (req, res) => {
  try {
    const { type, itemName, name, email, phone, service, message } = req.body;
    
    // Validace
    if (!type || !name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Chybějící povinná pole (type, name, email, message)' 
      });
    }
    
    // Validace typu
    const validTypes = ['contact', 'apartment', 'office'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Neplatný typ poptávky' 
      });
    }
    
    // Vytvoření poptávky
    const inquiryId = inquiries.create({
      type,
      item_name: itemName,
      name,
      email,
      phone,
      service,
      message
    });
    
    const emailData = {
      type,
      itemName,
      name,
      email,
      phone,
      service,
      message
    };
    
    // Odeslání emailů
    try {
      await Promise.all([
        emailService.sendInquiryConfirmation(emailData),
        emailService.sendInquiryNotification(emailData)
      ]);
    } catch (emailError) {
      console.error('Chyba při odesílání emailů:', emailError);
      // Pokračujeme i když selže email - poptávka je vytvořena
    }
    
    const newInquiry = inquiries.getById(inquiryId);
    
    res.status(201).json({ 
      success: true, 
      data: newInquiry,
      message: 'Poptávka byla úspěšně odeslána'
    });
    
  } catch (error) {
    console.error('Chyba při vytváření poptávky:', error);
    res.status(500).json({ success: false, error: 'Chyba serveru' });
  }
});

module.exports = router;
