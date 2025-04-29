/**
 * Funkcija za generisanje SEO-friendly URL slugova
 * - Pretvara ćirilicu u latinicu
 * - Konvertuje slova u mala slova
 * - Zamenjuje razmake sa crtama
 * - Uklanja specijalne karaktere
 * - Skraćuje na maksimalnu dužinu od 100 karaktera
 */

const cyrillicToLatin: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ђ': 'dj', 'е': 'e', 'ж': 'z',
  'з': 'z', 'и': 'i', 'ј': 'j', 'к': 'k', 'л': 'l', 'љ': 'lj', 'м': 'm', 'н': 'n',
  'њ': 'nj', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'ћ': 'c', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'c', 'џ': 'dz', 'ш': 's',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Ђ': 'Dj', 'Е': 'E', 'Ж': 'Z',
  'З': 'Z', 'И': 'I', 'Ј': 'J', 'К': 'K', 'Л': 'L', 'Љ': 'Lj', 'М': 'M', 'Н': 'N',
  'Њ': 'Nj', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'Ћ': 'C', 'У': 'U',
  'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'C', 'Џ': 'Dz', 'Ш': 'S'
};

/**
 * Pretvara ćirilični tekst u latinični
 */
function transliterateCyrillic(text: string): string {
  return text.split('').map(char => cyrillicToLatin[char] || char).join('');
}

/**
 * Glavna funkcija za generisanje slugova
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  
  // Konvertuj ćirilicu u latinicu
  const latinText = transliterateCyrillic(text);
  
  return latinText
    .toLowerCase()                     // Konvertuj u mala slova
    .trim()                            // Ukloni razmake na krajevima
    .replace(/\s+/g, '-')              // Zameni razmake sa crtama
    .replace(/[^\w\-]+/g, '')          // Ukloni sve što nije slovo, broj ili crta
    .replace(/\-\-+/g, '-')            // Zameni više uzastopnih crta sa jednom crtom
    .replace(/^-+/, '')                // Ukloni crte sa početka
    .replace(/-+$/, '')                // Ukloni crte sa kraja
    .substring(0, 100);                // Ograniči dužinu na 100 karaktera
}

/**
 * Generiše jedinstven slug dodavanjem brojeva na kraju ako već postoji
 */
export function generateUniqueSlug(
  baseSlug: string, 
  existingSlugs: string[]
): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let uniqueSlug: string;
  let counter = 1;

  do {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  } while (existingSlugs.includes(uniqueSlug));

  return uniqueSlug;
}