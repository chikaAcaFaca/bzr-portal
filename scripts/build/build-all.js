#!/usr/bin/env node

/**
 * Glavna build skripta
 * Koristi se za kompletni build aplikacije u fazama
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Započinjem kompletan build aplikacije...');

// Funkcija za izvršavanje komande sa obaveznim nastavkom
function runStep(command, name) {
  console.log(`\n📌 Korak: ${name}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Korak "${name}" uspešno završen`);
    return true;
  } catch (error) {
    console.error(`❌ Greška u koraku "${name}":`, error.message);
    return false;
  }
}

// Brisanje dist direktorijuma ako postoji
if (fs.existsSync('dist')) {
  console.log('🧹 Brisanje prethodnog build-a...');
  fs.rmSync('dist', { recursive: true, force: true });
}

// Kreiranje dist direktorijuma
fs.mkdirSync('dist', { recursive: true });

// Kreiranje .nojekyll fajla za GitHub Pages (ako se koristi)
fs.writeFileSync('dist/.nojekyll', '');

// Izvršavanje build koraka
const steps = [
  { command: 'node scripts/build/build-client.js', name: 'Build frontend-a' },
  { command: 'node scripts/build/build-server.js', name: 'Build backend-a' },
  { command: 'cp -R public/* dist/client/', name: 'Kopiranje statičkih fajlova' }
];

let allSuccessful = true;

for (const step of steps) {
  const success = runStep(step.command, step.name);
  if (!success) {
    allSuccessful = false;
    console.error(`\n❌ Build proces prekinut zbog greške u koraku "${step.name}"`);
    break;
  }
}

if (allSuccessful) {
  console.log('\n🎉 Kompletan build uspešno završen! Aplikacija je spremna za deployment.');
} else {
  console.error('\n❌ Build proces nije uspešno završen. Pogledajte greške iznad.');
  process.exit(1);
}