import { Router, Request, Response } from 'express';
import sgMail from '@sendgrid/mail';
import fs from 'fs';
import path from 'path';

// Inicijalizacija SendGrid klijenta
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY nije postavljen, slanje e-mailova neće raditi');
}

// Direktorijum za čuvanje rezultata upitnika
const RESULTS_DIR = path.join(process.cwd(), 'questionnaireResults');
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

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

    // Slanje emaila putem SendGrid
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SENDGRID_API_KEY nije postavljen, ne može se poslati email');
      return res.status(500).json({
        success: false,
        message: 'Slanje e-maila nije konfigurisano na serveru',
      });
    }

    try {
      // Kreiranje e-mail poruke
      const msg = {
        to: email,
        from: 'noreply@example.com', // NAPOMENA: Ovo mora biti verifikovana email adresa u SendGrid-u
        subject: `Rezultati kvalifikacije prema članu 47 - ${companyName}`,
        html: emailTemplate,
      };

      // Slanje poruke
      await sgMail.send(msg);

      console.log(`Email uspešno poslat na adresu: ${email}`);
      
      // Vraćanje uspešnog odgovora
      res.status(200).json({
        success: true,
        message: 'Rezultati uspešno poslati na email',
      });
    } catch (emailError: any) {
      console.error('Greška pri slanju emaila:', emailError);
      
      if (emailError.response) {
        console.error('SendGrid odgovor:', emailError.response.body);
      }
      
      // Čuvamo rezultate lokalno za alternativni pregled
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${timestamp}-${email.replace('@', '_at_')}.html`;
      const filePath = path.join(RESULTS_DIR, filename);
      
      try {
        fs.writeFileSync(filePath, emailTemplate);
        console.log(`Rezultati upitnika sačuvani u: ${filePath}`);
        
        res.status(200).json({
          success: true,
          message: 'Rezultati su generisani i sačuvani. Nije moguće poslati email zbog neispravne konfiguracije.',
          resultId: filename
        });
      } catch (saveError) {
        console.error('Greška pri čuvanju rezultata:', saveError);
        res.status(500).json({
          success: false,
          message: 'Došlo je do greške pri slanju rezultata na email i čuvanju rezultata',
          error: emailError.message,
        });
      }
    }
    
  } catch (error: any) {
    console.error('Greška pri slanju rezultata upitnika:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Došlo je do greške pri slanju rezultata upitnika',
      error: error.message 
    });
  }
});

// Test ruta za proveru SendGrid konfiguracije
router.get('/test-sendgrid', async (req: Request, res: Response) => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'SENDGRID_API_KEY nije postavljen',
      });
    }

    const testEmail = 'test@example.com';
    
    try {
      const msg = {
        to: testEmail,
        from: 'noreply@example.com', // NAPOMENA: Ovo mora biti verifikovana email adresa u SendGrid-u
        subject: 'Test poruka iz BZR Portala',
        text: 'Ovo je testna poruka za proveru SendGrid konfiguracije.',
        html: '<p>Ovo je testna poruka za proveru SendGrid konfiguracije.</p>',
      };

      const result = await sgMail.send(msg);
      console.log('SendGrid test rezultat:', result);
      
      return res.status(200).json({
        success: true,
        message: 'Test email poslat uspešno',
        result: result
      });
    } catch (emailError: any) {
      console.error('SendGrid test greška:', emailError);
      
      if (emailError.response) {
        console.error('SendGrid odgovor:', emailError.response.body);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Greška pri slanju test emaila',
        error: emailError.message,
        details: emailError.response?.body || 'Nema detalja'
      });
    }
  } catch (error: any) {
    console.error('Opšta greška:', error);
    return res.status(500).json({
      success: false,
      message: 'Opšta greška pri testu',
      error: error.message
    });
  }
});

// Ruta za pregled rezultata upitnika
router.get('/results/:resultId', (req: Request, res: Response) => {
  try {
    const { resultId } = req.params;
    
    // Provera da li je resultId bezbedan (bez ../ i sličnih opasnih putanja)
    if (!resultId || resultId.includes('..') || !resultId.endsWith('.html')) {
      return res.status(400).json({
        success: false,
        message: 'Neispravan ID rezultata'
      });
    }
    
    const filePath = path.join(RESULTS_DIR, resultId);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Rezultati nisu pronađeni'
      });
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(content);
    
  } catch (error: any) {
    console.error('Greška pri pregledu rezultata:', error);
    res.status(500).json({
      success: false,
      message: 'Greška pri pregledu rezultata',
      error: error.message
    });
  }
});

// Ruta za listu svih rezultata (za administratore)
router.get('/results', (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(RESULTS_DIR)) {
      return res.status(200).json({ results: [] });
    }
    
    const files = fs.readdirSync(RESULTS_DIR)
      .filter(file => file.endsWith('.html'))
      .map(file => {
        const stats = fs.statSync(path.join(RESULTS_DIR, file));
        return {
          id: file,
          createdAt: stats.ctime,
          size: stats.size
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.status(200).json({ results: files });
    
  } catch (error: any) {
    console.error('Greška pri listanju rezultata:', error);
    res.status(500).json({
      success: false,
      message: 'Greška pri listanju rezultata',
      error: error.message
    });
  }
});

export function setupQuestionnaireRoutes(app: any) {
  app.use('/api/questionnaire', router);
}