/**
 * Servis za pretragu relevantnih blog postova na osnovu upita korisnika
 */

import { storage } from '../storage';
import { BlogPost } from '@shared/schema';

export class BlogSearchService {
  
  /**
   * Pronalazi blog postove koji su relevantni za zadati upit
   * 
   * @param query Korisničko pitanje
   * @param minRelevanceScore Minimalni skor relevantnosti (0-1)
   * @returns Niz relevantnih blog postova, sortiranih po relevantnosti
   */
  public async findRelevantBlogPosts(query: string, minRelevanceScore: number = 0.3): Promise<BlogPost[]> {
    try {
      console.log(`Traženje relevantnih blog postova za upit: "${query}"`);
      
      // 1. Dobavljanje svih objavljenih blog postova
      const allPosts = await storage.getBlogPostsByStatus('published');
      
      if (!allPosts || allPosts.length === 0) {
        console.log('Nema objavljenih blog postova za pretragu.');
        return [];
      }
      
      console.log(`Pronađeno ${allPosts.length} objavljenih blog postova.`);
      
      // 2. Izvlačenje ključnih reči iz upita
      const keywords = this.extractKeywords(query);
      console.log(`Izvučene ključne reči: ${keywords.join(', ')}`);
      
      // 3. Ocenjivanje relevantnosti svakog blog posta
      const scoredPosts = allPosts.map(post => {
        const score = this.calculateRelevanceScore(post, keywords, query);
        return { post, score };
      });
      
      // 4. Filtriranje i sortiranje postova po relevantnosti
      const relevantPosts = scoredPosts
        .filter(item => item.score >= minRelevanceScore)
        .sort((a, b) => b.score - a.score)
        .map(item => item.post);
      
      console.log(`Pronađeno ${relevantPosts.length} relevantnih blog postova sa skorom >= ${minRelevanceScore}.`);
      
      return relevantPosts;
    } catch (error) {
      console.error('Greška pri pretrazi blog postova:', error);
      return [];
    }
  }
  
  /**
   * Izvlači ključne reči iz korisničkog upita
   */
  private extractKeywords(query: string): string[] {
    // Pretvaranje upita u mala slova i uklanjanje specijalnih karaktera
    const normalizedQuery = query.toLowerCase()
      .replace(/[.,?!;:"'()\[\]{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Razdvajanje na reči
    const words = normalizedQuery.split(' ');
    
    // Uklanjanje stop reči (čestih reči koje nisu relevantne za pretragu)
    const stopWords = ['i', 'u', 'na', 'za', 'sa', 'od', 'do', 'je', 'su', 'koji', 'šta', 'kako', 'da', 'li', 'ne', 'to', 'a', 'ali', 'ili'];
    
    // Filtriranje samo relevantnih reči koje imaju više od 3 karaktera ili su u listi BZR ključnih reči
    const bzrKeywords = ['bzr', 'bezbednost', 'zdravlje', 'rad', 'zakon', 'pravilnik', 'propisi', 'rizik', 'opasnost', 'zaštita', 'obuka', 'instrukcije', 'mere'];
    
    const keywords = words.filter(word => 
      (word.length > 3 && !stopWords.includes(word)) || 
      bzrKeywords.includes(word)
    );
    
    return Array.from(new Set(keywords)); // Uklanjanje duplikata
  }
  
  /**
   * Izračunava skor relevantnosti za blog post u odnosu na upit
   */
  private calculateRelevanceScore(post: BlogPost, keywords: string[], originalQuery: string): number {
    const title = post.title.toLowerCase();
    const content = post.content.toLowerCase();
    const tags = post.tags ? post.tags.map(tag => tag.toLowerCase()) : [];
    const category = post.category ? post.category.toLowerCase() : '';
    const excerpt = post.excerpt ? post.excerpt.toLowerCase() : '';
    
    let score = 0;
    
    // 1. Provera podudaranja celih fraza
    if (title.includes(originalQuery.toLowerCase())) score += 0.7;
    if (content.includes(originalQuery.toLowerCase())) score += 0.5;
    if (excerpt.includes(originalQuery.toLowerCase())) score += 0.6;
    
    // 2. Provera podudaranja ključnih reči
    keywords.forEach(keyword => {
      // Veći značaj za ključne reči u naslovu
      if (title.includes(keyword)) score += 0.3;
      
      // Srednji značaj za ključne reči u tagovima i kategoriji
      if (tags.some(tag => tag.includes(keyword))) score += 0.2;
      if (category.includes(keyword)) score += 0.2;
      
      // Manji značaj za ključne reči u sadržaju
      if (content.includes(keyword)) score += 0.1;
    });
    
    // 3. Normalizacija skora (maksimalna vrednost je 1)
    // Ovo je pojednostavljeni model, može se unaprediti sofisticiranijim algoritmom
    const maxPossibleScore = 0.7 + 0.5 + 0.6 + (keywords.length * (0.3 + 0.2 + 0.2 + 0.1));
    const normalizedScore = Math.min(score / Math.max(1, maxPossibleScore), 1);
    
    return normalizedScore;
  }
}

export const blogSearchService = new BlogSearchService();