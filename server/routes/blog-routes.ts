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
    // Napomena: publishedAt će biti postavljen u storage.updateBlogPost
    // zato što nije deo schema definicije
    
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
blogRouter.post("/ai-to-blog", async (req: Request, res: Response) => {
  try {
    const { originalQuestion, aiResponse, category, tags } = req.body;
    
    if (!originalQuestion || !aiResponse) {
      return res.status(400).json({ message: "Pitanje i AI odgovor su obavezni" });
    }
    
    // Ekstrakcija relevantnih informacija iz AI odgovora
    // Prvih 150 karaktera za excerpt
    const excerpt = aiResponse.substring(0, 150) + "...";
    
    // Generisanje atraktivnog naslova pomoću AI (simulacija)
    // U pravoj implementaciji, ovde bi se koristio API poziv ka AI servisu
    const wordsInQuestion = originalQuestion.split(' ');
    let title = originalQuestion;
    
    // Ako je pitanje predugačko, generišemo kraći naslov
    if (wordsInQuestion.length > 8) {
      // Izdvajamo ključne reči i transformišemo ih u atraktivan naslov
      const keyWords = wordsInQuestion
        .filter((word: string) => word.length > 3)
        .slice(0, 5)
        .join(' ');
      
      title = keyWords.charAt(0).toUpperCase() + keyWords.slice(1);
      
      // Dodajemo upečatljiv prefiks ako naslov deluje previše generički
      if (title.length < 20) {
        const prefixes = [
          "Važno: ", 
          "Vodič: ", 
          "Ključno za znati: ", 
          "Stručni savet: ", 
          "Neophodno za bezbednost: "
        ];
        const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        title = randomPrefix + title;
      }
    } else {
      // Ako je pitanje kratko, samo ga ulepšavamo
      title = title.charAt(0).toUpperCase() + title.slice(1);
      
      // Dodajemo odgovarajući sufiks da bude atraktivnije
      const suffixes = [
        " - Sve što treba da znate",
        " - Kompletan vodič",
        " - Praktični saveti",
        " - Zakonska regulativa",
        " - Odgovor stručnjaka"
      ];
      const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      title += randomSuffix;
    }
    
    // Generisanje sluga
    const allPosts = await storage.getAllBlogPosts();
    const existingSlugs = allPosts.map(post => post.slug);
    const baseSlug = generateSlug(title);
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);
    
    // Postavljanje autora na trenutnog korisnika ako je autentifikovan
    let authorId = null;
    if (req.isAuthenticated && req.isAuthenticated()) {
      authorId = (req.user as any).id;
    }
    
    // Generisanje URL-a do odgovarajuće slike
    // U pravoj implementaciji, ovde bi se koristio AI za generisanje relevantne slike
    // ili bi se izabrala relevantna slika iz predefinisane galerije
    const imageKeywords = originalQuestion.split(' ')
      .filter((word: string) => word.length > 4)
      .slice(0, 3)
      .join('-')
      .toLowerCase();
    
    // Mapa kategorija i odgovarajućih defaultnih slika
    const categoryImages: Record<string, string> = {
      'bezbednost-na-radu': 'https://placehold.co/600x400/orange/white?text=Bezbednost',
      'regulative': 'https://placehold.co/600x400/blue/white?text=Regulative',
      'zaštita-zdravlja': 'https://placehold.co/600x400/green/white?text=Zdravlje',
      'procedure': 'https://placehold.co/600x400/gray/white?text=Procedure',
      'procena-rizika': 'https://placehold.co/600x400/red/white?text=Rizici',
      'obuke-zaposlenih': 'https://placehold.co/600x400/purple/white?text=Obuke',
      'novosti': 'https://placehold.co/600x400/teal/white?text=Novosti',
      'saveti': 'https://placehold.co/600x400/brown/white?text=Saveti',
      'propisi': 'https://placehold.co/600x400/navy/white?text=Propisi',
      'general': 'https://placehold.co/600x400/black/white?text=BZR'
    };
    
    const selectedCategory = category || 'general';
    const imageUrl = categoryImages[selectedCategory] || categoryImages['general'];
    
    // Priprema podataka za kreiranje blog posta
    const blogData = {
      title,
      slug: uniqueSlug,
      content: aiResponse,
      excerpt,
      imageUrl, // Dodajemo URL do slike
      category: selectedCategory,
      tags: tags || ['bezbednost', 'informacije', 'zaštita'],
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
    
    // Priprema podataka za ažuriranje
    const updatedData: any = { status };
    
    if (adminFeedback) {
      updatedData.adminFeedback = adminFeedback;
    }
    
    // Napomena: u storage.updateBlogPost će se rukovati postavljanjem publishedAt ako je status "published"
    
    const updatedPost = await storage.updateBlogPost(id, updatedData);
    res.json(updatedPost);
  } catch (error) {
    console.error("Greška pri promeni statusa blog posta:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});