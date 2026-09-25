import { Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { UserSettings, IUserSettings } from '../models/UserSettings.js';
import { User } from '../models/User.js';

export class UserSettingsController {
  /**
   * GET /api/user/settings
   * Fetches or initializes user settings from MongoDB
   */
  static async getUserSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      if (!authUserId || !mongoose.Types.ObjectId.isValid(authUserId)) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const userObjectId = new Types.ObjectId(authUserId);
      let settings = await UserSettings.findOne({ userId: userObjectId });
      const user = await User.findById(userObjectId);

      if (!settings) {
        settings = await UserSettings.create({
          userId: userObjectId,
          theme: 'dark',
          audioSensitivity: 80,
          preferredDomain: 'Fullstack',
          preferredDifficulty: (user?.experienceLevel as any) || 'Senior',
          preferredFormat: 'Hybrid',
          enableVoiceAvatar: true,
          enableLiveCoaching: true,
          enableSoundEffects: true,
          notifications: {
            emailAlerts: true,
            weeklyProgressSummary: true,
            interviewReminders: true,
          },
        });
      }

      res.json({
        settings: {
          ...settings.toJSON(),
          targetRole: user?.targetRole || 'Senior Fullstack Engineer',
          experienceLevel: user?.experienceLevel || 'Senior',
        },
      });
    } catch (error: any) {
      console.error('Error fetching user settings:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch user settings' });
    }
  }

  /**
   * PUT /api/user/settings
   * Updates user settings in MongoDB and synchronizes targetRole with User document
   */
  static async updateUserSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      if (!authUserId || !mongoose.Types.ObjectId.isValid(authUserId)) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const userObjectId = new Types.ObjectId(authUserId);
      const {
        theme,
        audioSensitivity,
        preferredDomain,
        preferredDifficulty,
        preferredFormat,
        enableVoiceAvatar,
        enableLiveCoaching,
        enableSoundEffects,
        notifications,
        targetRole,
        experienceLevel,
      } = req.body;

      let settings = await UserSettings.findOne({ userId: userObjectId });

      if (!settings) {
        settings = new UserSettings({ userId: userObjectId });
      }

      if (theme !== undefined) settings.theme = theme;
      if (audioSensitivity !== undefined) settings.audioSensitivity = audioSensitivity;
      if (preferredDomain !== undefined) settings.preferredDomain = preferredDomain;
      if (preferredDifficulty !== undefined) settings.preferredDifficulty = preferredDifficulty;
      if (preferredFormat !== undefined) settings.preferredFormat = preferredFormat;
      if (enableVoiceAvatar !== undefined) settings.enableVoiceAvatar = enableVoiceAvatar;
      if (enableLiveCoaching !== undefined) settings.enableLiveCoaching = enableLiveCoaching;
      if (enableSoundEffects !== undefined) settings.enableSoundEffects = enableSoundEffects;
      if (notifications !== undefined) {
        settings.notifications = {
          ...settings.notifications,
          ...notifications,
        };
      }

      await settings.save();

      // Synchronize targetRole and experienceLevel with User model
      if (targetRole !== undefined || experienceLevel !== undefined) {
        const user = await User.findById(userObjectId);
        if (user) {
          if (targetRole !== undefined) user.targetRole = targetRole;
          if (experienceLevel !== undefined) user.experienceLevel = experienceLevel;
          await user.save();
        }
      }

      const updatedUser = await User.findById(userObjectId);

      res.json({
        message: 'Settings updated successfully',
        settings: {
          ...settings.toJSON(),
          targetRole: updatedUser?.targetRole || 'Senior Fullstack Engineer',
          experienceLevel: updatedUser?.experienceLevel || 'Senior',
        },
      });
    } catch (error: any) {
      console.error('Error updating user settings:', error);
      res.status(500).json({ error: error.message || 'Failed to update user settings' });
    }
  }
}
