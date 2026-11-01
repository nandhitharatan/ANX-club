import {
  getNormalizedLifecycleStatus,
  validatePublishableEvent,
  validateLifecycleTransition,
} from '@/lib/events/lifecycle';
import { handleLifecycleUpdate } from '@/lib/events/lifecycle-server';
import { POST as registerHandler } from '@/app/api/v1/events/[id]/register/route';
import { DELETE as deleteHandler } from '@/app/api/v1/events/[id]/route';
import * as adminAuthUtil from '@/lib/firebase/admin-auth';

// Mock Firebase Admin modules
jest.mock('@/lib/firebase/admin', () => {
  const mockUpdate = jest.fn();
  const mockSet = jest.fn();
  const mockGet = jest.fn();
  const mockAdd = jest.fn();
  const mockDoc = jest.fn(() => ({
    get: mockGet,
    update: mockUpdate,
    set: mockSet,
    id: 'mock-doc-id',
  }));

  return {
    adminDb: {
      collection: jest.fn(() => ({
        doc: mockDoc,
        get: jest.fn(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        add: mockAdd,
      })),
      runTransaction: jest.fn(async (cb) => {
        return cb({
          get: mockGet,
          update: mockUpdate,
          set: mockSet,
        });
      }),
    },
    adminAuth: {
      verifyIdToken: jest.fn(),
    },
  };
});

jest.mock('@/lib/firebase/admin-auth', () => ({
  verifyAuthToken: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authenticate: jest.fn(),
}));

import { adminDb } from '@/lib/firebase/admin';
import { authenticate } from '@/lib/auth';

describe('Admin Event Lifecycle Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Lifecycle State Machine Logic', () => {
    it('normalizes legacy approved events to Published', () => {
      const event = { id: 'evt-1', status: 'Approved', isActive: true };
      expect(getNormalizedLifecycleStatus(event)).toBe('Published');
    });

    it('normalizes draft and unpublished events to Draft', () => {
      expect(getNormalizedLifecycleStatus({ status: 'Draft' })).toBe('Draft');
      expect(getNormalizedLifecycleStatus({ status: 'Unpublished' })).toBe('Draft');
      expect(getNormalizedLifecycleStatus({ isPublished: false })).toBe('Draft');
    });

    it('normalizes cancelled events to Cancelled', () => {
      expect(getNormalizedLifecycleStatus({ status: 'Cancelled' })).toBe('Cancelled');
      expect(getNormalizedLifecycleStatus({ cancelledAt: '2026-10-31T00:00:00Z' })).toBe('Cancelled');
    });

    it('normalizes inactive or explicitly deleted events to Deleted', () => {
      expect(getNormalizedLifecycleStatus({ isActive: false })).toBe('Deleted');
      expect(getNormalizedLifecycleStatus({ status: 'Deleted' })).toBe('Deleted');
    });

    it('validates required fields before an event can be published', () => {
      const incomplete = {
        title: 'Tech Talk',
        // missing description, date, time, venue
      };
      const check1 = validatePublishableEvent(incomplete);
      expect(check1.valid).toBe(false);
      expect(check1.missingFields).toContain('description');
      expect(check1.missingFields).toContain('date');
      expect(check1.missingFields).toContain('time');

      const completePhysical = {
        title: 'Hands-on AI Lab',
        description: 'Comprehensive deep dive into LLM tooling',
        date: '2026-11-15',
        time: '10:00 AM',
        isOnline: false,
        venue: 'Auditorium A',
      };
      const check2 = validatePublishableEvent(completePhysical);
      expect(check2.valid).toBe(true);
      expect(check2.missingFields).toHaveLength(0);

      const invalidVirtual = {
        ...completePhysical,
        isOnline: true,
        venue: undefined,
        meetingLink: undefined,
      };
      const check3 = validatePublishableEvent(invalidVirtual);
      expect(check3.valid).toBe(false);
      expect(check3.missingFields).toContain('meetingLink');
    });

    it('enforces lifecycle transition rules correctly', () => {
      // Publish
      expect(validateLifecycleTransition('Draft', 'publish').valid).toBe(true);
      expect(validateLifecycleTransition('Published', 'publish').valid).toBe(false);
      expect(validateLifecycleTransition('Cancelled', 'publish').valid).toBe(false);
      expect(validateLifecycleTransition('Deleted', 'publish').valid).toBe(false);

      // Unpublish
      expect(validateLifecycleTransition('Published', 'unpublish').valid).toBe(true);
      expect(validateLifecycleTransition('Draft', 'unpublish').valid).toBe(false);
      expect(validateLifecycleTransition('Cancelled', 'unpublish').valid).toBe(false);

      // Cancel: requires reason
      expect(validateLifecycleTransition('Published', 'cancel', { reason: 'Speaker ill' }).valid).toBe(true);
      expect(validateLifecycleTransition('Published', 'cancel', { reason: '' }).valid).toBe(false);
      expect(validateLifecycleTransition('Draft', 'cancel', { reason: 'Some reason' }).valid).toBe(false);
      expect(validateLifecycleTransition('Cancelled', 'cancel', { reason: 'Some reason' }).valid).toBe(false);

      // Delete: soft deletion allowed from draft, published, cancelled
      expect(validateLifecycleTransition('Draft', 'delete').valid).toBe(true);
      expect(validateLifecycleTransition('Published', 'delete').valid).toBe(true);
      expect(validateLifecycleTransition('Cancelled', 'delete').valid).toBe(true);
      expect(validateLifecycleTransition('Deleted', 'delete').valid).toBe(false);
    });
  });

  describe('2. Authorization & Security Checks', () => {
    it('rejects unauthenticated requests with HTTP 401', async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(null);
      (authenticate as jest.Mock).mockResolvedValueOnce(null);

      const req = new Request('http://localhost/api/v1/events/evt-1/lifecycle', {
        method: 'POST',
        body: JSON.stringify({ action: 'publish' }),
      });

      const res = await handleLifecycleUpdate(req, 'evt-1');
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain('Unauthorized');
    });

    it('rejects non-admin requests with HTTP 403', async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce({
        uid: 'student_123',
        email: 'student@anxclub.dev',
        role: 'Member',
      });

      const req = new Request('http://localhost/api/v1/events/evt-1/lifecycle', {
        method: 'POST',
        body: JSON.stringify({ action: 'publish' }),
      });

      const res = await handleLifecycleUpdate(req, 'evt-1');
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain('Forbidden');
    });
  });

  describe('3. Lifecycle Transitions API Handler', () => {
    const adminUser = {
      uid: 'admin_core_1',
      email: 'admin@algorithmaliens.com',
      role: 'Admin',
    };

    it('returns HTTP 503 when Firestore database is unavailable', async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(adminUser);

      const mockDoc = {
        get: jest.fn().mockRejectedValueOnce(new Error('DATA_ACCESS_MODE_DISABLED: Native mode is disabled')),
      };
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const req = new Request('http://localhost/api/v1/events/evt-1/lifecycle', {
        method: 'POST',
        body: JSON.stringify({ action: 'publish' }),
      });

      const res = await handleLifecycleUpdate(req, 'evt-1');
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain('Database service unavailable');
    });

    it('returns HTTP 404 when target event does not exist in Firestore', async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(adminUser);

      const mockDoc = {
        get: jest.fn().mockResolvedValueOnce({ exists: false }),
      };
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const req = new Request('http://localhost/api/v1/events/non-existent/lifecycle', {
        method: 'POST',
        body: JSON.stringify({ action: 'publish' }),
      });

      const res = await handleLifecycleUpdate(req, 'non-existent');
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.message).toContain('Event not found');
    });

    it('successfully publishes a complete draft event', async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(adminUser);

      const mockUpdate = jest.fn().mockResolvedValueOnce(true);
      const mockDoc = {
        get: jest.fn().mockResolvedValueOnce({
          exists: true,
          data: () => ({
            title: 'Full-Stack Bootcamp',
            description: 'Hands on next.js development',
            date: '2026-11-20',
            time: '02:00 PM',
            isOnline: false,
            venue: 'Tech Hall 1',
            status: 'Draft',
            isPublished: false,
            isActive: true,
          }),
        }),
        update: mockUpdate,
      };

      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const req = new Request('http://localhost/api/v1/events/evt-draft/lifecycle', {
        method: 'POST',
        body: JSON.stringify({ action: 'publish' }),
      });

      const res = await handleLifecycleUpdate(req, 'evt-draft');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe('Published');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'Published',
          isPublished: true,
          isActive: true,
        })
      );
    });

    it('rejects publishing an incomplete draft event with HTTP 400', async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(adminUser);

      const mockDoc = {
        get: jest.fn().mockResolvedValueOnce({
          exists: true,
          data: () => ({
            title: 'Incomplete Event',
            status: 'Draft',
            isPublished: false,
            isActive: true,
            // missing description, date, time, venue
          }),
        }),
      };

      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const req = new Request('http://localhost/api/v1/events/evt-draft-2/lifecycle', {
        method: 'POST',
        body: JSON.stringify({ action: 'publish' }),
      });

      const res = await handleLifecycleUpdate(req, 'evt-draft-2');
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain('missing required fields');
    });

    it('successfully unpublishes a published event back to Draft', async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(adminUser);

      const mockUpdate = jest.fn().mockResolvedValueOnce(true);
      const mockDoc = {
        get: jest.fn().mockResolvedValueOnce({
          exists: true,
          data: () => ({
            title: 'Published AI Seminar',
            status: 'Published',
            isPublished: true,
            isActive: true,
          }),
        }),
        update: mockUpdate,
      };

      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const req = new Request('http://localhost/api/v1/events/evt-pub/lifecycle', {
        method: 'POST',
        body: JSON.stringify({ action: 'unpublish' }),
      });

      const res = await handleLifecycleUpdate(req, 'evt-pub');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe('Draft');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'Draft',
          isPublished: false,
        })
      );
    });

    it('cancels an event when an official reason is provided', async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(adminUser);

      const mockUpdate = jest.fn().mockResolvedValueOnce(true);
      const mockDoc = {
        get: jest.fn().mockResolvedValueOnce({
          exists: true,
          data: () => ({
            title: 'Cloud Summit',
            status: 'Published',
            isPublished: true,
            isActive: true,
          }),
        }),
        update: mockUpdate,
      };

      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const req = new Request('http://localhost/api/v1/events/evt-summit/lifecycle', {
        method: 'POST',
        body: JSON.stringify({
          action: 'cancel',
          reason: 'Lead keynote speaker had an emergency.',
        }),
      });

      const res = await handleLifecycleUpdate(req, 'evt-summit');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe('Cancelled');
      expect(json.cancellationReason).toBe('Lead keynote speaker had an emergency.');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'Cancelled',
          isPublished: false,
          cancellationReason: 'Lead keynote speaker had an emergency.',
        })
      );
    });

    it('rejects cancellation without reason with HTTP 400', async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(adminUser);

      const mockDoc = {
        get: jest.fn().mockResolvedValueOnce({
          exists: true,
          data: () => ({
            title: 'Cloud Summit',
            status: 'Published',
            isPublished: true,
            isActive: true,
          }),
        }),
      };

      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const req = new Request('http://localhost/api/v1/events/evt-summit/lifecycle', {
        method: 'POST',
        body: JSON.stringify({ action: 'cancel', reason: '   ' }),
      });

      const res = await handleLifecycleUpdate(req, 'evt-summit');
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain('cancellation reason');
    });

    it('safely soft-deletes and archives an event preserving registration history', async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(adminUser);

      const mockUpdate = jest.fn().mockResolvedValueOnce(true);
      const mockDoc = {
        get: jest.fn().mockResolvedValueOnce({
          exists: true,
          data: () => ({
            title: 'Legacy Hackathon',
            status: 'Published',
            isPublished: true,
            isActive: true,
          }),
        }),
        update: mockUpdate,
      };

      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const req: any = new Request('http://localhost/api/v1/events/evt-hack', {
        method: 'DELETE',
      });

      const res = await deleteHandler(req, { params: { id: 'evt-hack' } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toContain('archived');

      // Verifies soft deletion with isActive: false and status: 'Deleted'
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
          status: 'Deleted',
          isPublished: false,
        })
      );
    });
  });

  describe('4. Registration Lifecycle Blocking', () => {
    it('blocks registration for cancelled events with HTTP 400', async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce({
        uid: 'user_456',
        email: 'user456@example.com',
      });

      const mockDoc = {
        exists: true,
        id: 'evt-cancelled-1',
        data: () => ({
          title: 'Cancelled Workshop',
          status: 'Cancelled',
          cancellationReason: 'Instructor illness',
          isActive: true,
        }),
      };

      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValueOnce(mockDoc),
        }),
      });

      const req: any = new Request('http://localhost/api/v1/events/evt-cancelled-1/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'Rohit' }),
      });

      const res = await registerHandler(req, { params: { id: 'evt-cancelled-1' } });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain('cancelled');
    });

    it('blocks registration for draft/unpublished events with HTTP 400', async () => {
      (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce({
        uid: 'user_789',
        email: 'user789@example.com',
      });

      const mockDoc = {
        exists: true,
        id: 'evt-draft-1',
        data: () => ({
          title: 'Draft Unreleased Event',
          status: 'Draft',
          isPublished: false,
          isActive: true,
        }),
      };

      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValueOnce(mockDoc),
        }),
      });

      const req: any = new Request('http://localhost/api/v1/events/evt-draft-1/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'Priya' }),
      });

      const res = await registerHandler(req, { params: { id: 'evt-draft-1' } });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain('unpublished');
    });
  });
});
