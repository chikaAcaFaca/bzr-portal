/**
 * Skripta za pokretanje generisanja blog posta o obavezama lica za BZR
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Pokretanje skripte za kreiranje blog posta o obavezama lica za BZR...');

// Putanja do TS Node executable
const tsNode = path.resolve('./node_modules/.bin/tsx');

// Putanja do TS skripte koju želimo da pokrenemo
const scriptPath = path.resolve('./scripts/create-bzr-obligations-blog.ts');

// Pokretanje TS skripte kroz TS Node
const process = spawn(tsNode, [scriptPath], { 
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

process.on('close', (code) => {
  if (code === 0) {
    console.log('Blog post uspešno kreiran!');
  } else {
    console.error(`Greška pri kreiranju blog posta. Kod: ${code}`);
  }
});