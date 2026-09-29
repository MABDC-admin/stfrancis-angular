const pngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn9xWQAAAAASUVORK5CYII=';

const apiBaseUrl = process.env.VERIFY_API_BASE_URL || 'http://127.0.0.1:3000';
const email = process.env.VERIFY_EMAIL || 'ivyann@sfxsai.com';
const password = process.env.VERIFY_PASSWORD || '123456';

async function login() {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error(`Login failed: ${response.status} ${JSON.stringify(payload)}`);
  }

  return payload.access_token;
}

async function upload(token) {
  const form = new FormData();
  form.append('ownerType', 'verification');
  form.append('category', 'other');
  form.append(
    'file',
    new Blob([Buffer.from(pngBase64, 'base64')], { type: 'image/png' }),
    'r2-check.png',
  );

  const response = await fetch(`${apiBaseUrl}/storage/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${text}`);
  }
  return JSON.parse(text);
}

async function fetchContent(token, id) {
  const response = await fetch(`${apiBaseUrl}/storage/files/${id}/content`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.ok || bytes.length === 0) {
    throw new Error(`Content fetch failed: ${response.status}`);
  }
  return bytes.length;
}

async function deleteFile(token, id) {
  const response = await fetch(`${apiBaseUrl}/storage/files/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status} ${text}`);
  }
  return text;
}

const token = await login();
const uploaded = await upload(token);
const bytesRead = await fetchContent(token, uploaded.id);
const deleted = await deleteFile(token, uploaded.id);

console.log(
  JSON.stringify(
    {
      uploaded,
      bytesRead,
      deleted,
    },
    null,
    2,
  ),
);
