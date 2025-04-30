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

export const userRouter = express.Router();

// Middleware za proveru da li je korisnik autentifikovan
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Nije autentifikovan" });
  }
  
  return next();
};

// Sve korisničke rute zahtevaju autentifikaciju
userRouter.use(isAuthenticated);

// Dobijanje profila korisnika
userRouter.get("/profile", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    
    // U pravoj implementaciji, ovo bi bilo dopunjeno dodatnim podacima iz baze
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company || "Nije definisano",
      position: user.position || "Nije definisano",
      plan: user.plan || "free",
      employeeCount: user.employeeCount || 0,
      createdAt: user.createdAt,
      avatarUrl: user.avatarUrl || null
    };
    
    res.json(userProfile);
  } catch (error) {
    console.error("Greška pri dobijanju korisničkog profila:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Ažuriranje profila korisnika
userRouter.put("/profile", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { name, company, position, employeeCount } = req.body;
    
    // U pravoj implementaciji, ovo bi ažuriralo korisnika u bazi podataka
    const updatedUser = {
      ...user,
      name: name || user.name,
      company: company || user.company,
      position: position || user.position,
      employeeCount: employeeCount || user.employeeCount
    };
    
    // Simulirano ažuriranje
    req.user = updatedUser;
    
    res.json(updatedUser);
  } catch (error) {
    console.error("Greška pri ažuriranju korisničkog profila:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Dobijanje pretplate korisnika
userRouter.get("/subscription", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    
    // U pravoj implementaciji, ovo bi bilo dopunjeno dodatnim podacima iz baze
    const subscription = {
      plan: user.plan || "free",
      status: "active",
      currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false
    };
    
    res.json(subscription);
  } catch (error) {
    console.error("Greška pri dobijanju pretplate:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Promena pretplatničkog plana
userRouter.put("/subscription", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
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
      ...user,
      plan: planId
    };
    
    // Simulirano ažuriranje
    req.user = updatedUser;
    
    const subscription = {
      plan: planId,
      status: "active",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false
    };
    
    res.json(subscription);
  } catch (error) {
    console.error("Greška pri promeni pretplate:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Otkazivanje pretplate
userRouter.post("/subscription/cancel", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    
    // U pravoj implementaciji, ovo bi ažuriralo pretplatu u bazi podataka
    const subscription = {
      plan: user.plan,
      status: "active",
      currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: true
    };
    
    res.json(subscription);
  } catch (error) {
    console.error("Greška pri otkazivanju pretplate:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Dobijanje dostupnih dokumenata za korisnika (prema planu)
userRouter.get("/available-documents", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const plan = user.plan || "free";
    
    // Definisanje dostupnosti dokumenata prema planu
    const documentsAvailability = {
      // Obrazac 6 - Evidencija o zaposlenima osposobljenim za bezbedan i zdrav rad
      "obrazac6": {
        free: "blank",
        basic: "full",
        pro: "full",
        enterprise: "full"
      },
      // Akt o proceni rizika
      "akt_o_proceni_rizika": {
        free: "blank",
        basic: "blank",
        pro: "full",
        enterprise: "full"
      },
      // Program osposobljavanja
      "program_osposobljavanja": {
        free: "blank",
        basic: "full",
        pro: "full",
        enterprise: "full"
      },
      // Uputstvo za bezbedan rad
      "uputstvo_za_bezbedan_rad": {
        free: "blank",
        basic: "full",
        pro: "full",
        enterprise: "full"
      },
      // Izveštaj o pregledu i ispitivanju opreme za rad
      "izvestaj_o_opremi": {
        free: "none",
        basic: "blank",
        pro: "full",
        enterprise: "full"
      },
      // Periodični izveštaj o stanju bezbednosti
      "periodicni_izvestaj": {
        free: "none",
        basic: "none",
        pro: "full",
        enterprise: "full"
      }
    };
    
    // Generisanje liste dokumenata sa njihovom dostupnošću za trenutni plan
    const documentTypes = [
      {
        id: "obrazac6",
        name: "Obrazac 6 - Evidencija o zaposlenima osposobljenim za bezbedan i zdrav rad",
        description: "Zakonski obavezan obrazac za praćenje obuke zaposlenih",
        accessLevel: documentsAvailability["obrazac6"][plan]
      },
      {
        id: "akt_o_proceni_rizika",
        name: "Akt o proceni rizika",
        description: "Kompletna procena rizika za radna mesta",
        accessLevel: documentsAvailability["akt_o_proceni_rizika"][plan]
      },
      {
        id: "program_osposobljavanja",
        name: "Program osposobljavanja",
        description: "Program obuke zaposlenih za bezbedan i zdrav rad",
        accessLevel: documentsAvailability["program_osposobljavanja"][plan]
      },
      {
        id: "uputstvo_za_bezbedan_rad",
        name: "Uputstvo za bezbedan rad",
        description: "Detaljna uputstva za bezbedno korišćenje opreme",
        accessLevel: documentsAvailability["uputstvo_za_bezbedan_rad"][plan]
      },
      {
        id: "izvestaj_o_opremi",
        name: "Izveštaj o pregledu i ispitivanju opreme za rad",
        description: "Dokumentacija o pregledu i ispitivanju opreme",
        accessLevel: documentsAvailability["izvestaj_o_opremi"][plan]
      },
      {
        id: "periodicni_izvestaj",
        name: "Periodični izveštaj o stanju bezbednosti",
        description: "Analiza stanja bezbednosti i zdravlja na radu u određenom periodu",
        accessLevel: documentsAvailability["periodicni_izvestaj"][plan]
      }
    ];
    
    res.json(documentTypes);
  } catch (error) {
    console.error("Greška pri dobijanju dostupnih dokumenata:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Dobijanje istorije plaćanja
userRouter.get("/payment-history", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    
    // U pravoj implementaciji, ovo bi dolazilo iz baze podataka
    const paymentHistory = [];
    
    res.json(paymentHistory);
  } catch (error) {
    console.error("Greška pri dobijanju istorije plaćanja:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Dobijanje dostupnih planova
userRouter.get("/plans", async (req: Request, res: Response) => {
  try {
    // U pravoj implementaciji, ovo bi dolazilo iz baze podataka
    const plans = [
      {
        id: "free",
        name: "Free",
        description: "Za male kompanije sa do 20 zaposlenih",
        price: 0,
        features: [
          "Generisanje dokumenata u standardnom formatu",
          "Pristup osnovnim pravnim informacijama",
          "Blanko obrasci za štampanje",
          "Pristup bazičnoj AI asistenciji"
        ],
        limits: [
          "Do 20 zaposlenih",
          "Samo blanko obrasci bez personalizacije",
          "Ograničen broj AI upita (10 dnevno)",
          "Osnovna analiza rizika"
        ],
        isPopular: false
      },
      {
        id: "basic",
        name: "Basic",
        description: "Za rastuće kompanije sa do 50 zaposlenih",
        price: 39.99,
        features: [
          "Sve iz Free paketa",
          "Personalizovani dokumenti sa podacima kompanije",
          "Pristup dodatnim pravnim informacijama",
          "Srednji nivo AI asistencije",
          "Automatska analiza rizika",
          "Osnovna statistika i izveštaji"
        ],
        limits: [
          "Do 50 zaposlenih",
          "Srednji broj AI upita (50 dnevno)",
          "Osnovno prilagođavanje obrazaca"
        ],
        isPopular: true
      },
      {
        id: "pro",
        name: "Pro",
        description: "Za srednje kompanije sa do 100 zaposlenih",
        price: 69.99,
        features: [
          "Sve iz Basic paketa",
          "Potpuno prilagođeni dokumenti",
          "Napredna analiza dokumenata",
          "Prioritetna AI asistencija",
          "Prilagođeni izveštaji",
          "Automatsko obaveštavanje o isteku dokumenata",
          "Napredna statistika i izveštaji"
        ],
        limits: [
          "Do 100 zaposlenih",
          "Neograničen broj AI upita",
          "Prioritetna podrška"
        ],
        isPopular: false
      },
      {
        id: "enterprise",
        name: "Enterprise",
        description: "Za velike kompanije sa preko 100 zaposlenih",
        price: 149.99,
        features: [
          "Sve iz Pro paketa",
          "Potpuna integracija sa vašim sistemima",
          "Potpuno prilagođeni dokumenti i izveštaji",
          "Dedikovan konsultant za bezbednost",
          "Napredna analitika i predviđanje rizika",
          "API pristup",
          "Neograničena podrška i obuka zaposlenih"
        ],
        limits: [
          "Do 500 zaposlenih",
          "Enterprise korisnici mogu kontaktirati za specifične potrebe"
        ],
        isPopular: false
      }
    ];
    
    res.json(plans);
  } catch (error) {
    console.error("Greška pri dobijanju planova:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});