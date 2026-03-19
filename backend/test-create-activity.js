const http = require('http');

// Use the token from Alice's login
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZjRjM2EyZS03NDM1LTRjNjctYTEwYS00OTExOGUzMmUyOGMiLCJvcGVuaWQiOiJkZXZfb3BlbmlkX3Rlc3RfYWxpY2VfMjAyNiIsImlhdCI6MTc3MzkzNzk2MywiZXhwIjoxNzc0NTQyNzYzfQ.efc4hijQRP0CH3WLieU1WsSvTpSjdP3A7ryFfA2Xz-Y';

const testData = {
  title: '30 天健身挑战',
  description: '每天锻炼 30 分钟，坚持 30 天！可以上传运动照片打卡。',
  start_date: '2026-03-20',
  end_date: '2026-04-19',
  points_per_checkin: 10,
  points_per_photo: 5
};

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/activities',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const result = JSON.parse(body);
    console.log('✅ Activity Creation Test:', result.success ? 'PASSED ✓' : 'FAILED ✗');
    if (result.success) {
      const act = result.data.activity;
      console.log('   Activity ID:', act.id);
      console.log('   Title:', act.title);
      console.log('   Duration:', act.start_date, 'to', act.end_date);
      console.log('   Creator ID:', act.creator_id);
      console.log('\n📝 Copy this activity ID for check-in test:', act.id);
    } else {
      console.log('   Error:', result.error);
    }
  });
});

req.on('error', (e) => console.error('❌ Request error:', e.message));
req.write(JSON.stringify(testData));
req.end();
