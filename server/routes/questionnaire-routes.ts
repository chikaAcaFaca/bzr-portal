import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

// Tip za parametre upitnika
interface QualificationResult {
  qualified: boolean;
  message: string;
  recommendations: string[];
}

interface SendResultsRequest {
  email: string;
  companyName: string;
  fullName: string;
  result: QualificationResult;
}

// Ruta za slanje rezultata upitnika na email
router.post('/send-results', async (req: Request, res: Response) => {
  try {
    const { email, companyName, fullName, result }: SendResultsRequest = req.body;
    
    if (!email || !companyName || !fullName || !result) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nedostaje email, naziv kompanije, ime ili rezultat upitnika' 
      });
    }

    // E-mail šablon prilagođen kvalifikovanim i nekvalifikovanim firmama
    const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${result.qualified ? '#4caf50' : '#ff9800'}; padding: 15px; color: white; }
        .content { padding: 20px; border: 1px solid #ddd; }
        .footer { margin-top: 20px; font-size: 12px; color: #777; }
        .button { display: inline-block; background-color: #4338ca; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .recommendations { margin: 20px 0; }
        .recommendation { padding: 10px; background-color: #f9f9f9; margin-bottom: 5px; border-left: 3px solid #4338ca; }
        .disclaimer { font-size: 12px; background-color: #f5f5f5; padding: 10px; margin-top: 20px; }
        .price { font-weight: bold; font-size: 16px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Rezultati procene za član 47</h2>
        </div>
        <div class="content">
          <p>Poštovani/a ${fullName},</p>
          
          <p>Hvala što ste koristili upitnik za procenu kvalifikacije prema članu 47 Zakona o bezbednosti i zdravlju na radu. Evo rezultata procene za Vašu kompaniju "${companyName}":</p>
          
          <h3 style="color: ${result.qualified ? 'green' : '#ff9800'};">${result.message}</h3>
          
          ${result.recommendations.length > 0 ? `
          <div class="recommendations">
            <h4>Preporuke za usklađivanje:</h4>
            ${result.recommendations.map(rec => `<div class="recommendation">✓ ${rec}</div>`).join('')}
          </div>
          ` : ''}
          
          <p>Imamo rešenje za vas: BZR Portal - sveobuhvatan alat za upravljanje bezbednošću i zdravljem na radu, posebno prilagođen ${result.qualified ? 'kompanijama koje se kvalifikuju po članu 47' : 'za sve kompanije'}.</p>
          
          <p>BZR Portal vam nudi:</p>
          <ul>
            <li><strong>Automatsko generisanje kompletne BZR dokumentacije</strong> koja je usklađena sa zakonskim propisima</li>
            <li><strong>Specijalnog AI asistenta</strong> za sva vaša pitanja iz oblasti BZR</li>
            <li><strong>Sistem za praćenje izvršenih obuka</strong> zaposlenih i njihove evidencije</li>
            <li><strong>Alate za procenu rizika</strong> i upravljanje merama zaštite</li>
            <li><strong>Redovna obaveštenja</strong> o promenama propisa</li>
          </ul>

          ${result.qualified ? `
          <p>Pošto imate lice koje ima položen stručni ispit za BZR i vaša firma se kvalifikuje prema članu 47, BZR Portal je savršeno rešenje za vas.</p>
          <p>BZR Portal će vam pomoći da automatizujete kreiranje potrebne dokumentacije i olakšate proces vođenja evidencije, koji je obavezan i kada sami obavljate poslove BZR.</p>
          ` : `
          <p>Vaša firma trenutno ne ispunjava uslove za član 47, ali BZR Portal može da vam pomogne da ostvarite potpunu usklađenost sa zakonskim propisima.</p>
          `}
          
          <p class="price">Cena PRO verzije: samo 2.990 RSD + PDV mesečno (manje od 100 dinara dnevno)</p>
          
          <p>Registrujte se besplatno i istražite mogućnosti koje BZR Portal pruža:</p>
          
          <a href="https://bzr-portal.com/auth" class="button">Registrujte se besplatno</a>
          
          <div class="disclaimer">
            <p>Ovaj email je automatski generisan na osnovu odgovora koje ste dali u upitniku. Procena kvalifikacije prema članu 47 je informativnog karaktera i ne predstavlja pravni savet. Za konačnu procenu konsultujte stručno lice ili nadležni organ.</p>
          </div>
        </div>
        <div class="footer">
          <p>BZR Portal &copy; ${new Date().getFullYear()} | Sva prava zadržana</p>
          <p>Imate pitanja? Kontaktirajte nas na <a href="mailto:info@bzr-portal.com">info@bzr-portal.com</a></p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Slanje emaila (simulacija)
    console.log(`[SIMULACIJA EMAIL] Slanje rezultata upitnika na adresu: ${email}`);
    console.log(`[SIMULACIJA EMAIL] Sadržaj: Kvalifikacija za ${companyName}`);
    
    // Vraćanje uspešnog odgovora
    res.status(200).json({
      success: true,
      message: 'Rezultati uspešno poslati na email',
    });
    
  } catch (error: any) {
    console.error('Greška pri slanju rezultata upitnika:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Došlo je do greške pri slanju rezultata upitnika',
      error: error.message 
    });
  }
});

export function setupQuestionnaireRoutes(app: any) {
  app.use('/api/questionnaire', router);
}