
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

export class WasabiStorageService {
  private s3Client: S3Client;
  private knowledgeBaseBucket: string;
  private userDocumentsBucket: string;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: "https://s3.wasabisys.com",
      region: process.env.WASABI_REGION || "eu-central-1",
      credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || ""
      }
    });

    this.knowledgeBaseBucket = process.env.WASABI_KNOWLEDGE_BASE_BUCKET || "knowledge-base";
    this.userDocumentsBucket = process.env.WASABI_USER_DOCUMENTS_BUCKET || "user-documents";
  }

  async uploadUserDocument(userId: string, folder: string, fileName: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    const key = `${userId}/${folder}/${fileName}`;
    
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.userDocumentsBucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType
      }
    });

    await upload.done();
    return key;
  }

  async getUserDocument(userId: string, key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.userDocumentsBucket,
      Key: `${userId}/${key}`
    });

    const response = await this.s3Client.send(command);
    const stream = response.Body as Readable;
    
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async listUserDocuments(userId: string, folder?: string): Promise<string[]> {
    const prefix = folder ? `${userId}/${folder}/` : `${userId}/`;
    
    const command = new ListObjectsV2Command({
      Bucket: this.userDocumentsBucket,
      Prefix: prefix
    });

    const response = await this.s3Client.send(command);
    return (response.Contents || []).map(obj => obj.Key || '');
  }

  async uploadKnowledgeBase(fileName: string, content: string): Promise<string> {
    const key = `knowledge/${fileName}`;
    
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.knowledgeBaseBucket,
      Key: key,
      Body: content,
      ContentType: 'application/json'
    }));

    return key;
  }

  async getKnowledgeBase(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.knowledgeBaseBucket,
      Key: key
    });

    const response = await this.s3Client.send(command);
    const stream = response.Body as Readable;
    
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      stream.on('error', reject);
    });
  }

  getUserFolders(): string[] {
    return [
      'SISTEMATIZACIJA',
      'SISTEMATIZACIJA SA IMENIMA',
      'OPIS POSLOVA',
      'UGOVORI',
      'OBUKE'
    ];
  }

  isValidFileType(fileName: string): boolean {
    const allowedExtensions = ['.xls', '.doc', '.odt', '.ods', '.pdf', '.jpg', '.png', '.csv', '.bmp'];
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
    return allowedExtensions.includes(ext);
  }
}

export const wasabiStorage = new WasabiStorageService();
