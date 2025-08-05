import { storage } from '../storage';
import { InsertBlogPost } from '@shared/schema';
import { transliterate } from '../utils/transliterate';
import { notificationService } from './notification-service';
import { SitemapService } from './sitemap-service';
import fs from 'fs';
import axios from 'axios';

// Protokol i host za domen
const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
const host = process.env.HOST || 'localhost:5000';
const DOMAIN = `${protocol}://${host}`;

interface CreateBlogFromAIParams {
  originalQuestion: string;
  aiResponse: string;
  userId?: number | null; // Može biti null ako je AI generisao sadržaj
  category?: string;
  tags?: string[];
}

/**
 * Servis za automatsko kreiranje blogova iz AI odgovora
 */
class BlogCreationService {
  private readonly imageSearchApi = 'https://serpapi.com/search'; // Možemo koristiti Serpapi ili Unsplash API

  /**
   * Kreira blog post iz AI odgovora i šalje notifikaciju admin korisnicima
   */
  public async createBlogFromAIResponse({
    originalQuestion,
    aiResponse,
    userId = null,
    category = 'general',
    tags = []
  }: CreateBlogFromAIParams) {
    try {
      // 1. Generisanje naslova na osnovu pitanja i odgovora
      const title = await this.generateBlogTitle(originalQuestion, aiResponse);
      
      // 2. Kreiranje excerpta (kratkog opisa)
      const excerpt = this.createExcerpt(aiResponse);
      
      // 3. Kreiranje slug-a
      const baseSlug = this.createSlug(title);
      
      // 4. Provera da li slug već postoji
      const existingPosts = await storage.getAllBlogPosts();
      const existingSlugs = existingPosts.map(post => post.slug);
      const slug = this.generateUniqueSlug(baseSlug, existingSlugs);
      
      // 5. Dobavljanje relevantne slike za blog
      let imageUrl = null;
      try {
        imageUrl = await this.getImageForBlogPost(title, category);
      } catch (imageError) {
        console.warn('Nije moguće dobaviti sliku za blog post:', imageError);
        // Nastavljamo bez slike ako je došlo do greške
      }
      
      // 6. Kreiranje blog posta
      const now = new Date();
      
      const blogData: InsertBlogPost = {
        title,
        content: aiResponse,
        slug,
        excerpt: excerpt || null,
        imageUrl: imageUrl || null,
        category: category || 'general',
        tags: tags || null,
        status: 'pending_approval', // Čeka odobrenje administratora
        authorId: userId,
        originalQuestion: originalQuestion || null,
        adminFeedback: null
      };
      
      // Kreiranje blog posta u storage-u
      const blogPost = await storage.createBlogPost(blogData);
      
      // Slanje notifikacije administratorima za odobrenje
      await notificationService.notifyNewAIBlogPost(blogPost);
      
      // Ažuriranje sitemap-a
      try {
        const sitemapService = new SitemapService(DOMAIN);
        await sitemapService.generateSitemap();
        console.log('Sitemap.xml uspešno ažuriran nakon kreiranja blog posta');
      } catch (sitemapError) {
        console.error('Greška pri ažuriranju sitemap-a:', sitemapError);
        // Nastavljamo bez obzira na grešku u sitemap-u
      }
      
      console.log(`Blog post ${blogPost.id} kreiran i čeka odobrenje administratora.`);
      
      return blogPost;
    } catch (error) {
      console.error('Greška pri kreiranju blog posta iz AI odgovora:', error);
      throw error;
    }
  }

  /**
   * Kreira excerpt od sadržaja (kratak opis)
   */
  private createExcerpt(text: string, maxLength = 150): string {
    // Ukloni eventualne HTML tagove
    let cleanText = text.replace(/<[^>]*>/g, '');
    
    // Smanji na prvu rečenicu ili prvi pasus
    let excerpt = '';
    
    const sentenceEnd = cleanText.search(/[.!?]\s/);
    if (sentenceEnd > 0 && sentenceEnd < maxLength) {
      excerpt = cleanText.substring(0, sentenceEnd + 1);
    } else {
      excerpt = cleanText.substring(0, maxLength);
      // Izbegavaj prekid reči
      const lastSpace = excerpt.lastIndexOf(' ');
      if (lastSpace > 0) {
        excerpt = excerpt.substring(0, lastSpace) + '...';
      } else {
        excerpt = excerpt + '...';
      }
    }
    
    return excerpt;
  }

  /**
   * Generiše jedinstveni slug baziran na naslovu
   */
  private createSlug(title: string): string {
    // Transliteracija ćirilice i dijakritičkih znakova
    let slug = transliterate(title);
    
    // Prebaci u mala slova i zameni sve razmake sa crticama
    slug = slug.toLowerCase().trim();
    
    // Ukloni sve specijalne karaktere osim slova, brojeva, crtica i razmaka
    slug = slug.replace(/[^a-z0-9\s-]/g, '');
    
    // Zameni razmake sa crticama
    slug = slug.replace(/\s+/g, '-');
    
    // Ukloni višestruke crtice
    slug = slug.replace(/-+/g, '-');
    
    return slug;
  }

  /**
   * Generiše jedinstveni slug ako već postoji
   */
  private generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
    if (!existingSlugs.includes(baseSlug)) {
      return baseSlug;
    }
    
    let counter = 1;
    let newSlug = `${baseSlug}-${counter}`;
    
    while (existingSlugs.includes(newSlug)) {
      counter++;
      newSlug = `${baseSlug}-${counter}`;
    }
    
    return newSlug;
  }

  /**
   * Generiše optimizovani naslov za blog post na osnovu pitanja
   */
  private async generateBlogTitle(question: string, answer: string): Promise<string> {
    // Za sada, koristimo jednostavan pristup kreiranja naslova
    // U budućnosti možemo koristiti AI za generisanje naslova
    
    // Ako je pitanje već formulisano kao naslov, koristi ga
    if (question.length < 100 && !question.endsWith('?')) {
      return this.capitalizeFirstLetter(question);
    }
    
    // Ako je pitanje kratko, preformulišemo ga u naslov
    if (question.length < 100) {
      // Ukloni upitnik i trim
      let title = question.replace(/\?/g, '').trim();
      
      // Za pitanja koja počinju sa "Kako", "Šta", "Kada", itd. - reformulisati
      title = title
        .replace(/^kako\s/i, '')
        .replace(/^šta\s/i, '')
        .replace(/^kada\s/i, '')
        .replace(/^gde\s/i, '')
        .replace(/^zašto\s/i, '')
        .replace(/^zbog čega\s/i, '')
        .replace(/^koji\s/i, '')
        .replace(/^kakva\s/i, '')
        .replace(/^ko\s/i, '');
      
      // Prvo slovo veliko, ostala mala, i dodaj relevantnu reč na početak
      title = this.capitalizeFirstLetter(title);
      
      if (title.toLowerCase().includes('rizik') || title.toLowerCase().includes('opasnost')) {
        return `Procena rizika: ${title}`;
      } else if (title.toLowerCase().includes('zakon') || title.toLowerCase().includes('propis')) {
        return `Zakonske odredbe: ${title}`;
      } else if (title.toLowerCase().includes('obuka') || title.toLowerCase().includes('trening')) {
        return `Vodiči za obuku: ${title}`;
      } else {
        return `Vodič za ${title}`;
      }
    }
    
    // Ako je pitanje dugo, izvuci glavne ključne reči i napravi kraći naslov
    // Ovo bi idealno bilo urađeno sa AI, ali za sada koristimo jednostavan pristup
    const words = question.split(' ');
    if (words.length > 10) {
      const firstTenWords = words.slice(0, 10).join(' ');
      return this.capitalizeFirstLetter(firstTenWords) + '...';
    }
    
    return this.capitalizeFirstLetter(question);
  }

  /**
   * Dobavlja relevantnu sliku za blog post koristeći AI generisanje slika
   */
  private async getImageForBlogPost(title: string, category: string): Promise<string> {
    try {
      // Uvezemo servis za generisanje slika
      const { imageGenerationService } = await import('./image-generation-service');
      
      // Generišemo optimizovani prompt za sliku
      const prompt = imageGenerationService.getOptimizedPrompt(title, category);
      
      // Pokušavamo generisati sliku
      console.log('Generisanje slike za blog post:', title);
      console.log('Prompt za sliku:', prompt);
      
      const imageUrl = await imageGenerationService.generateImage(prompt, {
        width: 1200,
        height: 630,
        category
      });
      
      if (imageUrl) {
        console.log('Uspešno generisana AI slika za blog post:', imageUrl);
        return imageUrl;
      }
    } catch (error) {
      console.error('Greška pri generisanju AI slike:', error);
      // Nastavljamo sa default slikama ako je došlo do greške
    }
    
    // Mapiranje kategorija na predefinisane slike (fallback opcija)
    const categoryImages: Record<string, string> = {
      'general': 'https://images.unsplash.com/photo-1618044733300-9472054094ee?q=80&w=1000',
      'regulative': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1000',
      'procena-rizika': 'https://images.unsplash.com/photo-1512758017271-d7b84c2113f1?q=80&w=1000',
      'obuke-zaposlenih': 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1000',
      'zaštita-zdravlja': 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=1000'
    };
    
    // Vrati sliku za kategoriju, ili default sliku ako kategorija ne postoji
    console.log('Korišćenje default slike za kategoriju:', category);
    return categoryImages[category] || categoryImages['general'];
  }
  
  /**
   * Pomoćna funkcija za kapitalizaciju prvog slova
   */
  private capitalizeFirstLetter(text: string): string {
    if (!text || text.length === 0) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

export const blogCreationService = new BlogCreationService();