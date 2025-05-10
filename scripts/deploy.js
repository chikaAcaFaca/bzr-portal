#!/usr/bin/env node

/**
 * Deploy skripta za BZR aplikaciju
 * Ova skripta se koristi za pripremu aplikacije za deploy
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Postavljamo optimalne varijable okruženja za build
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
process.env.NODE_ENV = 'production';

console.log('📦 Priprema za deploy...');

// Izvršavamo optimizacionu skriptu
console.log('🔧 Pokrećem optimizaciju build procesa...');
execSync('node scripts/optimize-build.js', { stdio: 'inherit' });

// Proveravamo da li postoji dist folder, ako ne - kreiramo ga
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

try {
  // Korak 1: Build frontend-a - koristeći vite sa kraćim timeout-om i specifičnim podešavanjima
  console.log('🔨 Building frontend...');
  const viteCommand = 'npx vite build --outDir dist/client';
  execSync(viteCommand, { 
    stdio: 'inherit',
    timeout: 180000, // 3 minuta max
    env: { ...process.env, NODE_ENV: 'production' } 
  });

  // Korak 2: Build backend-a - koristeći esbuild odvojeno
  console.log('🔨 Building backend...');
  const esbuildCommand = 'npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server';
  execSync(esbuildCommand, { 
    stdio: 'inherit',
    timeout: 60000, // 1 minut max 
    env: { ...process.env, NODE_ENV: 'production' }
  });

  // Korak 3: Kopiranje static fajlova
  console.log('📂 Copying static files...');
  if (fs.existsSync('public')) {
    execSync('cp -R public/* dist/client/', { stdio: 'inherit' });
  }

  // Korak 4: Kreiranje production entrypoint-a
  console.log('📝 Creating production entry point...');
  fs.writeFileSync('dist/index.js', `
// Production application entry point
import './server/index.js';
  `.trim());

  console.log('✅ Deploy priprema uspešno završena!');
  console.log('🚀 Za pokretanje produkcione verzije, koristite: NODE_ENV=production node dist/index.js');
} catch (error) {
  console.error('❌ Greška prilikom pripreme za deploy:', error.message);
  process.exit(1);
}