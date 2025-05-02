import { Request, Response, Router } from "express";

const router = Router();

// Endpoint za slanje rezultata upitnika na e-mail
router.post('/send-results', async (req: Request, res: Response) => {
  try {
    const { email, fullName, companyName, result } = req.body;
    
    if (!email || !fullName || !companyName || !result) {
      return res.status(400).json({ error: 'Nedostaju obavezni podaci' });
    }

    // Ovde bismo koristili SendGrid za slanje e-maila u produkciji
    // Za sada samo logujemo podatke i simuliramo uspešno slanje
    console.log('Rezultati upitnika za kvalifikaciju prema Članu 47:');
    console.log('Email:', email);
    console.log('Ime i prezime:', fullName);
    console.log('Kompanija:', companyName);
    console.log('Rezultat:', result);

    // Implementirajte slanje e-maila putem SendGrid ili drugog servisa
    // Ovde ćemo simulirati uspešno slanje
    
    return res.status(200).json({ 
      success: true,
      message: 'Rezultati upitnika su uspešno poslati na e-mail'
    });
  } catch (error) {
    console.error('Greška prilikom slanja rezultata upitnika:', error);
    return res.status(500).json({ 
      error: 'Došlo je do greške prilikom slanja rezultata upitnika'
    });
  }
});

export function setupQuestionnaireRoutes(app: any) {
  app.use('/api/questionnaire', router);
}