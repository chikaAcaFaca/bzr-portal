/**
 * Skripta za kreiranje blog posta o obavezama lica za bezbednost i zdravlje na radu
 * Koristi Gemini API za generisanje sadržaja i kreira novi blog post
 */

import { exit } from 'process';
import { db } from '../server/db';
import { config } from '../server/config';
import { storage } from '../server/storage';
import axios from 'axios';

// Direktno koristi Gemini API sa API ključem iz konfiguracije
const geminiApiKey = config.geminiApiKey;
const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

// Funkcija za transliteraciju ćirilice i latinice sa dijakritičkim znakovima
function transliterate(text: string): string {
  const cyrillicToLatin: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ђ': 'dj', 'е': 'e', 'ж': 'z',
    'з': 'z', 'и': 'i', 'ј': 'j', 'к': 'k', 'л': 'l', 'љ': 'lj', 'м': 'm', 'н': 'n',
    'њ': 'nj', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'ћ': 'c', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'c', 'џ': 'dz', 'ш': 's',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Ђ': 'Dj', 'Е': 'E', 'Ж': 'Z',
    'З': 'Z', 'И': 'I', 'Ј': 'J', 'К': 'K', 'Л': 'L', 'Љ': 'Lj', 'М': 'M', 'Н': 'N',
    'Њ': 'Nj', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'Ћ': 'C', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'C', 'Џ': 'Dz', 'Ш': 'S',
    'č': 'c', 'ć': 'c', 'đ': 'dj', 'š': 's', 'ž': 'z',
    'Č': 'C', 'Ć': 'C', 'Đ': 'Dj', 'Š': 'S', 'Ž': 'Z'
  };

  return text.split('').map(char => cyrillicToLatin[char] || char).join('');
}

function generateSlug(title: string): string {
  const transliterated = transliterate(title.toLowerCase());
  return transliterated
    .replace(/[^\w\s-]/g, '')  // Uklanjanje specijalnih karaktera
    .replace(/\s+/g, '-')      // Zamena razmaka sa crticama
    .replace(/-+/g, '-')       // Zamena višestrukih crtica sa jednom
    .trim();
}

/**
 * Funkcija koja generiše sadržaj o obavezama lica za BZR
 */
async function generateBZRObligationsContent() {
  const systemPrompt = `Ti si ekspert za bezbednost i zdravlje na radu u Srbiji. 
  Napiši detaljan, informativan i stručan tekst o obavezama lica za bezbednost i zdravlje na radu prema važećem Zakonu o bezbednosti i zdravlju na radu u Republici Srbiji (Službeni glasnik RS, broj 35/2023).
  
  Tekst treba da bude strukturiran kao kvalitetan blog post sa sledećim elementima:
  1. Uvodni deo koji objašnjava ko je lice za bezbednost i zdravlje na radu
  2. Zakonski okvir koji definiše obaveze lica za BZR
  3. Temeljno nabrojane i objašnjene sve pojedinačne zakonske obaveze
  4. Značaj uloge lica za BZR u organizaciji
  5. Preporuke za efikasno obavljanje poslova lica za BZR
  
  Koristi Markdown formatiranje sa naslovima, podnaslovima, listama i naglašenim tekstom.
  Navedi konkretne članove zakona koji se odnose na svaku obavezu.
  Uključi praktične savete za primenu zakonskih odredbi.
  Ne izmišljaj informacije i drži se isključivo važećeg zakonodavstva Republike Srbije.`;

  const userQuery = "Napravi mi detaljan spisak svih obaveza lica za bezbednost i zdravlje na radu prema aktuelnom zakonu.";

  try {
    console.log('Šaljem upit Gemini API...');
    
    if (!geminiApiKey) {
      throw new Error('Gemini API ključ nije postavljen');
    }
    
    const fullUrl = `${geminiUrl}?key=${geminiApiKey}`;
    
    const response = await axios.post(fullUrl, {
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            { text: userQuery }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Gemini API greška: ${response.status} ${response.statusText}`);
    }
    
    // Izvlačimo tekst odgovora
    const contentText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!contentText) {
      throw new Error('Prazan odgovor od Gemini API');
    }
    
    return contentText;
  } catch (error: any) {
    console.error('Greška pri generisanju sadržaja:', error);
    if (error.response) {
      console.error('Gemini API odgovor:', error.response.status, error.response.data);
    }
    throw new Error(`Gemini API greška: ${error.message}`);
  }
}

/**
 * Provera da li već postoje blog postovi koji odgovaraju na pitanje
 */
async function checkExistingBlogPosts() {
  try {
    console.log('Provera postojećih blog postova...');
    
    // Dobavljanje svih blog postova
    const allPosts = await storage.getAllBlogPosts();
    
    // Ključne reči za pretragu
    const keywords = ['lice za bezbednost', 'obaveze lica za BZR', 'bezbednost i zdravlje na radu'];
    
    // Filtriraj postove koji sadrže ključne reči u naslovu, sadržaju ili tagovima
    const relevantPosts = allPosts.filter(post => {
      const title = post.title.toLowerCase();
      const content = post.content.toLowerCase();
      const tags = post.tags ? post.tags.join(' ').toLowerCase() : '';
      
      return keywords.some(keyword => 
        title.includes(keyword.toLowerCase()) || 
        content.includes(keyword.toLowerCase()) ||
        tags.includes(keyword.toLowerCase())
      );
    });
    
    console.log(`Pronađeno ${relevantPosts.length} relevantnih blog postova.`);
    
    return relevantPosts;
  } catch (error) {
    console.error('Greška pri proveri postojećih blog postova:', error);
    return [];
  }
}

/**
 * Glavna funkcija koja kreira blog post ili vraća postojeće
 */
async function createBZRObligationsBlogPost() {
  try {
    console.log('Analiziram potrebu za novim blog postom o obavezama lica za BZR...');
    
    // Prvo proverimo postojeće blog postove
    const existingPosts = await checkExistingBlogPosts();
    
    // Ako već imamo više od 3 relevantna posta
    if (existingPosts.length >= 3) {
      console.log('Pronađeno dovoljno postojećih blog postova. Nema potrebe za novim.');
      
      return {
        id: 0,
        title: 'Zbirni post sa linkovima',
        message: 'Već postoje relevantni postovi',
        existingPosts: existingPosts.map(post => ({
          id: post.id,
          title: post.title,
          slug: post.slug
        }))
      };
    }
    
    // Ako imamo 1-2 postojeća posta, ali želimo kompletirajući post
    if (existingPosts.length > 0 && existingPosts.length < 3) {
      console.log(`Pronađeno ${existingPosts.length} postojećih blog postova. Kreiram dopunski post.`);
    }
    
    // Generisanje sadržaja novog posta
    const content = await generateBZRObligationsContent();
    
    // Definisanje metapodataka blog posta
    const title = 'Obaveze lica za bezbednost i zdravlje na radu: Sveobuhvatan vodič';
    const slug = generateSlug(title);
    const excerpt = 'Detaljni pregled svih zakonskih obaveza lica za bezbednost i zdravlje na radu prema najnovijem Zakonu o bezbednosti i zdravlju na radu Republike Srbije.';
    const imageUrl = 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&auto=format&fit=crop';
    
    // Kreiranje blog posta
    const blogPost = await storage.createBlogPost({
      title,
      slug,
      content,
      excerpt,
      imageUrl,
      category: 'propisi',
      tags: ['lice za BZR', 'zakonske obaveze', 'bezbednost i zdravlje na radu', 'zakon o BZR'],
      status: 'published',
      authorId: null, // AI generisani sadržaj
      publishedAt: new Date()
    });
    
    console.log(`Uspešno kreiran blog post ID: ${blogPost.id}`);
    console.log(`Naslov: ${blogPost.title}`);
    console.log(`Slug: ${blogPost.slug}`);
    console.log(`Status: ${blogPost.status}`);
    
    return {
      ...blogPost,
      existingPosts: existingPosts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug
      }))
    };
  } catch (error) {
    console.error('Greška pri kreiranju blog posta:', error);
    throw error;
  }
}

/**
 * Pokretanje skripte
 */
async function main() {
  try {
    console.log('Započinjem analizu i kreiranje blog posta o obavezama lica za BZR...');
    const result = await createBZRObligationsBlogPost();
    
    if (result.message === 'Već postoje relevantni postovi') {
      console.log('───────────────────────────────────────────────');
      console.log('🔍 PRONAĐENI POSTOJEĆI BLOG POSTOVI O OBAVEZAMA LICA ZA BZR');
      console.log('───────────────────────────────────────────────');
      
      result.existingPosts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title} (ID: ${post.id})`);
        console.log(`   URL: /blog/${post.slug}`);
      });
      
      console.log('───────────────────────────────────────────────');
      console.log('✅ Nema potrebe za kreiranjem novog blog posta jer već postoji dovoljno sadržaja.');
    } else {
      console.log('───────────────────────────────────────────────');
      console.log('✅ BLOG POST USPEŠNO KREIRAN!');
      console.log('───────────────────────────────────────────────');
      console.log(`ID: ${result.id}`);
      console.log(`Naslov: ${result.title}`);
      console.log(`URL: /blog/${result.slug}`);
      console.log(`Status: ${result.status}`);
      
      if (result.existingPosts && result.existingPosts.length > 0) {
        console.log('───────────────────────────────────────────────');
        console.log('🔍 TAKOĐE PRONAĐENI POSTOJEĆI RELEVANTNI BLOG POSTOVI:');
        
        result.existingPosts.forEach((post, index) => {
          console.log(`${index + 1}. ${post.title} (ID: ${post.id})`);
          console.log(`   URL: /blog/${post.slug}`);
        });
      }
    }
    
    console.log('───────────────────────────────────────────────');
    exit(0);
  } catch (error) {
    console.error('Greška pri izvršavanju skripte:', error);
    exit(1);
  }
}

main();