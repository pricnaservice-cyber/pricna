// Cloudflare Pages Function - Routing middleware
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Pokud je hostname rezervace.pricna.cz, přesměruj na admin
  if (url.hostname === 'rezervace.pricna.cz') {
    // Přesměruj root na admin panel
    if (url.pathname === '/' || url.pathname === '') {
      url.pathname = '/admin/index.html';
      return context.env.ASSETS.fetch(new Request(url, request));
    }
    
    // Přesměruj ostatní cesty
    if (!url.pathname.startsWith('/admin/')) {
      url.pathname = '/admin' + url.pathname;
      return context.env.ASSETS.fetch(new Request(url, request));
    }
  }
  
  // Pro ostatní domény (pricna.cz) pokračuj normálně
  return context.next();
}
