/**
 * Skripta za pokretanje generisanja blog posta o obavezama lica za BZR
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Dobijanje trenutnog direktorijuma
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Pokretanje skripte za kreiranje blog posta o obavezama lica za BZR...');

// Putanja do TS Node executable
const tsNode = resolve('./node_modules/.bin/tsx');

// Putanja do TS skripte koju želimo da pokrenemo
const scriptPath = resolve('./scripts/create-bzr-obligations-blog.ts');

// Pokretanje TS skripte kroz TS Node
const childProcess = spawn(tsNode, [scriptPath], { 
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

childProcess.on('close', (code) => {
  if (code === 0) {
    console.log('Blog post uspešno kreiran!');
  } else {
    console.error(`Greška pri kreiranju blog posta. Kod: ${code}`);
  }
});