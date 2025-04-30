import express, { Request, Response } from "express";
import { storage } from "../storage";

// Proširimo tipove za Express Request
declare global {
  namespace Express {
    interface Request {
      isAuthenticated?: () => boolean;
      user?: any;
    }
  }
}

export const adminRouter = express.Router();

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

// Sve admin rute zahtevaju admin privilegije
adminRouter.use(isAdmin);

// Dobijanje statistike korisnika
adminRouter.get("/user-stats", async (req: Request, res: Response) => {
  try {
    // U pravoj implementaciji, ovo bi dolazilo iz baze podataka
    const stats = {
      total: 256,
      free: 198,
      basic: 37,
      pro: 18,
      enterprise: 3,
      // Dodajte dodatne statistike po potrebi
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Greška pri dobijanju statistike korisnika:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Dobijanje statistike aktivnosti na portalu
adminRouter.get("/activity-stats", async (req: Request, res: Response) => {
  try {
    // U pravoj implementaciji, ovo bi dolazilo iz baze podataka
    const stats = {
      aiQuestions: 847,
      documentsGenerated: 392,
      complianceAnalyses: 153,
      blogPostsCreated: 126,
      blogPostsPublished: 87,
      newUsers: 24,
      // Dodajte dodatne statistike po potrebi
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Greška pri dobijanju statistike aktivnosti:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Dobijanje liste korisnika sa pretragom i paginacijom
adminRouter.get("/users", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || "";
    const plan = req.query.plan as string;
    
    // U pravoj implementaciji, ovo bi dolazilo iz baze podataka
    const mockUsers = Array(50).fill(null).map((_, i) => ({
      id: i + 1,
      name: `Korisnik ${i + 1}`,
      email: `korisnik${i + 1}@example.com`,
      company: `Kompanija ${i + 1}`,
      role: i === 0 ? "admin" : "user",
      plan: i % 10 === 0 ? "enterprise" : i % 5 === 0 ? "pro" : i % 3 === 0 ? "basic" : "free",
      employeeCount: Math.floor(Math.random() * 500) + 1,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
      lastLogin: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString()
    }));
    
    // Filtriranje korisnika prema kriterijumima
    let filteredUsers = [...mockUsers];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(searchLower) || 
        user.email.toLowerCase().includes(searchLower) ||
        user.company.toLowerCase().includes(searchLower)
      );
    }
    
    if (plan) {
      filteredUsers = filteredUsers.filter(user => user.plan === plan);
    }
    
    // Paginacija
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    res.json({
      total: filteredUsers.length,
      page,
      totalPages: Math.ceil(filteredUsers.length / limit),
      users: paginatedUsers
    });
  } catch (error) {
    console.error("Greška pri dobijanju korisnika:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Dobijanje detalja određenog korisnika
adminRouter.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    // U pravoj implementaciji, ovo bi dolazilo iz baze podataka
    const user = {
      id,
      name: `Korisnik ${id}`,
      email: `korisnik${id}@example.com`,
      company: `Kompanija ${id}`,
      role: id === 1 ? "admin" : "user",
      plan: id % 10 === 0 ? "enterprise" : id % 5 === 0 ? "pro" : id % 3 === 0 ? "basic" : "free",
      employeeCount: Math.floor(Math.random() * 500) + 1,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
      lastLogin: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
      address: "Adresa korisnika",
      city: "Grad",
      phone: "+381 6x xxx xxxx",
      subscriptionHistory: [
        {
          planId: "free",
          startDate: new Date(Date.now() - 10000000000).toISOString(),
          endDate: null
        }
      ],
      paymentMethods: []
    };
    
    res.json(user);
  } catch (error) {
    console.error("Greška pri dobijanju detalja korisnika:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Izmena korisničkog plana (od strane admina)
adminRouter.put("/users/:id/plan", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { planId } = req.body;
    
    if (!planId) {
      return res.status(400).json({ message: "Plan ID je obavezan" });
    }
    
    // Provera da li je validan plan
    const validPlans = ["free", "basic", "pro", "enterprise"];
    if (!validPlans.includes(planId)) {
      return res.status(400).json({ message: "Nevažeći plan ID" });
    }
    
    // U pravoj implementaciji, ovo bi ažuriralo korisnika u bazi podataka
    const updatedUser = {
      id,
      plan: planId,
      // Ostala polja bi bila očuvana
    };
    
    res.json(updatedUser);
  } catch (error) {
    console.error("Greška pri ažuriranju korisničkog plana:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Dobijanje planova/cenovnika
adminRouter.get("/plans", async (req: Request, res: Response) => {
  try {
    // U pravoj implementaciji, ovo bi dolazilo iz baze podataka
    const plans = [
      {
        id: "free",
        name: "Free",
        priceMonthly: 0,
        maxEmployees: 20,
        features: ["Generisanje dokumenata", "Pretraživanje propisa", "Blanko obrasci", "Osnovni AI asistent"],
        isActive: true
      },
      {
        id: "basic",
        name: "Basic",
        priceMonthly: 39.99,
        maxEmployees: 50,
        features: ["Sve iz Free paketa", "Personalizovani dokumenti", "Srednji AI asistent", "Automatska analiza rizika"],
        isActive: true
      },
      {
        id: "pro",
        name: "Pro",
        priceMonthly: 69.99,
        maxEmployees: 100,
        features: ["Sve iz Basic paketa", "Napredna analiza dokumentacije", "Potpuni AI asistent", "Prioritetna podrška"],
        isActive: true
      },
      {
        id: "enterprise",
        name: "Enterprise",
        priceMonthly: 149.99,
        maxEmployees: 500,
        features: ["Sve iz Pro paketa", "Potpuna integracija sa vašim sistemima", "Prilagođeni dokumenti", "Napredna analitika"],
        isActive: true
      }
    ];
    
    res.json(plans);
  } catch (error) {
    console.error("Greška pri dobijanju planova:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Ažuriranje plana/cenovnika
adminRouter.put("/plans/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { name, priceMonthly, maxEmployees, features, isActive } = req.body;
    
    // U pravoj implementaciji, ovo bi ažuriralo plan u bazi podataka
    const updatedPlan = {
      id,
      name,
      priceMonthly,
      maxEmployees,
      features,
      isActive
    };
    
    res.json(updatedPlan);
  } catch (error) {
    console.error("Greška pri ažuriranju plana:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Dobijanje mesečnih statistika
adminRouter.get("/monthly-stats", async (req: Request, res: Response) => {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Simulirani podaci za grafikon
    const stats = months.map((month, i) => ({
      name: month,
      'Free': Math.floor(Math.random() * 25) + (i <= currentMonth ? 15 : 0),
      'Basic': Math.floor(Math.random() * 15) + (i <= currentMonth ? 10 : 0),
      'Pro': Math.floor(Math.random() * 10) + (i <= currentMonth ? 5 : 0),
      'Enterprise': Math.floor(Math.random() * 3) + (i <= currentMonth ? 2 : 0),
      'Ukupno': 0,
    })).map(item => ({
      ...item,
      'Ukupno': item.Free + item.Basic + item.Pro + item.Enterprise
    }));
    
    res.json(stats);
  } catch (error) {
    console.error("Greška pri dobijanju mesečnih statistika:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});