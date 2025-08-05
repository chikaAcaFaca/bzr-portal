import { storage } from '../storage';
import fs from 'fs';
import path from 'path';
import { formatISO, differenceInDays } from 'date-fns';

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Određuje učestalost promene (changefreq) za sitemap na osnovu poslednjeg ažuriranja
 * @param lastModified Datum poslednjeg ažuriranja
 * @returns Učestalost promene za sitemap
 */
function determineChangeFrequency(lastModified: Date | null): 'daily' | 'weekly' | 'monthly' | 'yearly' {
  if (!lastModified) return 'monthly';
  
  const daysSinceModified = differenceInDays(new Date(), lastModified);
  
  if (daysSinceModified < 7) {
    return 'daily';
  } else if (daysSinceModified < 30) {
    return 'weekly';
  } else if (daysSinceModified < 365) {
    return 'monthly';
  } else {
    return 'yearly';
  }
}

/**
 * Određuje prioritet URL-a za sitemap
 * @param type Tip URL-a ('home', 'blog-index', 'blog-post', 'category', 'auth')
 * @param viewCount Broj pregleda (samo za blog postove)
 * @returns Prioritet od 0.0 do 1.0
 */
function determinePriority(type: string, viewCount?: number): number {
  switch (type) {
    case 'home':
      return 1.0;
    case 'blog-index':
      return 0.9;
    case 'blog-post':
      // Ako imamo broj pregleda, koristimo ga za određivanje prioriteta (popularni članci imaju veći prioritet)
      if (viewCount !== undefined && viewCount > 0) {
        // Normalizujemo broj pregleda u opseg od 0.7 do 0.9
        const viewBonus = Math.min(0.2, viewCount / 1000 * 0.2);
        return 0.7 + viewBonus;
      }
      return 0.8;
    case 'category':
      return 0.8;
    case 'auth':
    default:
      return 0.5;
  }
}

/**
 * Generiše sitemap.xml fajl za Google Search Console
 */
export async function generateSitemap(domain: string): Promise<string> {
  try {
    const entries: SitemapEntry[] = [];
    
    // Dodaj statičke stranice
    entries.push({
      url: `${domain}/`,
      changefreq: 'weekly',
      priority: determinePriority('home')
    });
    
    entries.push({
      url: `${domain}/blog`,
      changefreq: 'daily',
      priority: determinePriority('blog-index')
    });
    
    entries.push({
      url: `${domain}/auth`,
      changefreq: 'monthly',
      priority: determinePriority('auth')
    });

    // Dodaj blog postove
    const blogs = await storage.getAllBlogPosts();
    
    // Pratimo kategorije blogova
    const categoriesMap: Record<string, boolean> = {};
    
    for (const blog of blogs) {
      // Preskoci blog postove koji nisu objavljeni
      if (blog.status !== 'published') continue;
      
      // Dodaj kategoriju ako postoji
      if (blog.category) {
        categoriesMap[blog.category] = true;
      }
      
      // Odredi učestalost promene na osnovu datuma ažuriranja
      const changefreq = determineChangeFrequency(blog.updatedAt);
      
      // Odredi prioritet na osnovu broja pregleda
      const priority = determinePriority('blog-post', blog.viewCount || 0);
      
      entries.push({
        url: `${domain}/blog/${blog.slug}`,
        lastmod: blog.updatedAt ? formatISO(blog.updatedAt, { representation: 'date' }) : undefined,
        changefreq,
        priority
      });
    }
    
    // Dodaj stranice kategorija
    const categories = Object.keys(categoriesMap);
    for (const category of categories) {
      const categoryUrl = category.toLowerCase().replace(/\s+/g, '-');
      
      entries.push({
        url: `${domain}/blog/category/${categoryUrl}`,
        changefreq: 'weekly',
        priority: determinePriority('category')
      });
    }
    
    // Generiši XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    for (const entry of entries) {
      xml += '  <url>\n';
      xml += `    <loc>${entry.url}</loc>\n`;
      if (entry.lastmod) {
        xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
      }
      if (entry.changefreq) {
        xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
      }
      if (entry.priority !== undefined) {
        xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
      }
      xml += '  </url>\n';
    }
    
    xml += '</urlset>';

    // Sačuvaj fajl u public direktorijumu
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const sitemapPath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, xml);
    
    return sitemapPath;
  } catch (error) {
    console.error('Greška pri generisanju sitemap-a:', error);
    throw error;
  }
}

/**
 * Servis za automatsko generisanje i održavanje sitemap-a
 */
export class SitemapService {
  private domain: string;
  
  constructor(domain: string) {
    this.domain = domain;
  }
  
  /**
   * Generiše sitemap.xml fajl
   */
  async generateSitemap(): Promise<string> {
    return generateSitemap(this.domain);
  }
  
  /**
   * Vraća putanju do sitemap.xml fajla
   */
  getSitemapPath(): string {
    return path.join(process.cwd(), 'public', 'sitemap.xml');
  }
  
  /**
   * Vraća URL do sitemap.xml fajla
   */
  getSitemapUrl(): string {
    return `${this.domain}/sitemap.xml`;
  }
}