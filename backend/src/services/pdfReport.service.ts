import PDFDocument from 'pdfkit';
import { IFeedbackReport } from '../models/FeedbackReport.js';
import { IInterviewSession } from '../models/InterviewSession.js';
import { IUser } from '../models/User.js';

export interface IPdfReportOptions {
  report: IFeedbackReport;
  session: IInterviewSession;
  candidateName?: string;
  candidateEmail?: string;
  targetRole?: string;
}

export class PdfReportService {
  /**
   * Generates a high-fidelity, multi-page PDF assessment report buffer using pdfkit
   */
  static async generateReportPdf(options: IPdfReportOptions): Promise<Buffer> {
    const { report, session, candidateName = 'Staff Candidate', candidateEmail = '', targetRole = 'Senior Software Engineer' } = options;

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 40,
          size: 'A4',
          bufferPages: true,
          info: {
            Title: `ELEVATE.AI Assessment Report - ${session.domain} (${session.difficulty})`,
            Author: 'ELEVATE.AI Enterprise Platform',
            Subject: 'AI-Powered Staff & Principal Mock Interview Assessment Report',
            Keywords: 'interview, assessment, scorecard, elevate.ai, machine learning',
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on('error', (err) => reject(err));

        // Color Palette
        const primaryColor = '#4F46E5'; // Indigo
        const secondaryColor = '#10B981'; // Emerald
        const darkBg = '#0B0F19'; // Deep Navy
        const darkCardBg = '#111827';
        const textLight = '#F8FAFC';
        const textMuted = '#94A3B8';
        const textSecondary = '#CBD5E1';
        const borderColor = '#334155';
        const accentAmber = '#F59E0B';
        const accentRose = '#F43F5E';

        const getTierColor = (tier: string) => {
          switch (tier) {
            case 'Exceptional':
            case 'Strong Hire':
              return '#10B981';
            case 'Hire':
              return '#4F46E5';
            case 'Borderline':
              return '#F59E0B';
            default:
              return '#F43F5E';
          }
        };

        const tierColor = getTierColor(report.performanceTier);

        // ==========================================
        // PAGE 1: EXECUTIVE SUMMARY & SCORECARD
        // ==========================================

        // Header Background Banner
        doc.rect(0, 0, doc.page.width, 105).fill('#0F172A');

        // Brand Logo & Title
        doc.fillColor('#818CF8').fontSize(16).font('Helvetica-Bold').text('ELEVATE', 40, 25, { continued: true });
        doc.fillColor('#10B981').text('.AI', { continued: true });
        doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('  |  Executive Mock Interview Scorecard', { align: 'left' });

        doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text(`${session.domain} Assessment Report`, 40, 50);
        doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text(
          `Candidate: ${candidateName} ${candidateEmail ? `(${candidateEmail})` : ''}  •  Track: ${session.difficulty} Level  •  Target: ${targetRole}`,
          40,
          74
        );
        doc.fillColor('#64748B').fontSize(8).text(
          `Date: ${new Date(report.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  •  Session ID: ${session._id.toString()}`,
          40,
          88
        );

        // Reset Cursor below header
        doc.y = 120;

        // Overall Score Card & Performance Verdict
        const scoreBoxY = 120;
        doc.roundedRect(40, scoreBoxY, 240, 95, 8).fillAndStroke('#1E293B', '#334155');

        doc.fillColor('#94A3B8').fontSize(9).font('Helvetica-Bold').text('OVERALL SCORE', 55, scoreBoxY + 14);
        doc.fillColor(tierColor).fontSize(34).font('Helvetica-Bold').text(`${report.overallScore}`, 55, scoreBoxY + 30, { continued: true });
        doc.fillColor('#94A3B8').fontSize(14).text('/100');

        doc.roundedRect(55, scoreBoxY + 70, 110, 16, 4).fill(tierColor);
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text(report.performanceTier.toUpperCase(), 55, scoreBoxY + 74, { width: 110, align: 'center' });

        // Meta Info Card
        doc.roundedRect(290, scoreBoxY, 265, 95, 8).fillAndStroke('#1E293B', '#334155');
        doc.fillColor('#94A3B8').fontSize(9).font('Helvetica-Bold').text('ASSESSMENT PARAMETERS', 305, scoreBoxY + 14);

        doc.fillColor('#CBD5E1').fontSize(8.5).font('Helvetica');
        doc.text(`• Domain: ${session.domain}`, 305, scoreBoxY + 32);
        doc.text(`• Difficulty Tier: ${session.difficulty}`, 305, scoreBoxY + 46);
        doc.text(`• Interview Mode: ${session.format} (Voice / Code)`, 305, scoreBoxY + 60);
        doc.text(`• Questions Evaluated: ${report.questionDetails?.length || session.questions?.length || 0}`, 305, scoreBoxY + 74);

        // Competency Breakdown Table
        doc.y = 230;
        doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text('5-Dimensional Competency Breakdown', 40, doc.y);
        doc.y += 8;

        const metricsData = [
          { label: 'Technical Accuracy & Depth', score: report.metrics?.technicalAccuracy || 0, weight: '30%' },
          { label: 'System Design & Problem Solving', score: report.metrics?.problemSolving || 0, weight: '25%' },
          { label: 'Communication Clarity & Structure', score: report.metrics?.communicationClarity || 0, weight: '20%' },
          { label: 'Delivery, Tone & Executive Presence', score: report.metrics?.confidenceAndDelivery || 0, weight: '15%' },
          { label: 'Code Efficiency & Implementation', score: report.metrics?.codeQualityAndEfficiency || 0, weight: '10%' },
        ];

        let tableY = doc.y + 6;
        metricsData.forEach((m, idx) => {
          const rowY = tableY + idx * 24;
          doc.rect(40, rowY, 515, 22).fill(idx % 2 === 0 ? '#1E293B' : '#0F172A');
          
          doc.fillColor('#F8FAFC').fontSize(8.5).font('Helvetica').text(m.label, 50, rowY + 6);
          doc.fillColor('#94A3B8').fontSize(8).text(`Weight: ${m.weight}`, 330, rowY + 6);

          // Mini progress bar
          const barWidth = 100;
          const fillWidth = (m.score / 100) * barWidth;
          doc.roundedRect(400, rowY + 7, barWidth, 8, 3).fill('#334155');
          doc.roundedRect(400, rowY + 7, Math.max(fillWidth, 4), 8, 3).fill(m.score >= 80 ? '#10B981' : m.score >= 65 ? '#6366F1' : '#F59E0B');

          doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold').text(`${m.score}%`, 510, rowY + 6, { width: 40, align: 'right' });
        });

        // Executive Summary Box
        doc.y = tableY + metricsData.length * 24 + 18;
        doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text('Executive Summary & Hiring Consensus', 40, doc.y);
        doc.y += 8;

        const execY = doc.y;
        const summaryText = report.executiveSummary || 'Candidate completed the assessment session successfully demonstrating core technical competency.';
        
        doc.roundedRect(40, execY, 515, 70, 8).fillAndStroke('#0F172A', '#334155');
        doc.fillColor('#CBD5E1').fontSize(8.5).font('Helvetica').text(summaryText, 52, execY + 12, {
          width: 490,
          lineGap: 3,
        });

        // Strengths & Gaps (2 columns)
        doc.y = execY + 84;
        const sgY = doc.y;

        // Strengths (Left)
        doc.roundedRect(40, sgY, 250, 115, 8).fillAndStroke('#0F172A', '#10B981');
        doc.fillColor('#10B981').fontSize(9.5).font('Helvetica-Bold').text('KEY DEMONSTRATED STRENGTHS', 52, sgY + 12);
        let strY = sgY + 28;
        (report.topStrengths || ['Strong conceptual foundations', 'Crisp communication', 'Good problem decomposition']).slice(0, 3).forEach((s) => {
          doc.fillColor('#34D399').fontSize(8).text('✓', 52, strY);
          doc.fillColor('#E2E8F0').fontSize(8).font('Helvetica').text(s, 64, strY, { width: 215, lineGap: 2 });
          strY += 26;
        });

        // Critical Gaps (Right)
        doc.roundedRect(305, sgY, 250, 115, 8).fillAndStroke('#0F172A', '#F59E0B');
        doc.fillColor('#F59E0B').fontSize(9.5).font('Helvetica-Bold').text('HIGH-PRIORITY GROWTH AREAS', 317, sgY + 12);
        let gapY = sgY + 28;
        (report.criticalGaps || ['Deepen trade-off analysis', 'Strengthen edge case testing', 'Pacing and concise delivery']).slice(0, 3).forEach((g) => {
          doc.fillColor('#FBBF24').fontSize(8).text('!', 317, gapY);
          doc.fillColor('#E2E8F0').fontSize(8).font('Helvetica').text(g, 329, gapY, { width: 215, lineGap: 2 });
          gapY += 26;
        });

        // ==========================================
        // PAGE 2+: QUESTION-BY-QUESTION EVALUATION
        // ==========================================
        if (report.questionDetails && report.questionDetails.length > 0) {
          doc.addPage();

          // Header
          doc.rect(0, 0, doc.page.width, 50).fill('#0F172A');
          doc.fillColor('#818CF8').fontSize(12).font('Helvetica-Bold').text('ELEVATE', 40, 18, { continued: true });
          doc.fillColor('#10B981').text('.AI', { continued: true });
          doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('  |  Detailed Per-Question AI Evaluation', { align: 'left' });

          doc.y = 65;

          report.questionDetails.forEach((q, qIdx) => {
            // Check remaining page space
            if (doc.y > 650) {
              doc.addPage();
              doc.rect(0, 0, doc.page.width, 50).fill('#0F172A');
              doc.fillColor('#818CF8').fontSize(12).font('Helvetica-Bold').text('ELEVATE', 40, 18, { continued: true });
              doc.fillColor('#10B981').text('.AI', { continued: true });
              doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('  |  Detailed Per-Question AI Evaluation (Cont.)', { align: 'left' });
              doc.y = 65;
            }

            const cardStartY = doc.y;
            doc.fillColor('#FFFFFF').fontSize(10.5).font('Helvetica-Bold').text(`Question ${q.questionIndex + 1}: ${q.category || 'Architecture'}`, 40, cardStartY);
            doc.fillColor('#38BDF8').fontSize(8.5).font('Helvetica-Bold').text(`Score: ${q.score}/100`, 480, cardStartY, { align: 'right' });

            doc.y += 4;
            // Question Prompt Box
            const promptY = doc.y;
            doc.roundedRect(40, promptY, 515, 34, 6).fillAndStroke('#1E293B', '#334155');
            doc.fillColor('#E2E8F0').fontSize(8).font('Helvetica-Oblique').text(`"${q.questionText}"`, 50, promptY + 8, { width: 495 });

            doc.y = promptY + 40;

            // Model Critique & Key Points
            if (q.constructiveCritique) {
              doc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica-Bold').text('AI EVALUATOR CRITIQUE:', 40, doc.y);
              doc.y += 2;
              doc.fillColor('#CBD5E1').fontSize(8).font('Helvetica').text(q.constructiveCritique, 40, doc.y, { width: 515, lineGap: 2 });
              doc.y += 8;
            }

            // Covered vs Missed bullet points
            const pointsY = doc.y;
            if (q.keyPointsCovered?.length) {
              doc.fillColor('#10B981').fontSize(7.5).font('Helvetica-Bold').text('Points Covered: ', 40, pointsY, { continued: true });
              doc.fillColor('#CBD5E1').fontSize(7.5).font('Helvetica').text(q.keyPointsCovered.join(' • '));
            }
            if (q.keyPointsMissed?.length) {
              doc.fillColor('#F59E0B').fontSize(7.5).font('Helvetica-Bold').text('Points Missed: ', 40, doc.y, { continued: true });
              doc.fillColor('#CBD5E1').fontSize(7.5).font('Helvetica').text(q.keyPointsMissed.join(' • '));
            }

            doc.y += 14;
            doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#334155').stroke();
            doc.y += 12;
          });
        }

        // ==========================================
        // ACTIONABLE ROADMAP SECTION
        // ==========================================
        if (report.actionableRoadmap && report.actionableRoadmap.length > 0) {
          if (doc.y > 580) {
            doc.addPage();
            doc.rect(0, 0, doc.page.width, 50).fill('#0F172A');
            doc.fillColor('#818CF8').fontSize(12).font('Helvetica-Bold').text('ELEVATE', 40, 18, { continued: true });
            doc.fillColor('#10B981').text('.AI', { continued: true });
            doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('  |  Personalized Action Roadmap', { align: 'left' });
            doc.y = 65;
          }

          doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text('Tailored Growth Roadmap', 40, doc.y);
          doc.y += 8;

          report.actionableRoadmap.forEach((plan) => {
            const planY = doc.y;
            doc.roundedRect(40, planY, 515, 42, 6).fillAndStroke('#0F172A', '#4F46E5');
            doc.fillColor('#818CF8').fontSize(8.5).font('Helvetica-Bold').text(`Week ${plan.week}: ${plan.topic}`, 50, planY + 8);
            doc.fillColor('#E2E8F0').fontSize(8).font('Helvetica').text(plan.recommendedAction, 50, planY + 22, { width: 495 });
            doc.y = planY + 48;
          });
        }

        // ==========================================
        // FOOTER ON ALL PAGES
        // ==========================================
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          doc.rect(0, doc.page.height - 30, doc.page.width, 30).fill('#0B0F19');
          doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text(
            `ELEVATE.AI Enterprise Platform  •  Confidential Candidate Assessment  •  Page ${i + 1} of ${range.count}`,
            40,
            doc.page.height - 20,
            { align: 'center', width: doc.page.width - 80 }
          );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
