/**
 * Pojednostavljena verzija pdf-parse biblioteke, koja ne zavisi od test fajlova
 */

export interface PDFOptions {
  pagerender?: (data: any) => Promise<string>;
  max?: number;
  version?: string; 
}

export interface PDFData {
  numpages: number;
  numrender: number;
  info: any;
  metadata: any;
  text: string;
  version: string;
}

export async function parsePDF(dataBuffer: Buffer, options?: PDFOptions): Promise<PDFData> {
  try {
    // Dinamički učitavamo pdf-parse samo kada je zaista potrebno
    const pdfParse = await import('pdf-parse');
    return await pdfParse.default(dataBuffer, options);
  } catch (error: any) {
    console.error('Greška pri parsiranju PDF-a:', error);
    
    // Vraćamo strukturu kompatibilnu sa očekivanim PDFData
    return {
      numpages: 0,
      numrender: 0,
      info: {},
      metadata: {},
      text: `[Greška pri čitanju PDF-a: ${error.message}]`,
      version: '0.0.0'
    };
  }
}