import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { transliterate } from '../utils/transliterate';
import { SitemapService } from '../services/sitemap-service';

/**
 * Postavljanje ruta za blogove
 */
export async function setupBlogRoutes(app: any) {
  const router = Router();
  
  /**
   * Funkcija za ažuriranje sitemap.xml-a nakon promena blog postova
   */
  async function updateSitemap(req: Request) {
    try {
      // Dobavljanje host-a iz zahteva za kreiranje apsolutnih URL-ova
      const protocol = req.protocol;
      const host = req.get('host') || 'localhost:5000';
      const domain = `${protocol}://${host}`;
      
      // Inicijalizacija sitemap servisa i generisanje sitemap-a
      const sitemapService = new SitemapService(domain);
      await sitemapService.generateSitemap();
      
      console.log('Sitemap uspešno ažuriran nakon promene blog posta');
    } catch (error) {
      console.error('Greška pri ažuriranju sitemap-a:', error);
    }
  }
  
  /**
   * Dobija sve objavljene blogove
   * 
   * @route GET /api/blogs
   * @param {string} category - Filter po kategoriji (opciono)
   * @param {number} limit - Broj blogova za vraćanje (opciono, podrazumevano: 10)
   * @param {number} offset - Offset za paginaciju (opciono, podrazumevano: 0)
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      let blogs;
      
      if (category) {
        blogs = await storage.getBlogPostsByCategory(category);
        // Filtriramo samo objavljene blogove
        blogs = blogs.filter(blog => blog.status === 'published');
      } else {
        blogs = await storage.getBlogPostsByStatus('published');
      }
      
      // Paginacija
      const totalCount = blogs.length;
      const paginatedBlogs = blogs.slice(offset, offset + limit);
      
      return res.status(200).json({
        success: true,
        blogs: paginatedBlogs,
        totalCount,
        limit,
        offset
      });
    } catch (error: any) {
      console.error('Greška pri dobavljanju blogova:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Došlo je do greške pri dobavljanju blogova'
      });
    }
  });
  
  /**
   * Dobija blog post po slug-u
   * 
   * @route GET /api/blog/get-by-slug/:slug
   * @param {string} slug - Slug bloga
   */
  /**
   * Dobija blog post po ID-u
   * 
   * @route GET /api/blog/:id
   * @param {string} id - ID bloga
   */
  router.get('/:id([0-9]+)', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const blog = await storage.getBlogPost(parseInt(id));
      
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog post nije pronađen'
        });
      }
      
      // Provera da li je blog objavljen
      if (blog.status !== 'published') {
        // Ako korisnik nije admin ili autor, ne može da vidi neobjavljen blog
        if (!req.user || ((req.user as any).role !== 'admin' && blog.authorId !== (req.user as any).id)) {
          return res.status(403).json({
            success: false,
            message: 'Nemate dozvolu za pristup ovom blogu'
          });
        }
      }
      
      return res.status(200).json({
        success: true,
        blog
      });
    } catch (error: any) {
      console.error('Greška pri dobavljanju blog posta:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Došlo je do greške pri dobavljanju blog posta'
      });
    }
  });
  
  router.get('/get-by-slug/:slug', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      const blog = await storage.getBlogPostBySlug(slug);
      
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog post nije pronađen'
        });
      }
      
      // Provera da li je blog objavljen
      if (blog.status !== 'published') {
        // Ako korisnik nije admin, ne može da vidi neobjavljen blog
        if (!req.user || (req.user as any).role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Nemate dozvolu za pristup ovom blogu'
          });
        }
      }
      
      // Inkrementiranje view count-a
      await storage.incrementBlogViewCount(blog.id);
      
      return res.status(200).json({
        success: true,
        blog
      });
    } catch (error: any) {
      console.error('Greška pri dobavljanju blog posta:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Došlo je do greške pri dobavljanju blog posta'
      });
    }
  });
  
  /**
   * Ruta dostupna samo administratorima
   * Dobija sve blog postove na čekanju za odobrenje
   * 
   * @route GET /api/blogs/admin/pending
   */
  router.get('/admin/pending', async (req: Request, res: Response) => {
    try {
      // Provera autorizacije
      if (!req.user || (req.user as any).role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Nemate dozvolu za pristup ovoj stranici'
        });
      }
      
      const blogs = await storage.getBlogPostsByStatus('pending_approval');
      
      return res.status(200).json({
        success: true,
        blogs
      });
    } catch (error: any) {
      console.error('Greška pri dobavljanju blog postova na čekanju:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Došlo je do greške pri dobavljanju blog postova na čekanju'
      });
    }
  });
  
  /**
   * Ruta dostupna samo administratorima
   * Odobrava ili odbija blog post
   * 
   * @route PUT /api/blogs/admin/:id/approval
   * @param {string} id - ID blog posta
   * @param {string} action - Akcija (approve/reject)
   * @param {string} feedback - Povratna informacija administratora (opciono)
   */
  router.put('/admin/:id/approval', async (req: Request, res: Response) => {
    try {
      // Provera autorizacije
      if (!req.user || (req.user as any).role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Nemate dozvolu za pristup ovoj stranici'
        });
      }
      
      const { id } = req.params;
      const { action, feedback } = req.body;
      
      if (!action || (action !== 'approve' && action !== 'reject')) {
        return res.status(400).json({
          success: false,
          message: 'Nedostaje obavezni parametar action (approve/reject)'
        });
      }
      
      const blog = await storage.getBlogPost(parseInt(id));
      
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog post nije pronađen'
        });
      }
      
      // Ažuriranje statusa
      const now = new Date();
      const updateData: any = {
        status: action === 'approve' ? 'published' : 'rejected',
        updatedAt: now,
        adminFeedback: feedback || null
      };
      
      // Ako je post odobren, postavi i datum objavljivanja
      if (action === 'approve') {
        updateData.publishedAt = now;
      }
      
      const updatedBlog = await storage.updateBlogPost(blog.id, updateData);
      
      // Ako je post odobren, ažuriramo sitemap
      if (action === 'approve') {
        await updateSitemap(req);
      }
      
      return res.status(200).json({
        success: true,
        message: action === 'approve' ? 'Blog post je uspešno objavljen' : 'Blog post je odbijen',
        blog: updatedBlog
      });
    } catch (error: any) {
      console.error('Greška pri odobravanju/odbijanju blog posta:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Došlo je do greške pri odobravanju/odbijanju blog posta'
      });
    }
  });
  
  /**
   * Ažurira postojeći blog post
   * 
   * @route PUT /api/blog/:id
   * @param {string} id - ID blog posta
   */
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      // Provera autorizacije - samo admin ili autor mogu menjati post
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Niste autorizovani'
        });
      }
      
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).role === 'admin';
      const { id } = req.params;
      
      // Dobavljanje blog posta
      const blog = await storage.getBlogPost(parseInt(id));
      
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog post nije pronađen'
        });
      }
      
      // Provera da li je korisnik autor ili admin
      if (blog.authorId !== userId && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Nemate dozvolu za izmenu ovog blog posta'
        });
      }
      
      // Uzimanje podataka za ažuriranje iz tela zahteva
      const { title, content, excerpt, category, tags, status, imageUrl } = req.body;
      
      // Kreiranje novog slug-a ako je naslov promenjen
      let slug = blog.slug;
      if (title && title !== blog.title) {
        const baseSlug = transliterate(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const existingPosts = await storage.getAllBlogPosts();
        const existingSlugs = existingPosts.filter(post => post.id !== blog.id).map(post => post.slug);
        
        // Generisanje jedinstvenog slug-a
        slug = baseSlug;
        let counter = 1;
        while (existingSlugs.includes(slug)) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }
      
      // Pripremanje podataka za ažuriranje
      const updateData: any = {
        updatedAt: new Date()
      };
      
      // Dodajemo samo podatke koji su prosleđeni
      if (title) updateData.title = title;
      if (content) updateData.content = content;
      if (excerpt) updateData.excerpt = excerpt;
      if (category) updateData.category = category;
      if (tags) updateData.tags = tags;
      if (imageUrl) updateData.imageUrl = imageUrl;
      if (status && isAdmin) updateData.status = status; // samo admin može menjati status
      updateData.slug = slug; // Uvek ažurirati slug
      
      // Ažuriranje blog posta u storage-u
      const updatedBlog = await storage.updateBlogPost(blog.id, updateData);
      
      // Ažuriramo sitemap samo ako je post objavljen ili izmenjen objavljeni post
      if (updatedBlog && updatedBlog.status === 'published') {
        await updateSitemap(req);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Blog post uspešno ažuriran',
        blog: updatedBlog
      });
    } catch (error: any) {
      console.error('Greška pri ažuriranju blog posta:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Došlo je do greške pri ažuriranju blog posta'
      });
    }
  });

  app.use('/api/blog', router);
}