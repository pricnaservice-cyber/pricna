const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Vytvoření transporteru pro MailTrap
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.MAILTRAP_PORT) || 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});

// Načtení HTML šablony
function loadTemplate(templateName) {
  const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
  return fs.readFileSync(templatePath, 'utf-8');
}

// Jednoduchá šablonová funkce (replacuje {{variable}} s hodnotami)
function renderTemplate(template, data) {
  let rendered = template;
  
  // Nahrazení základních proměnných
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, value || '');
  }
  
  // Zpracování podmíněných bloků {{#if variable}}...{{/if}}
  rendered = rendered.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, variable, content) => {
    return data[variable] ? content : '';
  });
  
  return rendered;
}

// Odeslání potvrzení rezervace klientovi
async function sendReservationConfirmation(reservationData) {
  try {
    const template = loadTemplate('reservation-confirmation');
    
    const emailData = {
      name: reservationData.name,
      date: reservationData.date,
      time: reservationData.time,
      duration: reservationData.duration,
      email: reservationData.email,
      phone: reservationData.phone,
      company: reservationData.company || '',
      totalPrice: reservationData.totalPrice
    };
    
    const html = renderTemplate(template, emailData);
    
    const mailOptions = {
      from: '"Příčná Offices - Rezervace" <noreply@pricna.cz>',
      to: reservationData.email,
      subject: 'Potvrzení rezervace - Sdílená kancelář Příčná',
      html: html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Potvrzení rezervace odesláno:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Chyba při odesílání potvrzení rezervace:', error);
    throw error;
  }
}

// Odeslání notifikace na recepci o nové rezervaci
async function sendReservationNotification(reservationData) {
  try {
    const template = loadTemplate('reservation-notification');
    
    const emailData = {
      reservationId: reservationData.id,
      name: reservationData.name,
      date: reservationData.date,
      time: reservationData.time,
      duration: reservationData.duration,
      email: reservationData.email,
      phone: reservationData.phone,
      company: reservationData.company || '',
      message: reservationData.message || '',
      totalPrice: reservationData.totalPrice
    };
    
    const html = renderTemplate(template, emailData);
    
    // Notifikace přijde na j.stachovsky@gmail.com a pricna.apartments@gmail.com
    const recipients = [
      'j.stachovsky@gmail.com',
      'pricna.apartments@gmail.com'
    ].join(', ');
    
    const mailOptions = {
      from: '"Příčná Offices - Rezervační systém" <noreply@pricna.cz>',
      to: recipients,
      subject: `🔔 Nová rezervace #${reservationData.id} - ${reservationData.date}`,
      html: html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Notifikace o rezervaci odeslána:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Chyba při odesílání notifikace o rezervaci:', error);
    throw error;
  }
}

// Odeslání potvrzení poptávky klientovi
async function sendInquiryConfirmation(inquiryData) {
  try {
    const template = loadTemplate('inquiry-confirmation');
    
    const emailData = {
      name: inquiryData.name,
      itemName: inquiryData.itemName || ''
    };
    
    const html = renderTemplate(template, emailData);
    
    const mailOptions = {
      from: '"Příčná Offices & Apartments" <noreply@pricna.cz>',
      to: inquiryData.email,
      subject: 'Děkujeme za Váš zájem - Příčná Offices & Apartments',
      html: html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Potvrzení poptávky odesláno:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Chyba při odesílání potvrzení poptávky:', error);
    throw error;
  }
}

// Odeslání notifikace na recepci o nové poptávce
async function sendInquiryNotification(inquiryData) {
  try {
    const template = loadTemplate('inquiry-notification');
    
    // Určení typu poptávky
    const typeLabels = {
      'contact': 'Kontaktní formulář',
      'apartment': 'Poptávka - Byt',
      'office': 'Poptávka - Kancelář'
    };
    
    const emailData = {
      typeLabel: typeLabels[inquiryData.type] || 'Poptávka',
      name: inquiryData.name,
      email: inquiryData.email,
      phone: inquiryData.phone || '',
      service: inquiryData.service || '',
      itemName: inquiryData.itemName || '',
      message: inquiryData.message || '',
      timestamp: new Date().toLocaleString('cs-CZ', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    };
    
    const html = renderTemplate(template, emailData);
    
    // Notifikace přijde na j.stachovsky@gmail.com a pricna.apartments@gmail.com
    const recipients = [
      'j.stachovsky@gmail.com',
      'pricna.apartments@gmail.com'
    ].join(', ');
    
    const mailOptions = {
      from: '"Příčná Offices - Formuláře" <noreply@pricna.cz>',
      to: recipients,
      subject: `${typeLabels[inquiryData.type]} - ${inquiryData.name}`,
      html: html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Notifikace o poptávce odeslána:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Chyba při odesílání notifikace o poptávce:', error);
    throw error;
  }
}

// Test připojení k SMTP serveru
async function testConnection() {
  try {
    await transporter.verify();
    console.log('✓ SMTP server je připraven k odesílání emailů');
    return true;
  } catch (error) {
    console.error('✗ Chyba připojení k SMTP serveru:', error);
    return false;
  }
}

module.exports = {
  sendReservationConfirmation,
  sendReservationNotification,
  sendInquiryConfirmation,
  sendInquiryNotification,
  testConnection
};
