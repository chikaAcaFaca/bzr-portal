import { Router, Request, Response } from 'express';
import { sendEmail, getEmailServiceInfo } from '../services/email-service';

const router = Router();

// Tip za podatke iz kontakt forme
interface ContactFormData {
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  employeeCount: string;
  message: string;
}

// Ruta za slanje kontakt forme za osiguranje
router.post('/send-insurance-inquiry', async (req: Request, res: Response) => {
  try {
    const { 
      companyName, 
      fullName, 
      email, 
      phone, 
      employeeCount, 
      message 
    }: ContactFormData = req.body;
    
    // Provera obaveznih polja
    if (!email || !fullName || !companyName || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nedostaju obavezna polja: email, ime i prezime, naziv kompanije ili telefon' 
      });
    }

    // Kreiranje HTML sadržaja emaila
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #f97316; }
        .info-block { background-color: #f8fafc; border-left: 4px solid #f97316; padding: 15px; margin-bottom: 20px; }
        .label { font-weight: bold; color: #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Nov upit za osiguranje zaposlenih</h1>
        
        <p>Primili ste nov upit za osiguranje zaposlenih preko sajta BZR Portal.</p>
        
        <div class="info-block">
          <p><span class="label">Kompanija:</span> ${companyName}</p>
          <p><span class="label">Ime i prezime:</span> ${fullName}</p>
          <p><span class="label">Email:</span> ${email}</p>
          <p><span class="label">Telefon:</span> ${phone}</p>
          <p><span class="label">Broj zaposlenih:</span> ${employeeCount || 'Nije navedeno'}</p>
        </div>
        
        <h2>Poruka:</h2>
        <p>${message || 'Klijent nije uneo dodatnu poruku.'}</p>
        
        <p>Ovaj email je automatski generisan, molimo Vas da ne odgovarate na njega.</p>
      </div>
    </body>
    </html>
    `;

    // Ciljana email adresa za primanje upita (BZR Portal)
    const targetEmail = 'bzr.portal.com@gmail.com';
    
    // Naslov emaila
    const subject = `Novi upit za osiguranje - ${companyName}`;
    
    // Slanje emaila
    const success = await sendEmail(
      targetEmail, 
      subject, 
      htmlContent, 
      'BZR Portal - Osiguranje',
      'noreply@bzr-portal.com'
    );
    
    // Odgovor klijentu
    if (success) {
      return res.status(200).json({
        success: true,
        message: 'Vaš upit je uspešno poslat. Uskoro ćemo vas kontaktirati.',
      });
    } else {
      // Ako slanje emaila nije uspelo
      console.error('Neuspešno slanje upita za osiguranje');
      return res.status(500).json({
        success: false,
        message: 'Došlo je do greške pri slanju upita. Molimo pokušajte kasnije ili nas kontaktirajte direktno.',
      });
    }
  } catch (error: any) {
    console.error('Greška pri slanju upita za osiguranje:', error);
    return res.status(500).json({
      success: false,
      message: 'Greška pri obradi vašeg upita',
      error: error.message
    });
  }
});

export default router;