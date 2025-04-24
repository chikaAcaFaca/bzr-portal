import fetch from 'node-fetch';

interface OpenRouterResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DocumentParseResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Service for working with OpenRouter AI API
 */
export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openrouter.ai/api/v1/chat/completions';
  private defaultModel: string = 'gpt-3.5-turbo';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    
    if (!this.apiKey) {
      console.error('OpenRouter API key is missing. Set the OPENROUTER_API_KEY environment variable.');
    }
  }

  /**
   * Send a prompt to OpenRouter API
   */
  async sendPrompt(
    prompt: string, 
    model: string = this.defaultModel
  ): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenRouter API key is not configured');
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://replit.com',
          'X-Title': 'Workplace Safety App'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert assistant for occupational health and safety documentation analysis. Analyze documents precisely and extract structured data in the requested format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // Lower temperature for more deterministic outputs
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${error}`);
      }

      const data = await response.json() as OpenRouterResponse;
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error in OpenRouter service:', error);
      throw error;
    }
  }

  /**
   * Parse job position document and extract structured data
   */
  async parseJobPositionDocument(documentText: string): Promise<DocumentParseResult> {
    try {
      const prompt = `
        Analyze the following job position document and extract the structured data.
        The document contains information about job positions in a company.
        
        Extract the following information for each job position:
        - title: Job position title
        - department: Department or organizational unit
        - description: Brief description of the job
        - responsibilities: List of responsibilities
        - requiredSkills: List of required skills
        - positionType: Categorize as one of: [direktori, rukovodioci, administrativni, radnici, vozaci, tehnicko_osoblje]
        - coefficient: A numerical value representing the position's importance or rank (if available)
        - riskLevel: Risk level assessment as one of: [nisko, srednje, visoko]
        
        Return the data as a valid JSON array of job positions.
        
        Document text:
        ${documentText}
      `;

      const response = await this.sendPrompt(prompt);
      
      // Try to parse the JSON response
      let jsonResponse;
      try {
        // Extract JSON from the response in case it's wrapped in markdown or text
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                          response.match(/```\n([\s\S]*?)\n```/) ||
                          response.match(/(\[\s*\{[\s\S]*\}\s*\])/);
                          
        const jsonString = jsonMatch ? jsonMatch[1] : response;
        jsonResponse = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        return {
          success: false,
          error: 'Failed to parse AI response'
        };
      }

      return {
        success: true,
        data: jsonResponse
      };
    } catch (error: any) {
      console.error('Error parsing job position document:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Parse employee data document and extract structured data
   */
  async parseEmployeeDocument(documentText: string): Promise<DocumentParseResult> {
    try {
      const prompt = `
        Analyze the following employee data document and extract the structured data.
        The document contains information about employees and their assigned job positions.
        
        Extract the following information for each employee:
        - firstName: Employee's first name
        - lastName: Employee's last name
        - email: Employee's email (if available, generate a placeholder if not)
        - phone: Employee's phone number (if available)
        - jobPositionTitle: The job position title
        
        Return the data as a valid JSON array of employees.
        
        Document text:
        ${documentText}
      `;

      const response = await this.sendPrompt(prompt);
      
      let jsonResponse;
      try {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                          response.match(/```\n([\s\S]*?)\n```/) ||
                          response.match(/(\[\s*\{[\s\S]*\}\s*\])/);
                          
        const jsonString = jsonMatch ? jsonMatch[1] : response;
        jsonResponse = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        return {
          success: false,
          error: 'Failed to parse AI response'
        };
      }

      return {
        success: true,
        data: jsonResponse
      };
    } catch (error: any) {
      console.error('Error parsing employee document:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Parse job descriptions document and extract structured data
   */
  async parseJobDescriptionDocument(documentText: string): Promise<DocumentParseResult> {
    try {
      const prompt = `
        Analyze the following job description document and extract the structured data.
        The document contains detailed descriptions of job positions.
        
        Extract the following information for each job description:
        - jobPositionTitle: The title of the job position
        - description: Detailed description of the job
        - duties: List of duties and responsibilities
        - workingConditions: Description of working conditions
        - equipment: List of equipment used
        
        Return the data as a valid JSON array of job descriptions.
        
        Document text:
        ${documentText}
      `;

      const response = await this.sendPrompt(prompt);
      
      let jsonResponse;
      try {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                          response.match(/```\n([\s\S]*?)\n```/) ||
                          response.match(/(\[\s*\{[\s\S]*\}\s*\])/);
                          
        const jsonString = jsonMatch ? jsonMatch[1] : response;
        jsonResponse = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        return {
          success: false,
          error: 'Failed to parse AI response'
        };
      }

      return {
        success: true,
        data: jsonResponse
      };
    } catch (error: any) {
      console.error('Error parsing job description document:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate risk categories based on job positions
   */
  async generateRiskCategories(jobPositions: any[]): Promise<DocumentParseResult> {
    try {
      const prompt = `
        Based on the following list of job positions, generate appropriate risk categories.
        
        Follow these rules:
        1. Directors should be in the first category
        2. Managers with highest coefficients should be in the second category
        3. Administrative workers in another category
        4. Group technical roles (mechanics, electricians, etc.) together
        5. Drivers in a separate category
        
        Each risk category should have:
        - name: A descriptive name for the category
        - description: A detailed description of the risk category
        - severity: One of [Low, Medium, High]
        - likelihood: One of [Unlikely, Possible, Likely]
        - jobPositions: Array of job position IDs that belong to this category
        
        Job positions:
        ${JSON.stringify(jobPositions, null, 2)}
        
        Return the data as a valid JSON array of risk categories.
      `;

      const response = await this.sendPrompt(prompt);
      
      let jsonResponse;
      try {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                          response.match(/```\n([\s\S]*?)\n```/) ||
                          response.match(/(\[\s*\{[\s\S]*\}\s*\])/);
                          
        const jsonString = jsonMatch ? jsonMatch[1] : response;
        jsonResponse = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        return {
          success: false,
          error: 'Failed to parse AI response'
        };
      }

      return {
        success: true,
        data: jsonResponse
      };
    } catch (error) {
      console.error('Error generating risk categories:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate risks and safety measures for specific job positions
   */
  async generateRisksAndMeasures(jobPositionData: any, categoryId: number): Promise<DocumentParseResult> {
    try {
      const prompt = `
        Generate specific occupational safety risks and appropriate safety measures for the following job position:
        
        Job Position: ${JSON.stringify(jobPositionData, null, 2)}
        Category ID: ${categoryId}
        
        Generate:
        1. A list of potential risks with:
           - description: Clear description of the risk
           - potentialHarm: Potential consequences if the risk materializes
           - controlMeasures: List of measures that can be taken to control this risk
           - categoryId: The provided category ID (${categoryId})
        
        2. A list of safety measures with:
           - title: Short title of the safety measure
           - description: Detailed description of the safety measure
           - instructions: Specific instructions for implementing the measure
           - requiredEquipment: List of equipment needed for this safety measure
           - applicableRiskCategories: [${categoryId}]
        
        Return the data as a valid JSON object with two properties: "risks" (array) and "safetyMeasures" (array).
      `;

      const response = await this.sendPrompt(prompt);
      
      let jsonResponse;
      try {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                          response.match(/```\n([\s\S]*?)\n```/) ||
                          response.match(/(\{\s*"risks"\s*:[\s\S]*\}\s*\})/);
                          
        const jsonString = jsonMatch ? jsonMatch[1] : response;
        jsonResponse = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        return {
          success: false,
          error: 'Failed to parse AI response'
        };
      }

      return {
        success: true,
        data: jsonResponse
      };
    } catch (error) {
      console.error('Error generating risks and measures:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const openRouterService = new OpenRouterService();