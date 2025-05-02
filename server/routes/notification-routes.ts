import express, { Request, Response } from 'express';
import { notificationService } from '../services/notification-service';

export const notificationRouter = express.Router();

/**
 * Middleware za proveru autentikacije
 */
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Niste autentifikovani'
    });
  }
  next();
};

/**
 * Vraća sve nepročitane notifikacije za trenutnog korisnika
 */
notificationRouter.get("/unread", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id.toString();
    const notifications = await notificationService.getUnreadNotificationsForUser(userId);
    
    return res.json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error: any) {
    console.error('Greška pri dobavljanju nepročitanih notifikacija:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Došlo je do greške pri dobavljanju notifikacija'
    });
  }
});

/**
 * Vraća sve notifikacije za trenutnog korisnika
 */
notificationRouter.get("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id.toString();
    const notifications = await notificationService.getAllNotificationsForUser(userId);
    
    return res.json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error: any) {
    console.error('Greška pri dobavljanju notifikacija:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Došlo je do greške pri dobavljanju notifikacija'
    });
  }
});

/**
 * Označava notifikaciju kao pročitanu
 */
notificationRouter.put("/:id/read", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = (req.user as any).id.toString();
    
    // Prvo proverimo da li notifikacija pripada korisniku
    const userNotifications = await notificationService.getAllNotificationsForUser(userId);
    const notificationExists = userNotifications.some(n => n.id === id);
    
    if (!notificationExists) {
      return res.status(404).json({
        success: false,
        message: 'Notifikacija nije pronađena ili ne pripada trenutnom korisniku'
      });
    }
    
    const updatedNotification = await notificationService.markAsRead(id);
    
    if (!updatedNotification) {
      return res.status(404).json({
        success: false,
        message: 'Notifikacija nije pronađena'
      });
    }
    
    return res.json({
      success: true,
      notification: updatedNotification
    });
  } catch (error: any) {
    console.error('Greška pri označavanju notifikacije kao pročitane:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Došlo je do greške pri ažuriranju notifikacije'
    });
  }
});

/**
 * Testna ruta za kreiranje notifikacije
 */
notificationRouter.post("/test", isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Provera da li je korisnik admin
    if ((req.user as any).role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Samo administratori mogu kreirati test notifikacije'
      });
    }
    
    const { type, content, userId } = req.body;
    
    if (!type || !content) {
      return res.status(400).json({
        success: false,
        message: 'Nedostaju obavezni parametri: type, content'
      });
    }
    
    const targetUserId = userId || (req.user as any).id.toString();
    
    const notification = await notificationService.createNotification({
      userId: targetUserId,
      type: type,
      content,
      objectId: req.body.objectId,
      objectType: req.body.objectType
    });
    
    return res.status(201).json({
      success: true,
      notification
    });
  } catch (error: any) {
    console.error('Greška pri kreiranju test notifikacije:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Došlo je do greške pri kreiranju notifikacije'
    });
  }
});