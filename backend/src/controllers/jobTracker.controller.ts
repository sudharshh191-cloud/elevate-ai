import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { TrackedJob, ITrackedJob, ApplicationStatus, ITrackedJobNextAction } from '../models/TrackedJob.js';
import { User } from '../models/User.js';
import { AdaptiveRoadmapService } from '../services/adaptiveRoadmap.service.js';

export class JobTrackerController {
  /**
   * Helper to derive a genuine next action recommendation from job data and analysis
   */
  private static deriveNextAction(job: {
    jobTitle: string;
    company: string;
    status: ApplicationStatus;
    analysisSnapshot?: any;
  }): ITrackedJobNextAction {
    const { status, analysisSnapshot } = job;
    const missing = analysisSnapshot?.missingSkills || [];
    const gaps = analysisSnapshot?.gaps || [];
    const highGaps = gaps.filter((g: any) => g.priority === 'HIGH');
    const firstHighGap = highGaps[0] || gaps[0];

    if (status === 'INTERVIEW') {
      if (firstHighGap) {
        return {
          label: `Revise ${firstHighGap.skill} before interview`,
          actionType: firstHighGap.actionType || 'arena',
          focusTopic: firstHighGap.skill,
          reason: `High-priority requirement for ${job.jobTitle} at ${job.company}`,
        };
      }
      return {
        label: `Launch Mock Interview for ${job.jobTitle}`,
        actionType: 'arena',
        focusTopic: job.jobTitle,
        reason: 'Prepare behavioral and domain questions for upcoming interview',
      };
    }

    if (status === 'ASSESSMENT') {
      if (firstHighGap) {
        return {
          label: `Practice ${firstHighGap.skill} in Coding Arena`,
          actionType: 'arena',
          focusTopic: firstHighGap.skill,
          reason: `Sharpen algorithmic implementation for ${job.company} assessment`,
        };
      }
      return {
        label: 'Take Practice Assessment in Code Arena',
        actionType: 'arena',
        focusTopic: 'Data Structures & Algorithms',
        reason: 'Benchmark your coding speed and test case accuracy',
      };
    }

    if (status === 'APPLIED') {
      if (firstHighGap) {
        return {
          label: `Strengthen ${firstHighGap.skill} on Roadmap`,
          actionType: 'roadmap',
          focusTopic: firstHighGap.skill,
          reason: `Close requirement gap while waiting for ${job.company} recruiter response`,
        };
      }
      return {
        label: 'Tailor Resume & Portfolio Evidence',
        actionType: 'resume',
        focusTopic: job.jobTitle,
        reason: 'Align resume keywords with job description requirements',
      };
    }

    // SAVED status
    if (firstHighGap) {
      if (firstHighGap.category?.toLowerCase().includes('system')) {
        return {
          label: `Design ${firstHighGap.skill} Architecture`,
          actionType: 'system-design',
          focusTopic: firstHighGap.skill,
          reason: `Target requirement for ${job.jobTitle}`,
        };
      }
      return {
        label: `Bridge ${firstHighGap.skill} Gap in Arena`,
        actionType: firstHighGap.actionType || 'arena',
        focusTopic: firstHighGap.skill,
        reason: `Identified gap from ${job.company} job requirements`,
      };
    }

    if (missing.length > 0) {
      return {
        label: `Review ${missing[0]} fundamentals`,
        actionType: 'arena',
        focusTopic: missing[0],
        reason: `Required skill for ${job.jobTitle}`,
      };
    }

    return {
      label: `Prepare for ${job.jobTitle}`,
      actionType: 'arena',
      focusTopic: job.jobTitle,
      reason: 'Practice core technical competencies',
    };
  }

  /**
   * GET /api/jobs
   * Returns list of user-scoped tracked jobs with filtering and stats
   */
  static async getTrackedJobs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      let targetUserId: Types.ObjectId | undefined;

      if (authUserId && mongoose.Types.ObjectId.isValid(authUserId)) {
        targetUserId = new Types.ObjectId(authUserId);
      } else {
        const demoUser = await User.findOne({ email: 'demo@ai-interview.io' });
        if (demoUser) targetUserId = demoUser._id as Types.ObjectId;
      }

      if (!targetUserId) {
        res.status(401).json({ error: 'Authentication required to view tracked jobs.' });
        return;
      }

      const { status, q } = req.query;
      const query: any = { userId: targetUserId };

      if (status && typeof status === 'string' && status !== 'ALL') {
        query.status = status.toUpperCase();
      }

      if (q && typeof q === 'string' && q.trim().length > 0) {
        const regex = new RegExp(q.trim(), 'i');
        query.$or = [{ jobTitle: regex }, { company: regex }, { targetRole: regex }, { location: regex }];
      }

      const [jobs, allUserJobs] = await Promise.all([
        TrackedJob.find(query).sort({ lastUpdated: -1 }),
        TrackedJob.find({ userId: targetUserId }),
      ]);

      const appliedCount = allUserJobs.filter((j) => ['APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'].includes(j.status)).length;
      const interviewCount = allUserJobs.filter((j) => ['INTERVIEW', 'OFFER'].includes(j.status)).length;
      const offerCount = allUserJobs.filter((j) => j.status === 'OFFER').length;

      const stats = {
        total: allUserJobs.length,
        saved: allUserJobs.filter((j) => j.status === 'SAVED').length,
        applied: allUserJobs.filter((j) => j.status === 'APPLIED').length,
        assessment: allUserJobs.filter((j) => j.status === 'ASSESSMENT').length,
        interview: allUserJobs.filter((j) => j.status === 'INTERVIEW').length,
        offer: offerCount,
        rejected: allUserJobs.filter((j) => j.status === 'REJECTED').length,
        withdrawn: allUserJobs.filter((j) => j.status === 'WITHDRAWN').length,
        activeApplications: allUserJobs.filter((j) => ['APPLIED', 'ASSESSMENT', 'INTERVIEW'].includes(j.status)).length,
        upcomingInterviews: allUserJobs.filter((j) => j.status === 'INTERVIEW').length,
        interviewRate: appliedCount > 0 ? Math.round((interviewCount / appliedCount) * 100) : 0,
        conversionRate: appliedCount > 0 ? Math.round((offerCount / appliedCount) * 100) : 0,
      };

      res.json({
        jobs,
        total: jobs.length,
        stats,
      });
    } catch (error: any) {
      console.error('❌ [JobTrackerController] getTrackedJobs error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch tracked opportunities.' });
    }
  }

  /**
   * GET /api/jobs/stats
   * Returns application counts for executive dashboard and tracker headers
   */
  static async getJobStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      let targetUserId: Types.ObjectId | undefined;

      if (authUserId && mongoose.Types.ObjectId.isValid(authUserId)) {
        targetUserId = new Types.ObjectId(authUserId);
      } else {
        const demoUser = await User.findOne({ email: 'demo@ai-interview.io' });
        if (demoUser) targetUserId = demoUser._id as Types.ObjectId;
      }

      if (!targetUserId) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const allUserJobs = await TrackedJob.find({ userId: targetUserId });
      const appliedCount = allUserJobs.filter((j) => ['APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'].includes(j.status)).length;
      const interviewCount = allUserJobs.filter((j) => ['INTERVIEW', 'OFFER'].includes(j.status)).length;
      const offerCount = allUserJobs.filter((j) => j.status === 'OFFER').length;

      const stats = {
        total: allUserJobs.length,
        saved: allUserJobs.filter((j) => j.status === 'SAVED').length,
        applied: allUserJobs.filter((j) => j.status === 'APPLIED').length,
        assessment: allUserJobs.filter((j) => j.status === 'ASSESSMENT').length,
        interview: allUserJobs.filter((j) => j.status === 'INTERVIEW').length,
        offer: offerCount,
        rejected: allUserJobs.filter((j) => j.status === 'REJECTED').length,
        withdrawn: allUserJobs.filter((j) => j.status === 'WITHDRAWN').length,
        activeApplications: allUserJobs.filter((j) => ['APPLIED', 'ASSESSMENT', 'INTERVIEW'].includes(j.status)).length,
        upcomingInterviews: allUserJobs.filter((j) => j.status === 'INTERVIEW').length,
        interviewRate: appliedCount > 0 ? Math.round((interviewCount / appliedCount) * 100) : 0,
        conversionRate: appliedCount > 0 ? Math.round((offerCount / appliedCount) * 100) : 0,
      };

      res.json({ stats });
    } catch (error: any) {
      console.error('❌ [JobTrackerController] getJobStats error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch job stats.' });
    }
  }

  /**
   * GET /api/jobs/:id
   * Returns a specific tracked job with full detail
   */
  static async getTrackedJobById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid tracked job ID.' });
        return;
      }

      const job = await TrackedJob.findById(id);
      if (!job) {
        res.status(404).json({ error: 'Tracked opportunity not found.' });
        return;
      }

      // Security: Validate user ownership
      if (authUserId && job.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied: You do not own this tracked opportunity.' });
        return;
      }

      res.json({ job });
    } catch (error: any) {
      console.error('❌ [JobTrackerController] getTrackedJobById error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch tracked job.' });
    }
  }

  /**
   * POST /api/jobs
   * Creates a new tracked opportunity (from manual entry or Job Intelligence analysis)
   */
  static async createTrackedJob(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      let targetUserId: Types.ObjectId | undefined;

      if (authUserId && mongoose.Types.ObjectId.isValid(authUserId)) {
        targetUserId = new Types.ObjectId(authUserId);
      } else {
        const demoUser = await User.findOne({ email: 'demo@ai-interview.io' });
        if (demoUser) targetUserId = demoUser._id as Types.ObjectId;
      }

      if (!targetUserId) {
        res.status(401).json({ error: 'Authentication required to track opportunities.' });
        return;
      }

      const {
        jobTitle,
        company,
        jobDescription,
        source,
        jobUrl,
        location,
        employmentType,
        salaryRange,
        status = 'SAVED',
        notes,
        targetRole,
        jobAnalysisId,
        analysisSnapshot,
        syncRoadmap = true,
      } = req.body;

      if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim().length === 0) {
        res.status(400).json({ error: 'Job title is required.' });
        return;
      }

      if (!company || typeof company !== 'string' || company.trim().length === 0) {
        res.status(400).json({ error: 'Company name is required.' });
        return;
      }

      const validStatuses: ApplicationStatus[] = [
        'SAVED',
        'APPLIED',
        'ASSESSMENT',
        'INTERVIEW',
        'OFFER',
        'REJECTED',
        'WITHDRAWN',
      ];
      const normalizedStatus: ApplicationStatus = validStatuses.includes(status?.toUpperCase())
        ? status.toUpperCase()
        : 'SAVED';

      const user = await User.findById(targetUserId);
      const computedTargetRole = targetRole || user?.targetRole || 'Software Engineer';

      const computedNextAction = JobTrackerController.deriveNextAction({
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        status: normalizedStatus,
        analysisSnapshot,
      });

      // Check for existing duplicate tracked job for same company and title
      let existing = await TrackedJob.findOne({
        userId: targetUserId,
        company: new RegExp(`^${company.trim()}$`, 'i'),
        jobTitle: new RegExp(`^${jobTitle.trim()}$`, 'i'),
      });

      if (existing) {
        existing.status = normalizedStatus;
        if (jobDescription) existing.jobDescription = jobDescription;
        if (jobUrl) existing.jobUrl = jobUrl;
        if (location) existing.location = location;
        if (employmentType) existing.employmentType = employmentType;
        if (salaryRange) existing.salaryRange = salaryRange;
        if (notes) existing.notes = notes;
        if (analysisSnapshot) existing.analysisSnapshot = analysisSnapshot;
        if (jobAnalysisId) existing.jobAnalysisId = jobAnalysisId;
        existing.nextAction = computedNextAction;
        existing.lastUpdated = new Date();
        if (normalizedStatus === 'APPLIED' && !existing.dateApplied) {
          existing.dateApplied = new Date();
        }

        await existing.save();

        // Optionally sync gaps to roadmap
        if (syncRoadmap && analysisSnapshot?.missingSkills?.length > 0) {
          try {
            await AdaptiveRoadmapService.recordJobIntelligence(targetUserId, {
              jobTitle: existing.jobTitle,
              company: existing.company,
              missingSkills: analysisSnapshot.missingSkills,
              requiredSkills: analysisSnapshot.requiredSkills || [],
            });
          } catch (err: any) {
            console.warn('⚠️ [JobTrackerController] Roadmap sync skipped:', err.message);
          }
        }

        res.json({
          message: `Updated existing tracked opportunity for ${company.trim()}`,
          job: existing,
          isNew: false,
        });
        return;
      }

      const formatNotes = (rawNotes: any): string | undefined => {
        if (typeof rawNotes === 'string') return rawNotes.trim();
        if (Array.isArray(rawNotes)) {
          return rawNotes.map((n) => (typeof n === 'string' ? n : (n.content || JSON.stringify(n)))).join('\n');
        }
        if (rawNotes && typeof rawNotes === 'object') {
          return rawNotes.content || JSON.stringify(rawNotes);
        }
        return undefined;
      };

      const newJob = await TrackedJob.create({
        userId: targetUserId,
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        jobDescription: jobDescription?.trim(),
        source: source?.trim() || 'Job Intelligence',
        jobUrl: jobUrl?.trim(),
        location: location?.trim() || 'Remote',
        employmentType: employmentType?.trim() || 'Full-time',
        salaryRange: salaryRange?.trim(),
        status: normalizedStatus,
        dateAdded: new Date(),
        dateApplied: normalizedStatus === 'APPLIED' ? new Date() : undefined,
        lastUpdated: new Date(),
        notes: formatNotes(notes),
        targetRole: computedTargetRole,
        jobAnalysisId,
        analysisSnapshot,
        nextAction: computedNextAction,
      });

      // Synchronize missing skills into candidate's Adaptive Roadmap
      if (syncRoadmap && analysisSnapshot?.missingSkills?.length > 0) {
        try {
          await AdaptiveRoadmapService.recordJobIntelligence(targetUserId, {
            jobTitle: newJob.jobTitle,
            company: newJob.company,
            missingSkills: analysisSnapshot.missingSkills,
            requiredSkills: analysisSnapshot.requiredSkills || [],
          });
        } catch (err: any) {
          console.warn('⚠️ [JobTrackerController] Roadmap sync skipped:', err.message);
        }
      }

      res.status(201).json({
        success: true,
        message: `Tracked ${jobTitle.trim()} at ${company.trim()}`,
        job: newJob,
        isNew: true,
      });
    } catch (error: any) {
      console.error('❌ [JobTrackerController] createTrackedJob error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to create tracked job.' });
    }
  }

  /**
   * PUT /api/jobs/:id
   * Updates status, notes, or details of a tracked opportunity
   */
  static async updateTrackedJob(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid tracked job ID.' });
        return;
      }

      const job = await TrackedJob.findById(id);
      if (!job) {
        res.status(404).json({ error: 'Tracked opportunity not found.' });
        return;
      }

      if (authUserId && job.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied: You do not own this tracked opportunity.' });
        return;
      }

      const {
        status,
        notes,
        location,
        employmentType,
        jobUrl,
        salaryRange,
        dateApplied,
        jobTitle,
        company,
        targetRole,
      } = req.body;

      if (status) {
        const validStatuses: ApplicationStatus[] = [
          'SAVED',
          'APPLIED',
          'ASSESSMENT',
          'INTERVIEW',
          'OFFER',
          'REJECTED',
          'WITHDRAWN',
        ];
        if (validStatuses.includes(status.toUpperCase())) {
          const newStatus = status.toUpperCase() as ApplicationStatus;
          job.status = newStatus;
          if (newStatus === 'APPLIED' && !job.dateApplied) {
            job.dateApplied = new Date();
          }
        }
      }

      const formatNotes = (rawNotes: any): string | undefined => {
        if (typeof rawNotes === 'string') return rawNotes.trim();
        if (Array.isArray(rawNotes)) {
          return rawNotes.map((n) => (typeof n === 'string' ? n : (n.content || JSON.stringify(n)))).join('\n');
        }
        if (rawNotes && typeof rawNotes === 'object') {
          return rawNotes.content || JSON.stringify(rawNotes);
        }
        return undefined;
      };

      if (notes !== undefined) job.notes = formatNotes(notes);
      if (typeof location === 'string') job.location = location.trim();
      if (typeof employmentType === 'string') job.employmentType = employmentType.trim();
      if (typeof jobUrl === 'string') job.jobUrl = jobUrl.trim();
      if (typeof salaryRange === 'string') job.salaryRange = salaryRange.trim();
      if (dateApplied) job.dateApplied = new Date(dateApplied);
      if (typeof jobTitle === 'string' && jobTitle.trim()) job.jobTitle = jobTitle.trim();
      if (typeof company === 'string' && company.trim()) job.company = company.trim();
      if (typeof targetRole === 'string' && targetRole.trim()) job.targetRole = targetRole.trim();

      job.nextAction = JobTrackerController.deriveNextAction({
        jobTitle: job.jobTitle,
        company: job.company,
        status: job.status,
        analysisSnapshot: job.analysisSnapshot,
      });

      job.lastUpdated = new Date();
      await job.save();

      res.json({
        success: true,
        message: 'Opportunity updated successfully.',
        job,
      });
    } catch (error: any) {
      console.error('❌ [JobTrackerController] updateTrackedJob error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to update tracked job.' });
    }
  }

  /**
   * DELETE /api/jobs/:id
   * Removes a tracked opportunity
   */
  static async deleteTrackedJob(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid tracked job ID.' });
        return;
      }

      const job = await TrackedJob.findById(id);
      if (!job) {
        res.status(404).json({ error: 'Tracked opportunity not found.' });
        return;
      }

      if (authUserId && job.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied: You do not own this tracked opportunity.' });
        return;
      }

      await TrackedJob.deleteOne({ _id: id });

      res.json({
        success: true,
        message: 'Tracked opportunity removed successfully.',
        id,
      });
    } catch (error: any) {
      console.error('❌ [JobTrackerController] deleteTrackedJob error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to delete tracked job.' });
    }
  }

  /**
   * POST /api/jobs/:id/sync-roadmap
   * Explicitly syncs this job's skill gaps to the candidate's Adaptive Roadmap
   */
  static async syncJobToRoadmap(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid tracked job ID.' });
        return;
      }

      const job = await TrackedJob.findById(id);
      if (!job) {
        res.status(404).json({ error: 'Tracked opportunity not found.' });
        return;
      }

      if (authUserId && job.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied.' });
        return;
      }

      const missingSkills = job.analysisSnapshot?.missingSkills || [];
      if (!missingSkills.length) {
        res.json({
          success: true,
          message: 'No unmapped skill gaps found for this job opportunity.',
          itemsAddedCount: 0,
        });
        return;
      }

      await AdaptiveRoadmapService.recordJobIntelligence(job.userId, {
        jobTitle: job.jobTitle,
        company: job.company,
        missingSkills,
        requiredSkills: job.analysisSnapshot?.requiredSkills || [],
      });

      const updatedRoadmap = await AdaptiveRoadmapService.getRoadmap(job.userId);

      res.json({
        success: true,
        message: `Synced ${missingSkills.length} skill gaps from ${job.company} to Adaptive Roadmap.`,
        roadmapItems: updatedRoadmap,
      });
    } catch (error: any) {
      console.error('❌ [JobTrackerController] syncJobToRoadmap error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to sync job to roadmap.' });
    }
  }
}
