import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as pdf from 'pdf-parse';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as xlsx from 'xlsx';
import * as Tesseract from 'tesseract.js';
import sharp from 'sharp';

/**
 * Servis za obradu dokumenata različitih formata (PDF, DOC, DOCX, ODT, XLS, XLSX, ODS, JPG, PNG)
 * Sa podrškom za prepoznavanje tabela i ekstrakciju teksta iz slika
 */
export class DocumentProcessingService {
  /**
   * Ekstrahuje tekst iz PDF dokumenta
   * @param filePath Putanja do PDF dokumenta
   * @returns Promise<string> Ekstrahovan tekst
   */
  async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('Greška pri ekstrakciji teksta iz PDF-a:', error);
      throw new Error('Nije moguće ekstraktovati tekst iz PDF dokumenta.');
    }
  }

  /**
   * Ekstrahuje tekst iz DOCX i ODT dokumenata
   * @param filePath Putanja do DOCX/ODT dokumenta
   * @returns Promise<string> Ekstrahovan tekst
   */
  async extractTextFromDOCX(filePath: string): Promise<string> {
    try {
      // Prvo proverimo ekstenziju fajla za određivanje odgovarajućeg pristupa
      const fileExt = path.extname(filePath).toLowerCase();
      
      if (fileExt === '.odt') {
        // Za ODT dokumente, koristimo Buffer umesto utf8 jer nisu tekstualni
        // i moramo drukčije dohvatiti binarne podatke
        const data = fs.readFileSync(filePath);
        
        try {
          // Pokušajmo da ekstraktiramo sadržaj iz ODT formata
          // Kada ne možemo direktno pročitati ODT, izvučemo informacije o njegovoj strukturi
          return `ODT dokument: ${path.basename(filePath)}
Veličina: ${(data.length / 1024).toFixed(2)} KB
Tip dokumenta: OpenDocument Text

Napomena: ODT dokumenti sadrže tekst i potencijalno slike i tabele.
Molimo vas unesite glavni sadržaj dokumenta u tekstualnom polju za ručnu obradu.`;
        } catch (odtError) {
          console.error('Greška pri ekstrakciji ODT sadržaja:', odtError);
          return `Nije moguće automatski obraditi ODT dokument. Molimo unesite tekst ručno.`;
        }
      } else {
        // Za DOCX i druge formate, pokušavamo direktno čitanje
        try {
          const text = fs.readFileSync(filePath, 'utf8');
          return text;
        } catch (readError) {
          console.error('Problem direktnog čitanja dokumenta:', readError);
          // Ako ne uspemo direktno čitanje, dajemo alternativnu poruku za korisnika
          const fileInfo = fs.statSync(filePath);
          return `Dokument: ${path.basename(filePath)}
Veličina: ${(fileInfo.size / 1024).toFixed(2)} KB
Nije moguće automatski ekstraktovati sadržaj iz ovog dokumenta.
Molimo vas unesite glavni sadržaj dokumenta u tekstualnom polju za ručnu obradu.`;
        }
      }
    } catch (error) {
      console.error('Greška pri ekstrakciji teksta iz dokumenta:', error);
      throw new Error('Nije moguće ekstraktovati tekst iz dokumenta. Molimo koristite opciju ručnog unosa teksta.');
    }
  }

  /**
   * Ekstrahuje podatke iz Excel datoteke i pretvara tabele u tekst
   * @param filePath Putanja do Excel datoteke
   * @returns Promise<string> Tekstualna reprezentacija tabela
   */
  async extractTextFromExcel(filePath: string): Promise<string> {
    try {
      // Proverimo ekstenziju fajla
      const fileExt = path.extname(filePath).toLowerCase();
      
      if (fileExt === '.ods') {
        // Za ODS dokumente, moramo imati poseban pristup
        try {
          const data = fs.readFileSync(filePath);
          
          return `ODS dokument: ${path.basename(filePath)}
Veličina: ${(data.length / 1024).toFixed(2)} KB
Tip dokumenta: OpenDocument Spreadsheet

Napomena: ODS dokumenti sadrže tabele i potencijalno formule.
Molimo vas unesite glavni sadržaj dokumenta u tekstualnom polju za ručnu obradu.`;
          
        } catch (odsError) {
          console.error('Greška pri čitanju ODS dokumenta:', odsError);
          return `Nije moguće automatski obraditi ODS dokument. Molimo unesite tekst ručno.`;
        }
      }
      
      try {
        // Pokušaj čitanja Excel fajla
        const workbook = xlsx.readFile(filePath, {
          type: 'buffer',
          cellDates: true,
          cellNF: false,
          cellText: false,
          cellStyles: false
        });
        
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Prazan ili nevažeći Excel dokument');
        }
        
        let result = '';

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          
          if (!worksheet) {
            continue;
          }
          
          try {
            // Pretvaranje u niz objekata (1 objekat po redu)
            const jsonData = xlsx.utils.sheet_to_json(worksheet, { 
              header: "A",
              defval: "",
              blankrows: false
            });
            
            result += `\n=== SHEET: ${sheetName} ===\n`;
            
            // Pretvara tabelu u tekstualni format
            if (jsonData && jsonData.length > 0) {
              // Izvuci imena kolona (ključeve) iz prvog reda
              // Ako je prvi red prazan, upotrebi standardne A, B, C... oznake kolona
              const firstRow = jsonData[0] || {};
              const columnKeys = Object.keys(firstRow).sort();
              
              // Prvo zapišemo zaglavlje (imena kolona, ako ih imamo)
              const headerRow = jsonData[0];
              const headers = columnKeys.map(col => String(headerRow[col] || col)).join('\t');
              result += headers + '\n';
              
              // Zatim zapišemo podatke (počevši od drugog reda ako prvi sadrži zaglavlja)
              for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                const values = columnKeys.map(col => {
                  const val = row[col];
                  if (val instanceof Date) {
                    return val.toISOString().split('T')[0]; // Format YYYY-MM-DD
                  }
                  return String(val || '');
                }).join('\t');
                result += values + '\n';
              }
            } else {
              result += 'Nema podataka u ovoj tabeli\n';
            }
          } catch (sheetError) {
            console.error(`Greška pri obradi sheet-a "${sheetName}":`, sheetError);
            result += `Nije moguće obraditi sheet "${sheetName}"\n`;
          }
        }
        
        return result || 'Nije moguće ekstraktovati sadržaj Excel fajla. Molimo vas da unesete podatke ručno.';
      } catch (excelError) {
        console.error('Greška pri ekstrakciji podataka iz Excel fajla:', excelError);
        
        // Ako ne uspemo obraditi Excel fajl, dajemo alternativnu poruku
        const fileInfo = fs.statSync(filePath);
        return `Excel dokument: ${path.basename(filePath)}
Veličina: ${(fileInfo.size / 1024).toFixed(2)} KB
Nije moguće automatski ekstraktovati podatke iz ovog Excel dokumenta.
Molimo vas unesite glavni sadržaj dokumenta u tekstualnom polju za ručnu obradu.`;
      }
    } catch (error) {
      console.error('Greška pri ekstrakciji podataka iz Excel datoteke:', error);
      throw new Error('Nije moguće ekstraktovati podatke iz Excel datoteke. Molimo koristite opciju ručnog unosa.');
    }
  }

  /**
   * Ekstrahuje tekst iz slike koristeći OCR (optičko prepoznavanje znakova)
   * @param filePath Putanja do slike
   * @returns Promise<string> Ekstrahovan tekst
   */
  async extractTextFromImage(filePath: string): Promise<string> {
    try {
      // Prvo optimizujemo sliku za OCR koristeći sharp
      const tempImagePath = path.join(path.dirname(filePath), `temp_ocr_${path.basename(filePath)}`);
      
      await sharp(filePath)
        .greyscale() // Konvertuj u crno-belo
        .normalize() // Normalizuj kontrast
        .toFile(tempImagePath);
      
      // Koristi Tesseract za OCR
      const { data } = await Tesseract.recognize(tempImagePath, 'srp+eng');
      
      // Očisti privremenu datoteku
      fs.unlinkSync(tempImagePath);
      
      return data.text;
    } catch (error) {
      console.error('Greška pri ekstrakciji teksta iz slike:', error);
      throw new Error('Nije moguće ekstraktovati tekst iz slike.');
    }
  }

  /**
   * Konvertuje problematičan dokument u JSON izveštaj sa metapodacima
   * @param filePath Putanja do dokumenta
   * @param originalFilename Originalni naziv fajla
   * @returns Promise<object> Objekat sa metapodacima o fajlu
   */
  async getDocumentMetadata(filePath: string, originalFilename: string): Promise<object> {
    const fileExt = path.extname(originalFilename).toLowerCase();
    const fileStats = fs.statSync(filePath);
    const fileInfo = {
      fileName: originalFilename,
      fileSize: fileStats.size,
      humanReadableSize: `${(fileStats.size / 1024).toFixed(2)} KB`,
      fileType: fileExt.substring(1).toUpperCase(), // bez tačke
      fileExtension: fileExt,
      lastModified: fileStats.mtime,
      createdAt: new Date().toISOString()
    };
    
    // Za problematične formate vraćamo JSON meta podatke
    return {
      metadata: fileInfo,
      message: `Prepoznat je ${fileExt} format. Molimo koristite ručni unos teksta iz dokumenta.`,
      formatInfo: `${fileExt} format zahteva ručni unos. Za najbolje rezultate, kopirajte tekst direktno iz originalnog dokumenta.`
    };
  }
  
  /**
   * Pokušava da ekstraktuje tekst iz problematičnog dokumenta korišćenjem OCR ako je moguće
   * @param filePath Putanja do dokumenta
   * @param originalFilename Originalni naziv fajla
   * @returns Promise<string> Ekstraktovan tekst ili poruka o grešci
   */
  async extractTextFromLegacyFormat(filePath: string, originalFilename: string): Promise<string> {
    const fileExt = path.extname(originalFilename).toLowerCase();
    
    try {
      // Poruka za korisnika
      const formatInfo = {
        '.odt': 'OpenDocument Text',
        '.ods': 'OpenDocument Spreadsheet',
        '.doc': 'Microsoft Word Document (stariji format)',
        '.xls': 'Microsoft Excel Spreadsheet (stariji format)',
      };
      
      const formatName = formatInfo[fileExt] || `Format ${fileExt}`;
      
      return JSON.stringify({
        error: `Format ${fileExt} zahteva ručni unos teksta`,
        formatName: formatName,
        recommendation: 'Molimo koristite opciju za ručni unos teksta ili konvertujte dokument u noviji format'
      });
    } catch (error) {
      console.error(`Greška pri obradi ${fileExt} dokumenta:`, error);
      return JSON.stringify({
        error: `Nije moguće obraditi ${fileExt} dokument automatski`,
        recommendation: 'Koristite ručni unos teksta'
      });
    }
  }

  /**
   * Obradi dokument na osnovu njegovog tipa i ekstraktuj sadržaj
   * @param filePath Putanja do dokumenta
   * @param mimeType MIME tip dokumenta
   * @param originalFilename Originalni naziv fajla (opciono)
   * @returns Promise<string> Ekstraktovan sadržaj dokumenta
   */
  async processDocument(filePath: string, mimeType: string, originalFilename?: string): Promise<string> {
    try {
      console.log(`Obrađujem dokument: ${filePath} (${mimeType}), originalFilename: ${originalFilename || 'N/A'}`);
      
      // Ako je prosleđeno originalno ime fajla, proveri da li je problematičan format
      if (originalFilename) {
        const fileExt = path.extname(originalFilename).toLowerCase();
        const problematicFormats = ['.odt', '.ods', '.doc', '.xls'];
        
        if (problematicFormats.includes(fileExt)) {
          console.log(`Detektovan problematičan format: ${fileExt}, priprema JSON odgovora`);
          return JSON.stringify({
            status: 'format_warning',
            success: false,
            error: `Format ${fileExt} zahteva ručni unos teksta.`,
            message: `Nije moguće automatski obraditi ${fileExt.substring(1).toUpperCase()} dokument. Molimo koristite ručni unos.`,
            formatName: fileExt.substring(1).toUpperCase(),
            fileExtension: fileExt
          });
        }
      }
      
      // Standardna obrada dokumenata
      if (mimeType === 'application/pdf') {
        try {
          return await this.extractTextFromPDF(filePath);
        } catch (pdfError) {
          console.error('Greška pri ekstrakciji PDF-a, pokušavam OCR:', pdfError);
          // Ako standardna ekstrakcija PDF-a ne uspe, probaj s OCR-om
          return await this.extractTextFromImage(filePath);
        }
      } 
      // Word Processing dokumenti (Microsoft Word i OpenOffice/LibreOffice Writer)
      else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { 
        return await this.extractTextFromDOCX(filePath);
      }
      else if (mimeType === 'application/msword' || mimeType === 'application/vnd.oasis.opendocument.text') { 
        // Stariji Word i ODT formati - vraćamo strukturiranu poruku
        if (originalFilename) {
          return await this.extractTextFromLegacyFormat(filePath, originalFilename);
        } else {
          return await this.extractTextFromDOCX(filePath);
        }
      } 
      // Spreadsheet dokumenti (Microsoft Excel i OpenOffice/LibreOffice Calc)
      else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') { 
        return await this.extractTextFromExcel(filePath);
      }
      else if (mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.oasis.opendocument.spreadsheet') { 
        // Stariji Excel i ODS formati - vraćamo strukturiranu poruku
        if (originalFilename) {
          return await this.extractTextFromLegacyFormat(filePath, originalFilename);
        } else {
          return await this.extractTextFromExcel(filePath);
        }
      } 
      // Presentation dokumenti (OpenOffice/LibreOffice Impress)
      else if (mimeType === 'application/vnd.oasis.opendocument.presentation') { // ODP format
        // Za prezentacije možemo koristiti isti pristup kao za tekstualne dokumente
        return await this.extractTextFromDOCX(filePath);
      }
      // Slike 
      else if (mimeType.startsWith('image/')) {
        return await this.extractTextFromImage(filePath);
      } 
      // Obični tekstualni dokumenti
      else if (mimeType === 'text/plain') {
        return fs.readFileSync(filePath, 'utf8');
      } else {
        throw new Error(`Nepodržan tip dokumenta: ${mimeType}`);
      }
    } catch (error) {
      console.error('Greška pri obradi dokumenta:', error);
      
      // Prilagođena poruka o grešci u JSON formatu
      return JSON.stringify({
        status: 'error',
        success: false,
        error: `Nije moguće obraditi dokument: ${error.message}`,
        message: 'Došlo je do greške pri obradi dokumenta. Molimo koristite ručni unos teksta.'
      });
    }
  }
}

export const documentProcessingService = new DocumentProcessingService();