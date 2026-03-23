const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3001;

function request(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: BASE_URL, port: PORT, path }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    }).on('error', reject);
  });
}

async function testPWA() {
  console.log('=== PWA Verification Tests ===\n');
  let allPassed = true;

  // Test 1: Manifest
  console.log('1. Testing Manifest...');
  const manifest = await request('/ficc-connect/manifest.webmanifest');
  console.log('   Status:', manifest.status);
  console.log('   Content-Type:', manifest.headers['content-type']);
  if (manifest.status === 200 && manifest.headers['content-type']?.includes('application/manifest+json')) {
    console.log('   ✓ Manifest served correctly\n');
    try {
      const m = JSON.parse(manifest.data);
      console.log('   Manifest name:', m.name);
      console.log('   Short name:', m.short_name);
      console.log('   Icons count:', m.icons?.length || 0);
    } catch (e) {}
  } else {
    console.log('   ✗ Manifest issues detected\n');
    allPassed = false;
  }

  // Test 2: Service Worker
  console.log('2. Testing Service Worker...');
  const sw = await request('/ficc-connect/sw.js');
  console.log('   Status:', sw.status);
  console.log('   Content-Type:', sw.headers['content-type']);
  console.log('   Content length:', sw.data.length, 'bytes');
  if (sw.status === 200 && sw.data.includes('workbox')) {
    console.log('   ✓ Service Worker accessible with Workbox\n');
  } else {
    console.log('   ✗ Service Worker issues\n');
    allPassed = false;
  }

  // Test 3: Icons
  console.log('3. Testing Icons...');
  const icon192 = await request('/ficc-connect/icon-192.png');
  const icon512 = await request('/ficc-connect/icon-512.png');
  console.log('   icon-192.png:', icon192.status, '-', icon192.headers['content-type']);
  console.log('   icon-512.png:', icon512.status, '-', icon512.headers['content-type']);
  if (icon192.status === 200 && icon512.status === 200) {
    console.log('   ✓ Icons accessible\n');
  } else {
    console.log('   ✗ Icon issues\n');
    allPassed = false;
  }

  // Test 4: Index HTML (direct path)
  console.log('4. Testing Index HTML...');
  const index = await request('/ficc-connect/index.html');
  console.log('   Status:', index.status);
  const hasManifest = index.data.includes('rel="manifest"');
  const hasThemeColor = index.data.includes('theme-color');
  const hasViewport = index.data.includes('viewport');
  console.log('   Has manifest link:', hasManifest ? '✓' : '✗');
  console.log('   Has theme-color:', hasThemeColor ? '✓' : '✗');
  console.log('   Has viewport:', hasViewport ? '✓' : '✗');

  // Check for service worker registration in the JS bundle
  const hasSWRegistration = index.data.includes('registerSW') || index.data.includes('serviceWorker');
  console.log('   SW registration in HTML:', hasSWRegistration ? '✓' : '⚠ (may be in JS bundle)');

  if (hasManifest && hasThemeColor && hasViewport) {
    console.log('   ✓ Index HTML has required PWA elements\n');
  } else {
    console.log('   ✗ Index HTML missing some elements\n');
    allPassed = false;
  }

  // Test 5: Main JS bundle
  console.log('5. Testing JS Bundle...');
  const jsMatch = index.data.match(/src="([^"]+\.js)"/);
  if (jsMatch) {
    const jsPath = jsMatch[1];
    const js = await request(jsPath);
    console.log('   JS bundle:', jsPath);
    console.log('   Status:', js.status);
    const hasSWReg = js.data.includes('registerSW') || js.data.includes('serviceWorker');
    console.log('   Has SW registration:', hasSWReg ? '✓' : '✗');
    if (hasSWReg) {
      console.log('   ✓ Service Worker registration found in JS\n');
    } else {
      console.log('   ⚠ Service Worker registration not found (may use different method)\n');
    }
  } else {
    console.log('   ✗ Could not find JS bundle\n');
  }

  console.log('=== Summary ===');
  if (allPassed) {
    console.log('✓ All critical PWA components are in place!');
  } else {
    console.log('⚠ Some issues detected. Check details above.');
  }

  console.log('\n=== Browser Testing Instructions ===');
  console.log('1. Open Chrome/Edge and navigate to:');
  console.log('   http://localhost:3001/ficc-connect/');
  console.log('2. Open DevTools (F12) > Application tab');
  console.log('3. Check these sections:');
  console.log('   - Manifest: Should show app name, icons, theme colors');
  console.log('   - Service Workers: Should show sw.js registered');
  console.log('   - Cache Storage: Should show workbox caches');
  console.log('4. Look for install prompt (address bar or menu)');
  console.log('5. Test offline: Network tab > Offline checkbox > reload page');
}

testPWA().catch(console.error);
