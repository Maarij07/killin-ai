const fs = require('fs');
const path = require('path');

async function testMenuAPI() {
  const imagePath = path.join(__dirname, 'public', 'special-1.jpg');
  const imageBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  
  const form = new FormData();
  form.append('menu_image', blob, 'special-1.jpg');
  
  try {
    const response = await fetch('https://server.kallin.ai/api/upload/menu-image', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: form
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('\nRaw Response:');
    console.log(text);
    
    try {
      const json = JSON.parse(text);
      console.log('\nParsed JSON:');
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('\nFailed to parse as JSON');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testMenuAPI();
