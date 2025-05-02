import { storage } from '../storage';

export interface Notification {
  id: number;
  userId: string;
  type: 'blog_approval' | 'system_message' | 'new_document' | 'comment';
  content: string;
  read: boolean;
  objectId?: string | number; // ID povezanog objekta (npr. blog post ID)
  objectType?: string; // Tip povezanog objekta (npr. 'blog_post')
  createdAt: Date;
}

export interface InsertNotification {
  userId: string;
  type: 'blog_approval' | 'system_message' | 'new_document' | 'comment';
  content: string;
  objectId?: string | number;
  objectType?: string;
}

/**
 * Servis za upravljanje sistemskim notifikacijama
 */
class NotificationService {
  private currentId = 1;
  private notifications: Map<number, Notification> = new Map();

  /**
   * Kreira novu notifikaciju za korisnika
   */
  public async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.currentId++;
    const now = new Date();
    
    const newNotification: Notification = {
      id,
      ...notification,
      read: false,
      createdAt: now
    };
    
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  /**
   * Šalje notifikaciju svim admin korisnicima
   */
  public async notifyAllAdmins(notification: Omit<InsertNotification, 'userId'>): Promise<Notification[]> {
    try {
      // U stvarnoj implementaciji, ovo bi dohvatalo sve admine iz baze
      // Za sada, samo vraćamo fiksne ID-eve 
      const adminUserIds = ['admin-1', 'admin-2']; 
      
      const createdNotifications: Notification[] = [];
      
      for (const adminId of adminUserIds) {
        const notif = await this.createNotification({
          ...notification,
          userId: adminId
        });
        createdNotifications.push(notif);
      }
      
      return createdNotifications;
    } catch (error) {
      console.error('Greška pri slanju notifikacije adminima:', error);
      return [];
    }
  }

  /**
   * Šalje notifikaciju o novom blog postu koji čeka odobrenje
   */
  public async notifyBlogApproval(blogPostId: number, title: string): Promise<Notification[]> {
    return this.notifyAllAdmins({
      type: 'blog_approval',
      content: `Nov blog post čeka odobrenje: "${title}"`,
      objectId: blogPostId,
      objectType: 'blog_post'
    });
  }

  /**
   * Vraća sve nepročitane notifikacije za korisnika
   */
  public async getUnreadNotificationsForUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.read)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Vraća sve notifikacije za korisnika
   */
  public async getAllNotificationsForUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Označava notifikaciju kao pročitanu
   */
  public async markAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = {
      ...notification,
      read: true
    };
    
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
}

export const notificationService = new NotificationService();