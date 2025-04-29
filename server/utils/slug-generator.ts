/**
 * Utility functions za generisanje i upravljanje URL slugovima za blog postove.
 * Uključuje podršku za ćirilične znakove koja ih automatski transliteracijom pretvara u latinični ekvivalent.
 */

/**
 * Pretvara ćirilični text u latinični
 * @param text Ćirilični tekst koji treba konvertovati
 * @returns Latinični ekvivalent
 */
export function cyrillicToLatin(text: string): string {
  if (!text) return '';
  
  const cyrillicMap: { [key: string]: string } = {
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
  
  return text.split('').map(char => cyrillicMap[char] || char).join('');
}

/**
 * Generiše SEO-friendly slug od teksta
 * @param text Originalni tekst (može sadržati ćirilicu, razmake, specijalne znakove)
 * @returns Čist slug prilagođen za URL (sve mala slova, razmaci zamenjeni crticama)
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  
  // Prvo konvertuj ćirilicu u latinicu
  const latinText = cyrillicToLatin(text);
  
  return latinText
    .toLowerCase()                   // konvertuj u mala slova
    .trim()                          // ukloni praznine sa početka i kraja
    .replace(/\s+/g, '-')            // zameni razmake sa crticama
    .replace(/[^\w\-]+/g, '')        // ukloni sve osim alfanumeričke znakove i crtice
    .replace(/\-\-+/g, '-')          // zameni više uzastopnih crtica sa jednom
    .replace(/^-+/, '')              // ukloni crtice sa početka
    .replace(/-+$/, '')              // ukloni crtice sa kraja
    .substring(0, 100);              // ograniči dužinu na 100 znakova
}

/**
 * Generiše jedinstven slug na osnovu osnovnog sluga i liste postojećih slugova
 * @param baseSlug Osnovni slug
 * @param existingSlugs Lista postojećih slugova
 * @returns Jedinstven slug koji ne postoji u listi postojećih slugova
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