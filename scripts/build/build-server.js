#!/usr/bin/env node

/**
 * Build skripta za backend
 * Koristi se za build backend dela aplikacije
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Započinjem build backend dela aplikacije...');

try {
  // Kreiranje dist direktorijuma ako ne postoji
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }

  // Izvršavanje esbuild komande za kompilaciju servera
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server', { 
    stdio: 'inherit',
    timeout: 60000 // 1 minut maksimalno vreme za build
  });

  // Kreiranje osnovne index.js datoteke koja importuje server build
  fs.writeFileSync('dist/index.js', `
// Main production entry point
import './server/index.js';
  `.trim());

  console.log('✅ Backend uspešno izgrađen!');
} catch (error) {
  console.error('❌ Greška prilikom build-a backend-a:', error.message);
  process.exit(1);
}