import { storage } from '../storage';
import fs from 'fs';
import path from 'path';
import { formatISO } from 'date-fns';

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
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
      priority: 1.0
    });
    
    entries.push({
      url: `${domain}/blog`,
      changefreq: 'daily',
      priority: 0.9
    });
    
    entries.push({
      url: `${domain}/auth`,
      changefreq: 'monthly',
      priority: 0.5
    });

    // Dodaj blog postove
    const blogs = await storage.getAllBlogPosts();
    for (const blog of blogs) {
      entries.push({
        url: `${domain}/blog/${blog.slug}`,
        lastmod: blog.updatedAt ? formatISO(blog.updatedAt, { representation: 'date' }) : undefined,
        changefreq: 'weekly',
        priority: 0.8
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
}