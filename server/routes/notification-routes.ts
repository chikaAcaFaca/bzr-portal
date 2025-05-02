import express, { Request, Response } from 'express';
import { notificationService } from '../services/notification-service';

export const notificationRouter = express.Router();

const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Nije autentifikovan" });
  }
  
  return next();
};

// Sve notifikacijske rute zahtevaju autentifikaciju
notificationRouter.use(isAuthenticated);

// Dobijanje nepročitanih notifikacija za korisnika
notificationRouter.get("/unread", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    
    const notifications = await notificationService.getUnreadNotificationsForUser(user.id);
    res.json(notifications);
  } catch (error) {
    console.error("Greška pri dobijanju notifikacija:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Dobijanje svih notifikacija za korisnika
notificationRouter.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    
    const notifications = await notificationService.getAllNotificationsForUser(user.id);
    res.json(notifications);
  } catch (error) {
    console.error("Greška pri dobijanju notifikacija:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});

// Označavanje notifikacije kao pročitane
notificationRouter.put("/:id/read", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID mora biti broj" });
    }
    
    const notification = await notificationService.markAsRead(id);
    if (!notification) {
      return res.status(404).json({ message: "Notifikacija nije pronađena" });
    }
    
    res.json(notification);
  } catch (error) {
    console.error("Greška pri ažuriranju notifikacije:", error);
    res.status(500).json({ message: "Greška servera" });
  }
});