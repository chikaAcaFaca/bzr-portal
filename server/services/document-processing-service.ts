import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as pdf from 'pdf-parse';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as xlsx from 'xlsx';
import * as Tesseract from 'tesseract.js';
import sharp from 'sharp';

/**
 * Servis za obradu dokumenata različitih formata (PDF, DOC, DOCX, XLS, XLSX, JPG, PNG)
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
   * Ekstrahuje tekst iz DOCX dokumenta
   * @param filePath Putanja do DOCX dokumenta
   * @returns Promise<string> Ekstrahovan tekst
   */
  async extractTextFromDOCX(filePath: string): Promise<string> {
    try {
      // Za DOCX, moramo koristiti biblioteku koja podržava čitanje postojećih dokumenata
      // Trenutno implementacija samo prima tekst datoteke
      const text = fs.readFileSync(filePath, 'utf8');
      return text;
    } catch (error) {
      console.error('Greška pri ekstrakciji teksta iz DOCX dokumenta:', error);
      throw new Error('Nije moguće ekstraktovati tekst iz DOCX dokumenta.');
    }
  }

  /**
   * Ekstrahuje podatke iz Excel datoteke i pretvara tabele u tekst
   * @param filePath Putanja do Excel datoteke
   * @returns Promise<string> Tekstualna reprezentacija tabela
   */
  async extractTextFromExcel(filePath: string): Promise<string> {
    try {
      const workbook = xlsx.readFile(filePath);
      let result = '';

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);
        
        result += `\n=== SHEET: ${sheetName} ===\n`;
        
        // Pretvara tabelu u tekstualni format
        if (jsonData.length > 0) {
          // Izvuci imena kolona (ključeve)
          const headers = Object.keys(jsonData[0]);
          result += headers.join('\t') + '\n';
          
          // Izvuci vrednosti redova
          for (const row of jsonData) {
            const values = headers.map(header => row[header] || '').join('\t');
            result += values + '\n';
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Greška pri ekstrakciji podataka iz Excel datoteke:', error);
      throw new Error('Nije moguće ekstraktovati podatke iz Excel datoteke.');
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
   * Obradi dokument na osnovu njegovog tipa i ekstraktuj sadržaj
   * @param filePath Putanja do dokumenta
   * @param mimeType MIME tip dokumenta
   * @returns Promise<string> Ekstraktovan sadržaj dokumenta
   */
  async processDocument(filePath: string, mimeType: string): Promise<string> {
    try {
      console.log(`Obrađujem dokument: ${filePath} (${mimeType})`);
      
      if (mimeType === 'application/pdf') {
        return await this.extractTextFromPDF(filePath);
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 mimeType === 'application/msword') {
        return await this.extractTextFromDOCX(filePath);
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 mimeType === 'application/vnd.ms-excel') {
        return await this.extractTextFromExcel(filePath);
      } else if (mimeType.startsWith('image/')) {
        return await this.extractTextFromImage(filePath);
      } else if (mimeType === 'text/plain') {
        return fs.readFileSync(filePath, 'utf8');
      } else {
        throw new Error(`Nepodržan tip dokumenta: ${mimeType}`);
      }
    } catch (error) {
      console.error('Greška pri obradi dokumenta:', error);
      throw new Error(`Nije moguće obraditi dokument: ${error.message}`);
    }
  }
}

export const documentProcessingService = new DocumentProcessingService();