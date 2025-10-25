var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker-full.js
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}
__name(errorResponse, "errorResponse");
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, hashedPassword, salt) {
  const hash = await hashPassword(password, salt);
  return hash === hashedPassword;
}
__name(verifyPassword, "verifyPassword");
async function signJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encoder = new TextEncoder();
  const headerBase64 = btoa(JSON.stringify(header)).replace(/=/g, "");
  const payloadBase64 = btoa(JSON.stringify(payload)).replace(/=/g, "");
  const data = `${headerBase64}.${payloadBase64}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "");
  return `${data}.${signatureBase64}`;
}
__name(signJWT, "signJWT");
async function verifyJWT(token, secret) {
  try {
    const [headerBase64, payloadBase64, signatureBase64] = token.split(".");
    const data = `${headerBase64}.${payloadBase64}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signature = Uint8Array.from(atob(signatureBase64), (c) => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(data));
    if (!isValid) return null;
    const payload = JSON.parse(atob(payloadBase64));
    if (payload.exp < Math.floor(Date.now() / 1e3)) return null;
    return payload;
  } catch {
    return null;
  }
}
__name(verifyJWT, "verifyJWT");
async function requireAuth(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  return await verifyJWT(token, env.JWT_SECRET);
}
__name(requireAuth, "requireAuth");
async function sendEmail(env, to, subject, html, from) {
  const apiUrl = "https://send.api.mailtrap.io/api/send";
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.MAILTRAP_PASS}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: { email: from, name: "P\u0159\xED\u010Dn\xE1 Offices" },
      to: Array.isArray(to) ? to.map((email) => ({ email })) : [{ email: to }],
      subject,
      html
    })
  });
  return response.ok;
}
__name(sendEmail, "sendEmail");
async function sendReservationEmails(reservation, env) {
  const confirmationHtml = `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <!-- Email Container -->
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <!-- Header with Logo -->
              <tr>
                <td style="background: linear-gradient(135deg, #eabb11 0%, #d4a00f 100%); padding: 40px 30px; text-align: center;">
                  <img src="https://pricna.cz/images/pricna_logo_final.png" alt="P\u0159\xED\u010Dn\xE1 Offices" style="max-width: 200px; height: auto; margin-bottom: 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">\u2705 Potvrzen\xED rezervace</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Dobr\xFD den <strong style="color: #eabb11;">${reservation.name}</strong>,
                  </p>
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                    D\u011Bkujeme za Va\u0161i rezervaci sd\xEDlen\xE9 kancel\xE1\u0159e. T\u011B\u0161\xEDme se na Va\u0161i n\xE1v\u0161t\u011Bvu!
                  </p>
                  
                  <!-- Reservation Details Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef9e7; border-left: 4px solid #eabb11; border-radius: 8px; margin: 0 0 25px;">
                    <tr>
                      <td style="padding: 25px;">
                        <h2 style="color: #333; font-size: 20px; margin: 0 0 20px; font-weight: 600;">\u{1F4C5} Detaily rezervace</h2>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;">
                          <strong style="color: #333;">Datum:</strong> ${reservation.date}
                        </p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;">
                          <strong style="color: #333;">\u010Cas:</strong> ${reservation.time}
                        </p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;">
                          <strong style="color: #333;">D\xE9lka:</strong> ${reservation.duration} ${reservation.duration === 1 ? "hodina" : reservation.duration < 5 ? "hodiny" : "hodin"}
                        </p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;">
                          <strong style="color: #333;">Cena:</strong> <span style="color: #eabb11; font-size: 18px; font-weight: 600;">${reservation.totalPrice} K\u010D</span>
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Payment Info Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f4f8; border-left: 4px solid #7a848d; border-radius: 8px; margin: 0 0 25px;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="color: #333; font-size: 18px; margin: 0 0 12px; font-weight: 600;">\u{1F4B0} Platba a kl\xED\u010De</h3>
                        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                          Platbu a vyzvednut\xED kl\xED\u010D\u016F od kancel\xE1\u0159e pros\xEDm prove\u010Fte na recepci na adrese <strong style="color: #7a848d;">P\u0159\xED\u010Dn\xE1 1, 736 01 Hav\xED\u0159ov - M\u011Bsto</strong>.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Cancellation Info Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff8e6; border-left: 4px solid #eabb11; border-radius: 8px; margin: 0 0 30px;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="color: #333; font-size: 18px; margin: 0 0 12px; font-weight: 600;">\u2139\uFE0F Zm\u011Bna nebo zru\u0161en\xED</h3>
                        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                          Pro zm\u011Bnu nebo zru\u0161en\xED rezervace n\xE1s pros\xEDm kontaktujte telefonicky na \u010D\xEDsle <strong style="color: #eabb11;">+420 608 429 100</strong>.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Contact Information -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 2px solid #f0f0f0; padding-top: 25px; margin-top: 25px;">
                    <tr>
                      <td>
                        <p style="color: #555; font-size: 14px; line-height: 1.8; margin: 5px 0;">
                          <strong style="color: #7a848d;">\u{1F4CD} Adresa recepce:</strong> P\u0159\xED\u010Dn\xE1 1, 736 01 Hav\xED\u0159ov - M\u011Bsto
                        </p>
                        <p style="color: #555; font-size: 14px; line-height: 1.8; margin: 5px 0;">
                          <strong style="color: #7a848d;">\u{1F4DE} Telefon:</strong> +420 608 429 100
                        </p>
                        <p style="color: #555; font-size: 14px; line-height: 1.8; margin: 5px 0;">
                          <strong style="color: #7a848d;">\u{1F550} Otev\xEDrac\xED doba:</strong> Po-P\xE1: 7:00 - 19:00
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #7a848d; padding: 30px; text-align: center;">
                  <p style="color: #ffffff; font-size: 16px; margin: 0 0 10px; font-weight: 500;">
                    T\u011B\u0161\xEDme se na Va\u0161i n\xE1v\u0161t\u011Bvu!
                  </p>
                  <p style="color: #f0f0f0; font-size: 14px; margin: 0;">
                    <strong>T\xFDm P\u0159\xED\u010Dn\xE1 Offices</strong>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  await sendEmail(env, reservation.email, "Potvrzen\xED rezervace - P\u0159\xED\u010Dn\xE1 Offices", confirmationHtml, env.EMAIL_RESERVATIONS);
  const notificationHtml = `
    <h2>\u{1F514} Nov\xE1 rezervace #${reservation.id}</h2>
    <p><strong>Jm\xE9no:</strong> ${reservation.name}</p>
    <p><strong>Email:</strong> ${reservation.email}</p>
    <p><strong>Telefon:</strong> ${reservation.phone || "N/A"}</p>
    <p><strong>Datum:</strong> ${reservation.date}</p>
    <p><strong>\u010Cas:</strong> ${reservation.time}</p>
    <p><strong>Cena:</strong> ${reservation.totalPrice} K\u010D</p>
  `;
  await sendEmail(env, [env.EMAIL_RESERVATIONS, env.EMAIL_OWNER], `Nov\xE1 rezervace #${reservation.id}`, notificationHtml, env.EMAIL_RESERVATIONS);
}
__name(sendReservationEmails, "sendReservationEmails");
async function sendCancellationEmail(reservation, env) {
  const cancellationHtml = `
    <!DOCTYPE html>
    <html lang="cs">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <tr><td style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 30px; text-align: center;">
                  <img src="https://pricna.cz/images/pricna_logo_final.png" alt="P\u0159\xED\u010Dn\xE1 Offices" style="max-width: 200px; height: auto; margin-bottom: 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">\u274C Zru\u0161en\xED rezervace</h1>
                </td></tr>
              <tr><td style="padding: 40px 30px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Dobr\xFD den <strong style="color: #7a848d;">${reservation.name}</strong>,</p>
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Va\u0161e rezervace sd\xEDlen\xE9 kancel\xE1\u0159e byla zru\u0161ena.</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffe6e6; border-left: 4px solid #dc3545; border-radius: 8px; margin: 0 0 30px;">
                    <tr><td style="padding: 25px;">
                        <h2 style="color: #333; font-size: 20px; margin: 0 0 20px; font-weight: 600;">\u{1F4C5} Zru\u0161en\xE1 rezervace</h2>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Datum:</strong> ${reservation.date}</p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">\u010Cas:</strong> ${reservation.time}</p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Cena:</strong> ${reservation.totalPrice} K\u010D</p>
                      </td></tr>
                  </table>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px;">Pokud jste tuto rezervaci nezru\u0161ili Vy, nebo m\xE1te dotazy, kontaktujte n\xE1s pros\xEDm na:</p>
                  <p style="color: #333; font-size: 16px; margin: 0;"><strong style="color: #eabb11;">\u{1F4DE} +420 608 429 100</strong></p>
                </td></tr>
              <tr><td style="background-color: #7a848d; padding: 30px; text-align: center;">
                  <p style="color: #ffffff; font-size: 16px; margin: 0 0 10px; font-weight: 500;">Budeme se t\u011B\u0161it na Va\u0161i dal\u0161\xED n\xE1v\u0161t\u011Bvu!</p>
                  <p style="color: #f0f0f0; font-size: 14px; margin: 0;"><strong>T\xFDm P\u0159\xED\u010Dn\xE1 Offices</strong></p>
                </td></tr>
            </table>
          </td></tr>
      </table>
    </body>
    </html>
  `;
  await sendEmail(env, reservation.email, "Zru\u0161en\xED rezervace - P\u0159\xED\u010Dn\xE1 Offices", cancellationHtml, env.EMAIL_RESERVATIONS);
}
__name(sendCancellationEmail, "sendCancellationEmail");
async function sendInquiryEmails(inquiry, env) {
  const typeLabels = { "contact": "Kontaktn\xED formul\xE1\u0159", "apartment": "Popt\xE1vka - Byt", "office": "Popt\xE1vka - Kancel\xE1\u0159" };
  const confirmationHtml = `
    <!DOCTYPE html>
    <html lang="cs">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <tr><td style="background: linear-gradient(135deg, #eabb11 0%, #d4a00f 100%); padding: 40px 30px; text-align: center;">
                  <img src="https://pricna.cz/images/pricna_logo_final.png" alt="P\u0159\xED\u010Dn\xE1 Offices" style="max-width: 200px; height: auto; margin-bottom: 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">\u2709\uFE0F D\u011Bkujeme za V\xE1\u0161 z\xE1jem</h1>
                </td></tr>
              <tr><td style="padding: 40px 30px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Dobr\xFD den <strong style="color: #eabb11;">${inquiry.name}</strong>,</p>
                  <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">D\u011Bkujeme za Va\u0161i zpr\xE1vu. Brzy se V\xE1m ozveme a r\xE1di zodpov\xEDme v\u0161echny Va\u0161e dotazy.</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef9e7; border-left: 4px solid #eabb11; border-radius: 8px; margin: 0 0 30px;">
                    <tr><td style="padding: 25px;">
                        <h2 style="color: #333; font-size: 20px; margin: 0 0 20px; font-weight: 600;">\u{1F4DE} Kontakt</h2>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Telefon:</strong> <span style="color: #eabb11; font-weight: 600;">+420 608 429 100</span></p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Email:</strong> info@pricna.cz</p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Adresa:</strong> P\u0159\xED\u010Dn\xE1 1, 736 01 Hav\xED\u0159ov - M\u011Bsto</p>
                      </td></tr>
                  </table>
                </td></tr>
              <tr><td style="background-color: #7a848d; padding: 30px; text-align: center;">
                  <p style="color: #ffffff; font-size: 16px; margin: 0 0 10px; font-weight: 500;">T\u011B\u0161\xEDme se na setk\xE1n\xED s V\xE1mi!</p>
                  <p style="color: #f0f0f0; font-size: 14px; margin: 0;"><strong>T\xFDm P\u0159\xED\u010Dn\xE1 Offices & Apartments</strong></p>
                </td></tr>
            </table>
          </td></tr>
      </table>
    </body>
    </html>
  `;
  await sendEmail(env, inquiry.email, `D\u011Bkujeme za V\xE1\u0161 z\xE1jem - P\u0159\xED\u010Dn\xE1 Offices`, confirmationHtml, env.EMAIL_INFO);
  const notificationHtml = `
    <!DOCTYPE html>
    <html lang="cs">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <tr><td style="background: linear-gradient(135deg, #7a848d 0%, #5a646d 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">\u{1F514} ${typeLabels[inquiry.type]}</h1>
                </td></tr>
              <tr><td style="padding: 40px 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef9e7; border-left: 4px solid #eabb11; border-radius: 8px;">
                    <tr><td style="padding: 25px;">
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Jm\xE9no:</strong> ${inquiry.name}</p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Email:</strong> ${inquiry.email}</p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 8px 0;"><strong style="color: #333;">Telefon:</strong> ${inquiry.phone || "N/A"}</p>
                        <p style="color: #555; font-size: 15px; line-height: 1.8; margin: 15px 0 8px;"><strong style="color: #333;">Zpr\xE1va:</strong></p>
                        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0; padding: 15px; background-color: #ffffff; border-radius: 6px;">${inquiry.message || "N/A"}</p>
                      </td></tr>
                  </table>
                </td></tr>
            </table>
          </td></tr>
      </table>
    </body>
    </html>
  `;
  await sendEmail(env, [env.EMAIL_INFO, env.EMAIL_OWNER], `${typeLabels[inquiry.type]} - ${inquiry.name}`, notificationHtml, env.EMAIL_INFO);
}
__name(sendInquiryEmails, "sendInquiryEmails");
var worker_full_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    try {
      if (path === "/api/health" && method === "GET") {
        return jsonResponse({
          status: "OK",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          environment: "cloudflare-workers"
        });
      }
      if (path === "/api/auth/login" && method === "POST") {
        const { username, password } = await request.json();
        if (username !== env.ADMIN_USERNAME) {
          return errorResponse("Invalid credentials", 401);
        }
        const salt = "pricna-salt-2025";
        const isValid = await verifyPassword(password, env.ADMIN_PASSWORD_HASH, salt);
        if (!isValid) {
          return errorResponse("Invalid credentials", 401);
        }
        const payload = {
          username,
          iat: Math.floor(Date.now() / 1e3),
          exp: Math.floor(Date.now() / 1e3) + 24 * 60 * 60
        };
        const token = await signJWT(payload, env.JWT_SECRET);
        return jsonResponse({ success: true, token, user: { username } });
      }
      if (path === "/api/reservations/public" && method === "GET") {
        const { results } = await env.DB.prepare("SELECT id, date, time, duration, status FROM reservations WHERE status != ? ORDER BY date ASC").bind("cancelled").all();
        return jsonResponse(results);
      }
      if (path === "/api/reservations" && method === "GET") {
        const user = await requireAuth(request, env);
        if (!user) return errorResponse("Unauthorized", 401);
        const { results } = await env.DB.prepare("SELECT * FROM reservations ORDER BY date DESC, time DESC LIMIT 100").all();
        return jsonResponse(results);
      }
      if (path === "/api/reservations" && method === "POST") {
        const data = await request.json();
        if (!data.date || !data.timeSlots || !data.name || !data.email) {
          return errorResponse("Missing required fields", 400);
        }
        const timeSlots = Array.isArray(data.timeSlots) ? data.timeSlots : [data.timeSlots];
        const time = timeSlots.join(", ");
        const duration = timeSlots.length;
        const result = await env.DB.prepare(`
          INSERT INTO reservations (date, time, duration, name, email, phone, company, message, totalPrice, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `).bind(
          data.date,
          time,
          duration,
          data.name,
          data.email,
          data.phone || null,
          data.company || null,
          data.message || null,
          data.totalPrice || 0
        ).run();
        const reservationId = result.meta.last_row_id;
        const { results } = await env.DB.prepare("SELECT * FROM reservations WHERE id = ?").bind(reservationId).all();
        const reservation = results[0];
        ctx.waitUntil(sendReservationEmails(reservation, env));
        return jsonResponse({ success: true, reservation }, 201);
      }
      if (path.match(/^\/api\/reservations\/\d+$/) && method === "PUT") {
        const user = await requireAuth(request, env);
        if (!user) return errorResponse("Unauthorized", 401);
        const id = path.split("/").pop();
        const data = await request.json();
        await env.DB.prepare("UPDATE reservations SET status = ?, message = ? WHERE id = ?").bind(data.status || "pending", data.message || null, id).run();
        const { results } = await env.DB.prepare("SELECT * FROM reservations WHERE id = ?").bind(id).all();
        return jsonResponse({ success: true, reservation: results[0] });
      }
      if (path.match(/^\/api\/reservations\/\d+\/cancel$/) && method === "POST") {
        const user = await requireAuth(request, env);
        if (!user) return errorResponse("Unauthorized", 401);
        const id = path.split("/")[3];
        const { results } = await env.DB.prepare("SELECT * FROM reservations WHERE id = ?").bind(id).all();
        const reservation = results[0];
        if (!reservation) {
          return errorResponse("Reservation not found", 404);
        }
        await env.DB.prepare("UPDATE reservations SET status = ? WHERE id = ?").bind("cancelled", id).run();
        ctx.waitUntil(sendCancellationEmail(reservation, env));
        return jsonResponse({ success: true, message: "Reservation cancelled" });
      }
      if (path.match(/^\/api\/reservations\/\d+$/) && method === "DELETE") {
        const user = await requireAuth(request, env);
        if (!user) return errorResponse("Unauthorized", 401);
        const id = path.split("/").pop();
        await env.DB.prepare("DELETE FROM reservations WHERE id = ?").bind(id).run();
        return jsonResponse({ success: true, message: "Reservation deleted" });
      }
      if (path === "/api/inquiries" && method === "GET") {
        const user = await requireAuth(request, env);
        if (!user) return errorResponse("Unauthorized", 401);
        const { results } = await env.DB.prepare("SELECT * FROM inquiries ORDER BY createdAt DESC LIMIT 100").all();
        return jsonResponse(results);
      }
      if (path === "/api/inquiries" && method === "POST") {
        const data = await request.json();
        if (!data.type || !data.name || !data.email) {
          return errorResponse("Missing required fields", 400);
        }
        const result = await env.DB.prepare(`
          INSERT INTO inquiries (type, name, email, phone, service, itemName, message)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          data.type,
          data.name,
          data.email,
          data.phone || null,
          data.service || null,
          data.itemName || null,
          data.message || null
        ).run();
        const inquiryId = result.meta.last_row_id;
        const { results } = await env.DB.prepare("SELECT * FROM inquiries WHERE id = ?").bind(inquiryId).all();
        const inquiry = results[0];
        ctx.waitUntil(sendInquiryEmails(inquiry, env));
        return jsonResponse({ success: true, inquiry }, 201);
      }
      return errorResponse("Not Found", 404);
    } catch (error) {
      console.error("Worker error:", error);
      return jsonResponse({
        error: "Internal Server Error",
        message: error.message
      }, 500);
    }
  }
};
export {
  worker_full_default as default
};
//# sourceMappingURL=worker-full.js.map
