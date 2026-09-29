import * as http from 'http';

const loginData = JSON.stringify({ email: 'student1@sfxsai.com', password: '123456' });

const req = http.request({
  hostname: '127.0.0.1',
  port: 3000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('Login Response:', body);
    const token = JSON.parse(body).access_token;

    const chatData = JSON.stringify({ body: 'Hello world' });
    const chatReq = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/chat/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': chatData.length
      }
    }, chatRes => {
      let chatBody = '';
      chatRes.on('data', d => chatBody += d);
      chatRes.on('end', () => {
        console.log('Chat Status:', chatRes.statusCode);
        console.log('Chat Response:', chatBody);
      });
    });
    chatReq.write(chatData);
    chatReq.end();
  });
});

req.write(loginData);
req.end();
