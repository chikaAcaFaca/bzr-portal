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
    // Slanje potvrde korisniku koji je popunio formu
    const userEmail = email; // Koristimo email koji je korisnik uneo u formi
    
    // Naslov emaila
    const subject = `Novi upit za osiguranje - ${companyName}`;
    
    // Kreiramo HTML sadržaj emaila za korisnika
    const userHtmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Potvrda vašeg upita</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #ff7700; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BZR Portal</h1>
        <h2>Potvrda upita za osiguranje</h2>
      </div>
      <div class="content">
        <p>Poštovani/a ${fullName},</p>
        <p>Hvala Vam na upitu za osiguranje. Vaš zahtev je uspešno primljen i bićete kontaktirani u najkraćem mogućem roku.</p>
        <p>Vaši podaci:</p>
        <ul>
          <li><strong>Kompanija:</strong> ${companyName}</li>
          <li><strong>Kontakt osoba:</strong> ${fullName}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Telefon:</strong> ${phone}</li>
          <li><strong>Broj zaposlenih:</strong> ${employeeCount}</li>
        </ul>
        <p>Vaša poruka:</p>
        <p><em>${message}</em></p>
        <p>Za sva dodatna pitanja možete nas kontaktirati na telefon <strong>+381 64 125 8686</strong> ili email <strong>bzr.portal.com@gmail.com</strong>.</p>
      </div>
      <div class="footer">
        <p>BZR Portal © 2025 - Karađorđeva 18a, Pančevo</p>
      </div>
    </body>
    </html>
    `;
    
    // Naslov emaila za korisnika
    const userSubject = `BZR Portal - Potvrda vašeg upita za osiguranje`;
    
    // Slanje emaila korisniku
    const userEmailSuccess = await sendEmail(
      userEmail, 
      userSubject, 
      userHtmlContent, 
      'BZR Portal - Osiguranje',
      'baksis.net@gmail.com'
    );
    
    // Slanje obaveštenja administratoru (BZR Portal)
    const adminEmail = 'baksis.net@gmail.com'; // Za testne svrhe, kasnije bi bilo bzr.portal.com@gmail.com
    const adminEmailSuccess = await sendEmail(
      adminEmail, 
      subject, 
      htmlContent, 
      'BZR Portal - Osiguranje',
      'baksis.net@gmail.com'
    );
    
    // Odgovor klijentu - ako je bar jedna email poruka uspešno poslata
    if (userEmailSuccess || adminEmailSuccess) {
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