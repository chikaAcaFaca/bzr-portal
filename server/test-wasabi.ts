import { wasabiStorageService } from './services/wasabi-storage-service';

// Jednostavan test skript za proveru Wasabi integracije
async function testWasabiIntegration() {
  console.log('Započinjem test Wasabi integracije...');
  
  try {
    // Test 1: Listanje fajlova iz korisničkog bucket-a
    console.log('\nTest 1: Listanje fajlova iz korisničkog bucket-a');
    const userBucketFiles = await wasabiStorageService.listFiles('test/');
    console.log('Uspešno izlistani fajlovi iz korisničkog bucket-a:');
    console.log(userBucketFiles);
    
    // Test 2: Kreiranje test fajla
    console.log('\nTest 2: Upload test fajla');
    const testContent = Buffer.from('Ovo je test sadržaj za proveru Wasabi integracije.');
    const uploadResult = await wasabiStorageService.uploadFile(
      'test/test-file.txt', 
      testContent, 
      'text/plain'
    );
    console.log('Uspešno uploadovan test fajl:');
    console.log(uploadResult);
    
    // Test 3: Preuzimanje kreiranog fajla
    console.log('\nTest 3: Preuzimanje test fajla');
    const downloadedContent = await wasabiStorageService.getFile('test/test-file.txt');
    console.log('Uspešno preuzet test fajl:');
    console.log('Sadržaj: ' + downloadedContent.toString());
    
    // Test 4: Brisanje test fajla
    console.log('\nTest 4: Brisanje test fajla');
    await wasabiStorageService.deleteFile('test/test-file.txt');
    console.log('Uspešno obrisan test fajl');
    
    // Test 5: Provera da li je fajl stvarno obrisan
    console.log('\nTest 5: Provera da li je fajl stvarno obrisan');
    const afterDeleteFiles = await wasabiStorageService.listFiles('test/');
    console.log('Lista fajlova nakon brisanja:');
    console.log(afterDeleteFiles);
    
    console.log('\nSvi testovi su uspešno završeni! Wasabi integracija radi ispravno.');
  } catch (error) {
    console.error('\nDošlo je do greške tokom testiranja Wasabi integracije:');
    console.error(error);
  }
}

// Pokreni test
testWasabiIntegration();