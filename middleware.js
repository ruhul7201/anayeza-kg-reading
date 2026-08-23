export const config = {
  matcher: ['/kg', '/kg/:path*'],
};

const COOKIE_NAME = 'kg_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getCookie(request, name) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function loginPage(showError) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Amity Kindergarten Reading Class — Sign In</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Nunito',sans-serif;background:#F4F7FB;color:#22304F;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .card{background:#fff;border-radius:16px;box-shadow:0 2px 10px rgba(30,42,74,.1);padding:32px;max-width:360px;width:100%;text-align:center}
  h1{font-family:'Baloo 2',cursive;font-size:22px;color:#1E2A4A;margin-bottom:6px}
  p{color:#5B6B85;font-size:14px;margin-bottom:20px}
  input{width:100%;padding:12px 14px;border-radius:10px;border:1px solid #E3E9F2;font-size:16px;margin-bottom:14px;font-family:'Nunito'}
  input:focus{outline:2px solid #F5B301}
  button{width:100%;padding:12px;border:none;border-radius:10px;background:#F5B301;color:#1E2A4A;font-family:'Baloo 2';font-weight:800;font-size:15px;cursor:pointer}
  button:hover{filter:brightness(1.05)}
  .err{color:#E8674F;font-size:13px;font-weight:700;margin-bottom:12px}
</style></head>
<body>
  <div class="card">
    <h1>Amity Kindergarten</h1>
    <p>Enter the access code to view the reading class page.</p>
    ${showError ? '<div class="err">Incorrect code, please try again.</div>' : ''}
    <form method="POST">
      <input type="password" name="passcode" placeholder="Access code" autofocus required>
      <button type="submit">Enter</button>
    </form>
  </div>
</body></html>`;
}

function htmlResponse(body, status) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export default async function middleware(request) {
  const secret = process.env.KG_PASSCODE;
  if (!secret) {
    return new Response('Site misconfigured: KG_PASSCODE not set', { status: 500 });
  }

  if (request.method === 'POST') {
    const form = await request.formData();
    const submitted = form.get('passcode');
    if (submitted === secret) {
      const expiry = Date.now() + COOKIE_MAX_AGE * 1000;
      const sig = await hmac(secret, String(expiry));
      const token = encodeURIComponent(`${expiry}.${sig}`);
      const res = new Response(null, {
        status: 303,
        headers: { Location: request.url },
      });
      res.headers.append(
        'Set-Cookie',
        `${COOKIE_NAME}=${token}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`
      );
      return res;
    }
    return htmlResponse(loginPage(true), 401);
  }

  const cookieVal = getCookie(request, COOKIE_NAME);
  if (cookieVal) {
    const [expiryStr, sig] = cookieVal.split('.');
    const expiry = Number(expiryStr);
    if (expiry > Date.now()) {
      const expected = await hmac(secret, expiryStr);
      if (expected === sig) {
        return;
      }
    }
  }

  return htmlResponse(loginPage(false), 401);
}
