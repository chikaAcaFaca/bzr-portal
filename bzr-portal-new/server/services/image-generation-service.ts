
import axios from 'axios';
import fs from 'fs';
import { config } from '../config';

/**
 * Servis za generisanje slika pomoću različitih AI API-ja
 */
export class ImageGenerationService {
  /**
   * Generiše sliku na osnovu opisa
   */
  public async generateImage(prompt: string, options?: {
    width?: number;
    height?: number;
    style?: string;
    category?: string;
  }): Promise<string | null> {
    // 1. Prvo pokušaj sa Stability AI API (ako je konfigurisan)
    if (config.stabilityApiKey) {
      try {
        console.log('Pokušaj generisanja slike pomoću Stability AI...');
        const stabilityImage = await this.generateWithStabilityAI(prompt, options);
        if (stabilityImage) {
          return stabilityImage;
        }
      } catch (error) {
        console.error('Greška pri generisanju slike sa Stability AI:', error);
      }
    }
    
    // 2. Ako Stability AI nije uspeo, pokušaj sa Hugging Face API
    if (config.huggingfaceApiKey) {
      try {
        console.log('Pokušaj generisanja slike pomoću Hugging Face...');
        const huggingFaceImage = await this.generateWithHuggingFace(prompt, options);
        if (huggingFaceImage) {
          return huggingFaceImage;
        }
      } catch (error) {
        console.error('Greška pri generisanju slike sa Hugging Face:', error);
      }
    }
    
    // 3. Kao poslednji pokušaj, isprobaj Lexica API (besplatan)
    try {
      console.log('Pokušaj generisanja slike pomoću Lexica API...');
      const lexicaImage = await this.generateWithLexicaAPI(prompt, options);
      if (lexicaImage) {
        return lexicaImage;
      }
    } catch (error) {
      console.error('Greška pri generisanju slike sa Lexica API:', error);
    }
    
    console.log('Svi pokušaji generisanja slike su neuspešni.');
    return null;
  }
  
  /**
   * Generiše sliku koristeći Stability AI API (DreamStudio)
   */
  private async generateWithStabilityAI(prompt: string, options?: any): Promise<string | null> {
    const apiKey = config.stabilityApiKey;
    if (!apiKey) return null;
    
    try {
      const width = options?.width || 1024;
      const height = options?.height || 1024;
      
      const response = await axios({
        method: 'post',
        url: 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        data: {
          text_prompts: [
            {
              text: prompt,
              weight: 1
            }
          ],
          cfg_scale: 7,
          height: height,
          width: width,
          samples: 1,
          steps: 30
        }
      });
      
      // Izvuci Base64 generisane slike
      if (response.data.artifacts && response.data.artifacts.length > 0) {
        const base64Image = response.data.artifacts[0].base64;
        
        // Sačuvaj sliku lokalno i vrati URL
        const imageName = `generated_image_${Date.now()}.png`;
        const publicPath = `/blog-images/${imageName}`;
        const fsPath = `./public/blog-images/${imageName}`;
        
        // Osiguraj da direktorijum postoji
        const dir = './public/blog-images';
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Sačuvaj sliku
        fs.writeFileSync(fsPath, Buffer.from(base64Image, 'base64'));
        
        return publicPath; // Vrati URL relativan na /public
      }
    } catch (error) {
      console.error('Greška pri generisanju slike sa Stability AI:', error);
    }
    
    return null;
  }
  
  /**
   * Generiše sliku koristeći Hugging Face API
   */
  private async generateWithHuggingFace(prompt: string, options?: any): Promise<string | null> {
    const apiKey = config.huggingfaceApiKey;
    if (!apiKey) return null;
    
    try {
      const response = await axios({
        method: 'post',
        url: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          inputs: prompt,
          parameters: {
            negative_prompt: "low quality, poor resolution, blurry, amateur",
            num_inference_steps: 50,
            guidance_scale: 7.5
          }
        },
        responseType: 'arraybuffer'
      });
      
      // Sačuvaj sliku lokalno i vrati URL
      const imageName = `generated_image_${Date.now()}.png`;
      const publicPath = `/blog-images/${imageName}`;
      const fsPath = `./public/blog-images/${imageName}`;
      
      // Osiguraj da direktorijum postoji
      const dir = './public/blog-images';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Sačuvaj sliku
      fs.writeFileSync(fsPath, Buffer.from(response.data));
      
      return publicPath; // Vrati URL relativan na /public
    } catch (error) {
      console.error('Greška pri generisanju slike sa Hugging Face:', error);
    }
    
    return null;
  }
  
  /**
   * Pretražuje i preuzima relevantnu sliku sa Lexica API (besplatno)
   */
  private async generateWithLexicaAPI(prompt: string, options?: any): Promise<string | null> {
    try {
      // Koristi Lexica Search API za pronalaženje relevantnih slika
      const searchResponse = await axios({
        method: 'get',
        url: `https://lexica.art/api/v1/search?q=${encodeURIComponent(prompt)}`,
      });
      
      // Ako su pronađene slike, preuzmi prvu
      if (searchResponse.data && searchResponse.data.images && searchResponse.data.images.length > 0) {
        const imageData = searchResponse.data.images[0];
        const imageUrl = imageData.src;
        
        // Preuzmi sliku
        const imageResponse = await axios({
          method: 'get',
          url: imageUrl,
          responseType: 'arraybuffer'
        });
        
        // Sačuvaj sliku lokalno i vrati URL
        const imageName = `lexica_image_${Date.now()}.jpg`;
        const publicPath = `/blog-images/${imageName}`;
        const fsPath = `./public/blog-images/${imageName}`;
        
        // Osiguraj da direktorijum postoji
        const dir = './public/blog-images';
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Sačuvaj sliku
        fs.writeFileSync(fsPath, Buffer.from(imageResponse.data));
        
        return publicPath; // Vrati URL relativan na /public
      }
    } catch (error) {
      console.error('Greška pri dobavljanju slike sa Lexica API:', error);
    }
    
    return null;
  }
  
  /**
   * Optimizuje opis za generisanje slike na osnovu kategorije i naslova
   */
  public getOptimizedPrompt(title: string, category?: string, style?: string): string {
    // Osnovna mapiranja promptova po kategorijama
    const promptMapping: Record<string, string> = {
      'regulative': 'Legal documents, law books, and regulations related to workplace safety',
      'procena-rizika': 'Risk assessment in the workplace, safety inspection of equipment',
      'obuke-zaposlenih': 'Professional training session for workplace safety, employees learning safety procedures',
      'zaštita-zdravlja': 'Medical professionals discussing occupational health measures in a workplace',
      'general': 'A professional workplace with clear safety measures in place',
      'bezbednost-na-radu': 'Workplace safety equipment and practices, protective gear',
      'propisi': 'Official document with stamps and signatures, legal text',
      'saveti': 'Professional workplace consultation, business meeting about safety',
      'novosti': 'News about workplace safety, professional announcement',
    };
    
    // Stilski dodaci
    const styleAdditions: Record<string, string> = {
      'corporate': 'corporate style, professional, business environment',
      'modern': 'modern workspace, contemporary design, clean lines',
      'realistic': 'realistic photo, high detail, professional photography',
      'informative': 'informative illustration, educational, labeled diagram',
      'technical': 'technical drawing, blueprint style, schematic design'
    };
    
    // Izaberi osnovni opis na osnovu kategorije
    const basePrompt = promptMapping[category || 'general'] || promptMapping['general'];
    
    // Dodaj stil ako je naveden
    const styleAddition = style ? styleAdditions[style] || '' : 'professional, clean, high quality';
    
    // Kombinuj sa naslovom za specifičniji opis
    return `${basePrompt}. The image should reflect the topic: "${title}". ${styleAddition}, suitable for a business blog post about workplace safety and health.`;
  }
}

export const imageGenerationService = new ImageGenerationService();
