#!/usr/bin/env node

/**
 * Скрипта за транслитерацију имена фајлова са ћирилице/латинице на енглеску латиницу
 * 
 * Употреба:
 * node transliterate-files.js <путања-до-директоријума>
 * 
 * Пример:
 * node transliterate-files.js ./dokumenti
 */

const fs = require('fs');
const path = require('path');

// Мапа за конверзију ћириличних и латиничних карактера
const characterMap = {
  // Ћирилична слова
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Ђ': 'DJ', 'Е': 'E', 'Ж': 'Z', 
  'З': 'Z', 'И': 'I', 'Ј': 'J', 'К': 'K', 'Л': 'L', 'Љ': 'LJ', 'М': 'M', 'Н': 'N', 
  'Њ': 'NJ', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'Ћ': 'C', 'У': 'U', 
  'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'C', 'Џ': 'DZ', 'Ш': 'S',

  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ђ': 'dj', 'е': 'e', 'ж': 'z', 
  'з': 'z', 'и': 'i', 'ј': 'j', 'к': 'k', 'л': 'l', 'љ': 'lj', 'м': 'm', 'н': 'n', 
  'њ': 'nj', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'ћ': 'c', 'у': 'u', 
  'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'c', 'џ': 'dz', 'ш': 's',

  // Латинична слова са дијакритичким знаковима
  'Č': 'C', 'Ć': 'C', 'Đ': 'DJ', 'Š': 'S', 'Ž': 'Z', 
  'č': 'c', 'ć': 'c', 'đ': 'dj', 'š': 's', 'ž': 'z',

  // Додатни дијакритички знакови који се могу појавити
  'Ä': 'A', 'Ö': 'O', 'Ü': 'U', 'ß': 'ss',
  'ä': 'a', 'ö': 'o', 'ü': 'u',
  'Å': 'A', 'å': 'a',
  'Æ': 'AE', 'æ': 'ae',
  'Ø': 'O', 'ø': 'o',
  'Ñ': 'N', 'ñ': 'n',
  'Ç': 'C', 'ç': 'c',
  'Ë': 'E', 'ë': 'e',
  'Ï': 'I', 'ï': 'i',
  'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Å': 'A',
  'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'å': 'a',
  'È': 'E', 'É': 'E', 'Ê': 'E',
  'è': 'e', 'é': 'e', 'ê': 'e',
  'Ì': 'I', 'Í': 'I', 'Î': 'I',
  'ì': 'i', 'í': 'i', 'î': 'i',
  'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O',
  'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o',
  'Ù': 'U', 'Ú': 'U', 'Û': 'U',
  'ù': 'u', 'ú': 'u', 'û': 'u',
};

/**
 * Функција за транслитерацију текста из ћирилице/латинице са дијакритиком у енглеску латиницу
 * @param {string} text Улазни текст за транслитерацију
 * @returns {string} Транслитерисани текст
 */
function transliterate(text) {
  return text
    .split('')
    .map(char => characterMap[char] || char)
    .join('');
}

/**
 * Функција за проверу да ли име фајла садржи ћириличне или специјалне латиничне карактере
 * @param {string} fileName Име фајла за проверу
 * @returns {boolean} true ако име фајла садржи специјалне карактере који би требало транслитерисати
 */
function needsTransliteration(fileName) {
  for (const char of fileName) {
    if (characterMap[char]) {
      return true;
    }
  }
  return false;
}

/**
 * Рекурзивно преименовање свих фајлова у директоријуму и поддиректоријумима
 * @param {string} directoryPath Путања до директоријума
 * @param {boolean} recursive Да ли да се рекурзивно обрађују поддиректоријуми
 */
function processDirectory(directoryPath, recursive = true) {
  if (!fs.existsSync(directoryPath)) {
    console.error(`Директоријум не постоји: ${directoryPath}`);
    return;
  }

  const files = fs.readdirSync(directoryPath);
  let filesTransliterated = 0;

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory() && recursive) {
      // Рекурзивно обради поддиректоријуме
      const dirName = path.basename(filePath);
      
      if (needsTransliteration(dirName)) {
        const newDirName = transliterate(dirName);
        const newDirPath = path.join(directoryPath, newDirName);
        
        if (dirName !== newDirName && !fs.existsSync(newDirPath)) {
          fs.renameSync(filePath, newDirPath);
          console.log(`Директоријум преименован: ${dirName} -> ${newDirName}`);
          filesTransliterated++;
          // Настави обраду са новим именом директоријума
          processDirectory(newDirPath, recursive);
        } else {
          // Настави обраду са оригиналним именом директоријума
          processDirectory(filePath, recursive);
        }
      } else {
        // Настави обраду са оригиналним именом директоријума
        processDirectory(filePath, recursive);
      }
    } else if (stats.isFile()) {
      // Обради фајл
      const fileName = path.basename(filePath);
      
      if (needsTransliteration(fileName)) {
        const newFileName = transliterate(fileName);
        const newFilePath = path.join(directoryPath, newFileName);
        
        if (fileName !== newFileName && !fs.existsSync(newFilePath)) {
          fs.renameSync(filePath, newFilePath);
          console.log(`Фајл преименован: ${fileName} -> ${newFileName}`);
          filesTransliterated++;
        }
      }
    }
  }

  return filesTransliterated;
}

// Главна функција
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Употреба: node transliterate-files.js <путања-до-директоријума> [--no-recursive]');
    console.log('Опције:');
    console.log('  --no-recursive    Не обрађуј поддиректоријуме рекурзивно');
    return;
  }
  
  const directoryPath = args[0];
  const recursive = !args.includes('--no-recursive');
  
  console.log(`Започињем транслитерацију имена фајлова у директоријуму: ${directoryPath}`);
  console.log(`Рекурзивна обрада: ${recursive ? 'Да' : 'Не'}`);
  
  try {
    const filesTransliterated = processDirectory(directoryPath, recursive);
    console.log(`Завршено! Укупно преименовано фајлова: ${filesTransliterated}`);
  } catch (error) {
    console.error('Дошло је до грешке:', error.message);
  }
}

main();