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
    const now = new Date();
    
    const newNotification: Notification = {
      id: this.currentId++,
      ...notification,
      read: false,
      createdAt: now
    };
    
    this.notifications.set(newNotification.id, newNotification);
    
    return newNotification;
  }

  /**
   * Šalje notifikaciju svim admin korisnicima
   */
  public async notifyAllAdmins(notification: Omit<InsertNotification, 'userId'>): Promise<Notification[]> {
    // 1. Dohvatamo sve admin korisnike
    const adminUsers = await storage.getUsersByRole('admin');
    
    if (adminUsers.length === 0) {
      console.warn('Nema admin korisnika za slanje notifikacije');
      return [];
    }
    
    // 2. Kreiramo notifikaciju za svakog admina
    const notifications: Notification[] = [];
    
    for (const admin of adminUsers) {
      const newNotification = await this.createNotification({
        ...notification,
        userId: admin.id.toString(),
      });
      
      notifications.push(newNotification);
    }
    
    return notifications;
  }

  /**
   * Šalje notifikaciju o novom blog postu koji čeka odobrenje
   */
  public async notifyBlogApproval(blogPostId: number, title: string): Promise<Notification[]> {
    return this.notifyAllAdmins({
      type: 'blog_approval',
      content: `Novi blog post "${title}" čeka vaše odobrenje.`,
      objectId: blogPostId,
      objectType: 'blog_post'
    });
  }

  /**
   * Vraća sve nepročitane notifikacije za korisnika
   */
  public async getUnreadNotificationsForUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.read)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sortirano po vremenu (najnovije prvo)
  }

  /**
   * Vraća sve notifikacije za korisnika
   */
  public async getAllNotificationsForUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sortirano po vremenu (najnovije prvo)
  }

  /**
   * Označava notifikaciju kao pročitanu
   */
  public async markAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    
    if (!notification) {
      return undefined;
    }
    
    notification.read = true;
    this.notifications.set(id, notification);
    
    return notification;
  }
}

export const notificationService = new NotificationService();