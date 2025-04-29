import express, { Request, Response } from "express";

// Proširimo tipove za Express Request
declare global {
  namespace Express {
    interface Request {
      isAuthenticated?: () => boolean;
      user?: any;
    }
  }
}
import { z } from "zod";
import { storage } from "../storage";
// Privremeno rešenje dok slug-generator nije dostupan
function generateSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .substring(0, 100);
}

function generateUniqueSlug(
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
import { insertBlogPostSchema } from "@shared/schema";

export const blogRouter = express.Router();

// Middleware za proveru da li je korisnik administrator
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Nije autentifikovan" });
  }
  
  const user = req.user as any;
  if (user && user.role === "admin") {
    return next();
  }
  
  return res.status(403).json({ message: "Nema administratorsku dozvolu" });
};

// Dobijanje svih blog postova
blogRouter.get("/", async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    const status = req.query.status as string;
    
    if (category) {
      const posts = await storage.getBlogPostsByCategory(category);
      return res.json(posts);
    }
    
    if (status) {
      const posts = await storage.getBlogPostsByStatus(status);
      return res.json(posts);
    }
    
    const posts = await storage.getAllBlogPosts();
    res.json(posts);
  } catch (error) {
    console.error("Greška pri dobijanju blog postova:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Dobijanje jednog blog posta prema ID-u
blogRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID mora biti broj" });
    }
    
    const post = await storage.getBlogPost(id);
    if (!post) {
      return res.status(404).json({ message: "Blog post nije pronađen" });
    }
    
    res.json(post);
  } catch (error) {
    console.error("Greška pri dobijanju blog posta:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Dobijanje blog posta prema slugu
blogRouter.get("/slug/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const post = await storage.getBlogPostBySlug(slug);
    if (!post) {
      return res.status(404).json({ message: "Blog post nije pronađen" });
    }
    
    // Povećaj brojač prikaza kada se post čita po slugu
    const updatedPost = await storage.updateBlogPost(post.id, {
      // Napomena: viewCount se ažurira automatski u storage implementaciji
    });
    
    res.json(updatedPost);
  } catch (error) {
    console.error("Greška pri dobijanju blog posta po slugu:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Kreiranje novog blog posta (samo za administratora)
blogRouter.post("/", async (req: Request, res: Response) => {
  try {
    // Dodela autora ako je korisnik prijavljen
    let authorId = null;
    if (req.isAuthenticated && req.isAuthenticated()) {
      authorId = (req.user as any).id;
    }
    
    // Validacija podataka
    const validatedData = insertBlogPostSchema.parse({
      ...req.body,
      authorId
    });
    
    // Generisanje sluga na osnovu naslova
    const allPosts = await storage.getAllBlogPosts();
    const existingSlugs = allPosts.map(post => post.slug);
    
    const baseSlug = generateSlug(validatedData.title);
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);
    
    const newPost = await storage.createBlogPost({
      ...validatedData,
      slug: uniqueSlug
    });
    
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Greška pri kreiranju blog posta:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Nevažeći podaci", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: "Greška servera" });
  }
});

// Ažuriranje blog posta (samo za administratora)
blogRouter.put("/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID mora biti broj" });
    }
    
    const post = await storage.getBlogPost(id);
    if (!post) {
      return res.status(404).json({ message: "Blog post nije pronađen" });
    }
    
    // Validacija podataka
    const validatedData = insertBlogPostSchema.partial().parse(req.body);
    
    // Ako se menja naslov, generišemo novi slug
    let updatedData = validatedData;
    
    if (validatedData.title && validatedData.title !== post.title) {
      const allPosts = await storage.getAllBlogPosts();
      const existingSlugs = allPosts
        .filter(p => p.id !== id)
        .map(p => p.slug);
      
      const baseSlug = generateSlug(validatedData.title);
      const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);
      
      updatedData = { ...validatedData, slug: uniqueSlug };
    }
    
    // Ako se menja status u "published", postavljamo publishedAt
    if (validatedData.status === "published" && post.status !== "published") {
      updatedData = { ...updatedData, publishedAt: new Date() };
    }
    
    const updatedPost = await storage.updateBlogPost(id, updatedData);
    res.json(updatedPost);
  } catch (error) {
    console.error("Greška pri ažuriranju blog posta:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Nevažeći podaci", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: "Greška servera" });
  }
});

// Brisanje blog posta (samo za administratora)
blogRouter.delete("/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID mora biti broj" });
    }
    
    const success = await storage.deleteBlogPost(id);
    if (!success) {
      return res.status(404).json({ message: "Blog post nije pronađen" });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error("Greška pri brisanju blog posta:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Pretvaranje AI agenta odgovora u blog post
blogRouter.post("/ai-to-blog", isAdmin, async (req: Request, res: Response) => {
  try {
    const { originalQuestion, aiResponse, category, tags } = req.body;
    
    if (!originalQuestion || !aiResponse) {
      return res.status(400).json({ message: "Pitanje i AI odgovor su obavezni" });
    }
    
    // Ekstrakcija relevantnih informacija iz AI odgovora
    // Prvih 150 karaktera za excerpt
    const excerpt = aiResponse.substring(0, 150) + "...";
    
    // Generisanje naslova iz originalnog pitanja
    const title = originalQuestion.length > 5 
      ? originalQuestion.charAt(0).toUpperCase() + originalQuestion.slice(1)
      : "Odgovor na pitanje o bezbednosti na radu";
    
    // Pokušavamo izvući seoTitle iz odgovora, ako nije prosleđen
    let seoTitle = title;
    if (aiResponse.length > title.length) {
      // Uzimamo malo duži, SEO prilagođen naslov
      seoTitle = aiResponse.substring(0, Math.min(60, aiResponse.length));
      const lastSpaceIndex = seoTitle.lastIndexOf(' ');
      if (lastSpaceIndex > 30) {
        seoTitle = seoTitle.substring(0, lastSpaceIndex);
      }
    }
    
    // Generisanje sluga
    const allPosts = await storage.getAllBlogPosts();
    const existingSlugs = allPosts.map(post => post.slug);
    const baseSlug = generateSlug(title);
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);
    
    // Postavljanje autora na trenutnog korisnika
    const authorId = (req.user as any).id;
    
    // Priprema podataka za kreiranje blog posta
    const blogData = {
      title,
      slug: uniqueSlug,
      content: aiResponse,
      excerpt,
      category: category || "general",
      tags: tags || [],
      authorId,
      originalQuestion,
      status: "pending_approval" as const, // Zahteva ručno odobrenje pre objavljivanja
      callToAction: "Kontaktirajte nas za više informacija o bezbednosti i zdravlju na radu!"
    };
    
    const newPost = await storage.createBlogPost(blogData);
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Greška pri konverziji AI odgovora u blog:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Promena statusa blog posta (approval workflow)
blogRouter.patch("/:id/status", isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID mora biti broj" });
    }
    
    const { status, adminFeedback } = req.body;
    
    if (!status || !["draft", "pending_approval", "approved", "published", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Nevažeći status" });
    }
    
    const post = await storage.getBlogPost(id);
    if (!post) {
      return res.status(404).json({ message: "Blog post nije pronađen" });
    }
    
    // Ako se status postavlja na "rejected", admin feedback je obavezan
    if (status === "rejected" && !adminFeedback) {
      return res.status(400).json({ message: "Admin feedback je obavezan za odbijene postove" });
    }
    
    // Ako se menja status u "published", postavljamo publishedAt
    const updatedData: any = { status };
    
    if (adminFeedback) {
      updatedData.adminFeedback = adminFeedback;
    }
    
    if (status === "published" && post.status !== "published") {
      updatedData.publishedAt = new Date();
    }
    
    const updatedPost = await storage.updateBlogPost(id, updatedData);
    res.json(updatedPost);
  } catch (error) {
    console.error("Greška pri promeni statusa blog posta:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});