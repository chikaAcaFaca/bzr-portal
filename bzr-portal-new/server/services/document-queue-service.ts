
import { EventEmitter } from 'events';

interface QueuedDocument {
  id: string;
  filePath: string;
  mimeType: string;
  originalFilename: string;
  userId: string;
  progress: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
}

class DocumentQueueService {
  private queue: QueuedDocument[] = [];
  private processing: boolean = false;
  private events: EventEmitter;

  constructor() {
    this.events = new EventEmitter();
  }

  async addToQueue(doc: Omit<QueuedDocument, 'progress' | 'status'>): Promise<string> {
    const queuedDoc: QueuedDocument = {
      ...doc,
      progress: 0,
      status: 'queued'
    };
    
    this.queue.push(queuedDoc);
    this.events.emit('document:queued', queuedDoc.id);
    
    if (!this.processing) {
      this.processQueue();
    }
    
    return queuedDoc.id;
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const doc = this.queue[0];
    
    try {
      doc.status = 'processing';
      this.events.emit('document:processing', {
        id: doc.id,
        progress: 0
      });

      // Process document in chunks to track progress
      const result = await this.processDocument(doc);
      
      doc.status = 'completed';
      this.events.emit('document:completed', {
        id: doc.id,
        result
      });
    } catch (error: any) {
      doc.status = 'failed';
      doc.error = error.message;
      this.events.emit('document:failed', {
        id: doc.id,
        error: error.message
      });
    }
    
    this.queue.shift();
    this.processing = false;
    this.processQueue();
  }

  private async processDocument(doc: QueuedDocument): Promise<string> {
    const totalChunks = 10; // Simulate progress in chunks
    
    for (let i = 0; i < totalChunks; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
      
      const progress = Math.round(((i + 1) / totalChunks) * 100);
      this.events.emit('document:progress', {
        id: doc.id,
        progress
      });
    }
    
    return 'Processed document content';
  }

  onProgress(callback: (data: { id: string; progress: number }) => void) {
    this.events.on('document:progress', callback);
  }

  onCompleted(callback: (data: { id: string; result: string }) => void) {
    this.events.on('document:completed', callback);
  }

  onFailed(callback: (data: { id: string; error: string }) => void) {
    this.events.on('document:failed', callback);
  }
}

export const documentQueueService = new DocumentQueueService();
