import { storage } from '../storage';
import axios from 'axios';
import { notificationService } from './notification-service';
import { InsertBlogPost } from '@shared/schema';

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
   * Kreira blog post od odgovora AI asistenta
   */
  public async createBlogFromAIResponse({
    originalQuestion,
    aiResponse,
    userId,
    category = 'general',
    tags = []
  }: CreateBlogFromAIParams) {
    try {
      // 1. Generisanje naslova
      const title = await this.generateBlogTitle(originalQuestion, aiResponse);
      
      // 2. Kreiranje sluga
      const baseSlug = this.createSlug(title);
      const existingBlogPosts = await storage.getAllBlogPosts();
      const existingSlugs = existingBlogPosts.map(post => post.slug);
      const uniqueSlug = this.generateUniqueSlug(baseSlug, existingSlugs);
      
      // 3. Kreiranje excerpta
      const excerpt = this.createExcerpt(aiResponse, 150);
      
      // 4. Dobavljanje relevantne slike
      const imageUrl = await this.getImageForBlogPost(title, category);

      // 5. Kreiranje blog posta
      const blogData: InsertBlogPost = {
        title,
        slug: uniqueSlug,
        content: aiResponse,
        excerpt,
        imageUrl,
        category,
        tags: [...tags, 'bezbednost', 'bzr', 'zaštita'], // Dodajemo defaultne tagove
        authorId: userId || null, // Koristimo null ako nemamo ID korisnika
        originalQuestion, // Čuvamo originalno pitanje
        status: "pending_approval", // Zahteva ručno odobrenje pre objavljivanja
        callToAction: "Želite li više informacija o bezbednosti i zdravlju na radu? Kontaktirajte nas!"
      };
      
      // 6. Čuvanje u bazi
      const newPost = await storage.createBlogPost(blogData);
      
      // 7. Obaveštavanje administratora
      await notificationService.notifyBlogApproval(newPost.id, title);
      
      return newPost;
    } catch (error) {
      console.error("Greška pri kreiranju bloga iz AI odgovora:", error);
      throw error;
    }
  }

  /**
   * Kreira excerpt od sadržaja (kratak opis)
   */
  private createExcerpt(text: string, maxLength = 150): string {
    if (text.length <= maxLength) return text;
    
    // Prvo probamo da nađemo prirodnu tačku prekida
    const sentences = text.split(/(?<=[.!?])\s+/);
    let excerpt = sentences[0];
    
    let i = 1;
    while (excerpt.length < 100 && i < sentences.length) {
      excerpt += ' ' + sentences[i];
      i++;
    }
    
    // Ako je i dalje prekratko ili predugačko
    if (excerpt.length < 50) {
      return text.substring(0, maxLength) + '...';
    } else if (excerpt.length > maxLength) {
      return excerpt.substring(0, maxLength) + '...';
    }
    
    return excerpt + '...';
  }

  /**
   * Generiše jedinstveni slug baziran na naslovu
   */
  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  /**
   * Generiše jedinstveni slug ako već postoji
   */
  private generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
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

  /**
   * Generiše optimizovani naslov za blog post na osnovu pitanja
   */
  private async generateBlogTitle(question: string, answer: string): Promise<string> {
    // Pojednostavljena verzija - u realnoj implementaciji, ovde bi bio poziv ka AI servisu
    const wordsInQuestion = question.split(' ');
    
    // Ako je pitanje kratko, koristimo ga kao naslov
    if (wordsInQuestion.length <= 8) {
      // Samo popravimo prvo slovo da bude veliko
      return question.charAt(0).toUpperCase() + question.slice(1);
    }
    
    // Ako je pitanje dugo, kreirajmo sažetu verziju
    const keyWords = wordsInQuestion
      .filter(word => word.length > 3)
      .slice(0, 5)
      .join(' ');
    
    let title = keyWords.charAt(0).toUpperCase() + keyWords.slice(1);
    
    // Dodajemo upečatljiv prefiks ako naslov deluje previše generički
    if (title.length < 20) {
      const prefixes = [
        "Vodič: ", 
        "Ključno za znati: ", 
        "Stručni savet: ", 
        "Važno za bezbednost: ",
        "Kako pravilno: "
      ];
      const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      title = randomPrefix + title;
    }
    
    return title;
  }

  /**
   * Dobavlja relevantnu sliku za blog post
   */
  private async getImageForBlogPost(title: string, category: string): Promise<string> {
    // Privremeno rešenje - koristimo predefinisane slike za kategorije
    // U realnoj implementaciji, koristiti Unsplash, Pexels ili drugi servis za pretragu slika
    const categoryImages: Record<string, string> = {
      'bezbednost': 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?q=80&w=800',
      'regulative': 'https://images.unsplash.com/photo-1589391886645-d51941baf7fb?q=80&w=800',
      'zaštita-zdravlja': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800',
      'procedure': 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?q=80&w=800',
      'procena-rizika': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800',
      'obuke-zaposlenih': 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800',
      'novosti': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800',
      'saveti': 'https://images.unsplash.com/photo-1521790361543-f645cf042ec4?q=80&w=800',
      'propisi': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800',
      'general': 'https://images.unsplash.com/photo-1590402494610-2c378a9114c6?q=80&w=800'
    };
    
    return categoryImages[category] || categoryImages['general'];
  }
}

export const blogCreationService = new BlogCreationService();