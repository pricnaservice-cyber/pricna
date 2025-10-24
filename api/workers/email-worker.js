/**
 * Email service pro Cloudflare Workers
 * Používá MailTrap API místo SMTP
 */

// HTML šablony
const reservationConfirmationTemplate = (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #2563eb; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Potvrzení rezervace</h1>
        </div>
        <div class="content">
            <p>Dobrý den <strong>${data.name}</strong>,</p>
            <p>Děkujeme za Vaši rezervaci sdílené kanceláře.</p>
            
            <div class="info-box">
                <h3>📅 Detaily rezervace</h3>
                <p><strong>Datum:</strong> ${data.date}</p>
                <p><strong>Čas:</strong> ${data.time}</p>
                <p><strong>Délka:</strong> ${data.duration} hodin</p>
                <p><strong>Celková cena:</strong> ${data.totalPrice} Kč</p>
            </div>
            
            <p><strong>📍 Kde nás najdete:</strong></p>
            <p>Příčná 1, 736 01 Havířov - Město</p>
            <p><strong>📞 Telefon:</strong> +420 608 429 100</p>
            
            <p>Těšíme se na Vaši návštěvu!</p>
        </div>
        <div class="footer">
            <p><strong>Příčná Offices s.r.o.</strong></p>
            <p>📧 rezervace@pricna.cz | 📞 +420 608 429 100</p>
        </div>
    </div>
</body>
</html>
`;

const inquiryConfirmationTemplate = (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✉️ Děkujeme za Váš zájem</h1>
        </div>
        <div class="content">
            <p>Dobrý den <strong>${data.name}</strong>,</p>
            <p>Děkujeme za Vaši zprávu. Brzy se Vám ozveme s odpovědí.</p>
            
            <p><strong>📧 Email:</strong> info@pricna.cz</p>
            <p><strong>📞 Telefon:</strong> +420 608 429 100</p>
        </div>
        <div class="footer">
            <p><strong>Příčná Offices s.r.o.</strong></p>
            <p>📧 info@pricna.cz | 📞 +420 608 429 100</p>
        </div>
    </div>
</body>
</html>
`;

// Odeslání emailu přes MailTrap API
async function sendEmail(env, to, subject, html, from) {
  const apiUrl = `https://send.api.mailtrap.io/api/send`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.MAILTRAP_PASS}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: { email: from, name: 'Příčná Offices' },
      to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
      subject,
      html
    })
  });

  if (!response.ok) {
    throw new Error(`MailTrap API error: ${response.status}`);
  }

  return await response.json();
}

export async function sendReservationEmails(reservation, env) {
  // Email #1: Potvrzení pro klienta
  await sendEmail(
    env,
    reservation.email,
    'Potvrzení rezervace - Sdílené kanceláře Příčná',
    reservationConfirmationTemplate(reservation),
    env.EMAIL_RESERVATIONS
  );

  // Email #2: Notifikace pro recepci a majitele
  await sendEmail(
    env,
    [env.EMAIL_RESERVATIONS, env.EMAIL_OWNER],
    `🔔 Nová rezervace #${reservation.id} - ${reservation.date}`,
    `<h2>Nová rezervace</h2>
     <p><strong>Jméno:</strong> ${reservation.name}</p>
     <p><strong>Email:</strong> ${reservation.email}</p>
     <p><strong>Telefon:</strong> ${reservation.phone || 'N/A'}</p>
     <p><strong>Datum:</strong> ${reservation.date}</p>
     <p><strong>Čas:</strong> ${reservation.time}</p>
     <p><strong>Cena:</strong> ${reservation.totalPrice} Kč</p>`,
    env.EMAIL_RESERVATIONS
  );
}

export async function sendInquiryEmails(inquiry, env) {
  // Email #1: Potvrzení pro klienta
  await sendEmail(
    env,
    inquiry.email,
    'Děkujeme za Váš zájem - Příčná Offices',
    inquiryConfirmationTemplate(inquiry),
    env.EMAIL_INFO
  );

  // Email #2: Notifikace pro info a majitele
  const typeLabels = {
    'contact': 'Kontaktní formulář',
    'apartment': 'Poptávka - Byt',
    'office': 'Poptávka - Kancelář'
  };

  await sendEmail(
    env,
    [env.EMAIL_INFO, env.EMAIL_OWNER],
    `${typeLabels[inquiry.type]} - ${inquiry.name}`,
    `<h2>${typeLabels[inquiry.type]}</h2>
     <p><strong>Jméno:</strong> ${inquiry.name}</p>
     <p><strong>Email:</strong> ${inquiry.email}</p>
     <p><strong>Telefon:</strong> ${inquiry.phone || 'N/A'}</p>
     <p><strong>Zpráva:</strong> ${inquiry.message || 'N/A'}</p>`,
    env.EMAIL_INFO
  );
}
