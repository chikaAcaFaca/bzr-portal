#!/usr/bin/env node

/**
 * Skripta za optimizaciju build procesa
 * Ova skripta se koristi pre deploymenta kako bi se ubrzao proces buildanja
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔧 Optimizacija build procesa...');

// Proveravamo da li imamo dovoljno raspoložive memorije
try {
  console.log('🧠 Provera raspoložive memorije...');
  const meminfo = execSync('cat /proc/meminfo').toString();
  const memFree = parseInt(meminfo.match(/MemFree:\s+(\d+)/)[1]) / 1024;
  const memAvailable = parseInt(meminfo.match(/MemAvailable:\s+(\d+)/)[1]) / 1024;
  
  console.log(`✓ Slobodno: ${Math.round(memFree)} MB`);
  console.log(`✓ Dostupno: ${Math.round(memAvailable)} MB`);
  
  // Ako ima manje od 2GB memorije, pokušaćemo da oslobodimo nešto
  if (memAvailable < 2000) {
    console.log('⚠️ Malo dostupne memorije, vršimo optimizaciju...');
    
    // Čistimo nepotrebne foldere
    console.log('🧹 Čišćenje privremenih fajlova...');
    execSync('rm -rf .cache/* || true');
    execSync('rm -rf dist/* || true');
    
    // Čistimo node_modules cache
    execSync('npm cache clean --force');
    
    // Ponovno proveravanje memorije
    const meminfoAfter = execSync('cat /proc/meminfo').toString();
    const memAvailableAfter = parseInt(meminfoAfter.match(/MemAvailable:\s+(\d+)/)[1]) / 1024;
    console.log(`✓ Dostupno nakon čišćenja: ${Math.round(memAvailableAfter)} MB`);
  }
} catch (error) {
  console.warn('⚠️ Nije moguće proveriti dostupnu memoriju:', error.message);
}

// Optimizacija Lucide ikona - osiguranje da se koristi naša optimizovana biblioteka
console.log('🖌️ Provera optimizovanih ikona...');
const iconsFile = path.resolve('client/src/lib/icons.ts');
if (fs.existsSync(iconsFile)) {
  console.log('✓ Optimizovana biblioteka ikona je prisutna');
} else {
  console.error('❌ Fajl sa optimizovanim ikonama nije pronađen!');
  console.log('ℹ️ Trebalo bi kreirati client/src/lib/icons.ts za bolju performansu builda');
}

// Postavljanje optimalnih env varijabli za build
console.log('⚙️ Podešavanje optimalnih varijabli okruženja za build...');
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
process.env.NODE_ENV = 'production';

console.log('✅ Optimizacija završena, sistem je spreman za build!');

// Exportujemo ove varijable za build skriptu
console.log('Postavite sledeće varijable pre buildanja:');
console.log('export NODE_OPTIONS="--max-old-space-size=4096"');
console.log('export NODE_ENV="production"');