#!/usr/bin/env node

/**
 * Build skripta za frontend
 * Koristi se za build frontend dela aplikacije
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Započinjem build frontend dela aplikacije...');

try {
  // Kreiranje dist direktorijuma ako ne postoji
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }

  // Izvršavanje Vite build komande sa ograničenim vremenom izvršavanja
  execSync('npx vite build --outDir dist/client', { 
    stdio: 'inherit',
    timeout: 180000 // 3 minuta maksimalno vreme za build
  });

  console.log('✅ Frontend uspešno izgrađen!');
} catch (error) {
  console.error('❌ Greška prilikom build-a frontend-a:', error.message);
  process.exit(1);
}