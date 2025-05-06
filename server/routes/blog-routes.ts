import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { transliterate } from '../utils/transliterate';

/**
 * Postavljanje ruta za blogove
 */
export async function setupBlogRoutes(app: any) {
  const router = Router();
  
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
   * @route GET /api/blog/slug/:slug
   * @param {string} slug - Slug bloga
   */
  router.get('/slug/:slug', async (req: Request, res: Response) => {
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
  
  app.use('/api/blog', router);
}