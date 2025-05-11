const axios = require('axios');

// Koristimo env varijablu za Gemini API ključ
const apiKey = process.env.GEMINI_API_KEY;

// Jednostavan test Gemini API-ja
async function testGeminiAPI() {
  console.log('Testiranje Gemini API ključa...');
  console.log(`API ključ izgleda validno: ${typeof apiKey === 'string' && apiKey.length > 30}`);
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: "Zdravo, reci nešto o bezbednosti na radu na srpskom"
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
          topP: 0.95
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Odgovor primljen:', response.status);
    console.log('Dužina odgovora:', JSON.stringify(response.data).length);
    const text = response.data.candidates[0].content.parts[0].text;
    console.log('Deo odgovora (prvih 100 karaktera):', text.substring(0, 100));
    console.log('Gemini API je uspešno testiran!');
    return true;
  } catch (error) {
    console.error('Greška pri testiranju Gemini API-ja:', error.message);
    if (error.response) {
      console.error('Status kod:', error.response.status);
      console.error('Odgovor:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Nema odgovora od servera');
    } else {
      console.error('Greška pri kreiranju zahteva:', error.message);
    }
    return false;
  }
}

// Pokretanje testa
testGeminiAPI()
  .then(success => {
    console.log(`Test ${success ? 'uspešan' : 'neuspešan'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Neočekivana greška:', error);
    process.exit(1);
  });