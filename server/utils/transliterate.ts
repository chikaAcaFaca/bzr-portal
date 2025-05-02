/**
 * Transliteriše ćirilični tekst u latinični, uklanja dijakritičke znakove
 * Koristi se za generisanje URL-friendly slugova
 */
export function transliterate(text: string): string {
  if (!text) return '';
  
  // Mapa ćiriličnih karaktera u latinične
  const cyrillicToLatin: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ђ': 'dj', 'е': 'e',
    'ж': 'z', 'з': 'z', 'и': 'i', 'ј': 'j', 'к': 'k', 'л': 'l', 'љ': 'lj',
    'м': 'm', 'н': 'n', 'њ': 'nj', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's',
    'т': 't', 'ћ': 'c', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'c',
    'џ': 'dz', 'ш': 's',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Ђ': 'Dj', 'Е': 'E',
    'Ж': 'Z', 'З': 'Z', 'И': 'I', 'Ј': 'J', 'К': 'K', 'Л': 'L', 'Љ': 'Lj',
    'М': 'M', 'Н': 'N', 'Њ': 'Nj', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S',
    'Т': 'T', 'Ћ': 'C', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'C',
    'Џ': 'Dz', 'Ш': 'S'
  };
  
  // Dijakritički karakteri u latinici i njihovi ekvivalenti bez dijakritičkih znakova
  const diacriticsToLatin: Record<string, string> = {
    'č': 'c', 'ć': 'c', 'ž': 'z', 'š': 's', 'đ': 'dj',
    'Č': 'C', 'Ć': 'C', 'Ž': 'Z', 'Š': 'S', 'Đ': 'Dj',
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a',
    'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
    'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o',
    'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
    'ý': 'y', 'ÿ': 'y', 'ñ': 'n'
  };
  
  // Prvo transliteriši ćirilicu u latinicu
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    result += cyrillicToLatin[char] || char;
  }
  
  // Zatim ukloni dijakritičke znakove
  let latinWithoutDiacritics = '';
  for (let i = 0; i < result.length; i++) {
    const char = result.charAt(i);
    latinWithoutDiacritics += diacriticsToLatin[char] || char;
  }
  
  return latinWithoutDiacritics;
}