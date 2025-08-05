interface WasabiConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint: string;
  knowledgeBaseBucket: string;
  userDocumentsBucket: string;
  baseUrl: string;
}

interface AppConfig {
  wasabi: WasabiConfig;
  openrouterApiKey: string | undefined;
  geminiApiKey: string | undefined;
  anthropicApiKey: string | undefined;
  stabilityApiKey?: string;
  huggingfaceApiKey?: string;
}

// Konfiguracione vrednosti iz env varijabli
export const config: AppConfig = {
  wasabi: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || '',
    region: process.env.WASABI_REGION || 'eu-west-2',
    endpoint: process.env.WASABI_ENDPOINT || 'https://s3.eu-west-2.wasabisys.com',
    knowledgeBaseBucket: process.env.WASABI_KNOWLEDGE_BASE_BUCKET || 'bzr-knowledge-base-bucket',
    userDocumentsBucket: process.env.WASABI_USER_DOCUMENTS_BUCKET || 'bzr-user-documents-bucket',
    baseUrl: process.env.WASABI_BASE_URL || 'https://s3.eu-west-2.wasabisys.com'
  },
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  stabilityApiKey: process.env.STABILITY_API_KEY,
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY
};