import { Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { Notification, NotificationType } from '../models/Notification.js';

export class NotificationController {
  /**
   * Helper function to create an in-app notification in MongoDB
   */
  static async createNotification(params: {
    userId?: string | Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    referenceId?: string;
    referenceType?: 'InterviewSession' | 'FeedbackReport' | 'Resume' | 'System';
  }): Promise<void> {
    try {
      if (!params.userId || !mongoose.Types.ObjectId.isValid(params.userId.toString())) return;

      // Prevent exact duplicates created in short timeframes
      const recentDuplicate = await Notification.findOne({
        userId: new Types.ObjectId(params.userId.toString()),
        type: params.type,
        referenceId: params.referenceId,
        createdAt: { $gte: new Date(Date.now() - 5000) }, // within last 5s
      });

      if (!recentDuplicate) {
        await Notification.create({
          userId: new Types.ObjectId(params.userId.toString()),
          type: params.type,
          title: params.title,
          message: params.message,
          read: false,
          referenceId: params.referenceId,
          referenceType: params.referenceType || 'System',
        });
      }
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  }

  /**
   * GET /api/notifications
   * Fetches paginated notifications for the authenticated user
   */
  static async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      if (!authUserId || !mongoose.Types.ObjectId.isValid(authUserId)) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { limit = 15, page = 1 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const userObjectId = new Types.ObjectId(authUserId);

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find({ userId: userObjectId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Notification.countDocuments({ userId: userObjectId }),
        Notification.countDocuments({ userId: userObjectId, read: false }),
      ]);

      res.json({
        notifications,
        total,
        unreadCount,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      });
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Returns current count of unread notifications
   */
  static async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      if (!authUserId || !mongoose.Types.ObjectId.isValid(authUserId)) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const unreadCount = await Notification.countDocuments({
        userId: new Types.ObjectId(authUserId),
        read: false,
      });

      res.json({ unreadCount });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch unread count' });
    }
  }

  /**
   * PUT /api/notifications/:id/read
   * Marks a specific notification as read with ownership verification
   */
  static async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      const { id } = req.params;

      if (!authUserId || !mongoose.Types.ObjectId.isValid(authUserId)) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid notification id' });
        return;
      }

      const notification = await Notification.findById(id);
      if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      if (notification.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied: You do not own this notification' });
        return;
      }

      notification.read = true;
      await notification.save();

      const unreadCount = await Notification.countDocuments({
        userId: new Types.ObjectId(authUserId),
        read: false,
      });

      res.json({
        message: 'Notification marked as read',
        notification,
        unreadCount,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update notification' });
    }
  }

  /**
   * PUT /api/notifications/read-all
   * Marks all unread notifications for authenticated user as read
   */
  static async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      if (!authUserId || !mongoose.Types.ObjectId.isValid(authUserId)) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const result = await Notification.updateMany(
        { userId: new Types.ObjectId(authUserId), read: false },
        { $set: { read: true } }
      );

      res.json({
        message: 'All notifications marked as read',
        modifiedCount: result.modifiedCount,
        unreadCount: 0,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update notifications' });
    }
  }
}
