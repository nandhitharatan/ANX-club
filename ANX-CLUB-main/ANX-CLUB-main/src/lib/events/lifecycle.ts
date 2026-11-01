import { Event } from "@/types";

export type EventLifecycleStatus = 'Draft' | 'Published' | 'Cancelled' | 'Deleted';

export type LifecycleAction = 'publish' | 'unpublish' | 'cancel' | 'delete';

/**
 * Normalizes any database event object to one of 4 canonical lifecycle statuses:
 * - 'Deleted': isActive is false, or status is explicitly 'Deleted'
 * - 'Cancelled': status is 'Cancelled'
 * - 'Published': status is 'Published' or legacy 'Approved', and isActive is not false
 * - 'Draft': status is 'Draft', 'Unpublished', 'Pending', or undefined
 */
export function getNormalizedLifecycleStatus(event: Partial<Event> | any): EventLifecycleStatus {
  if (!event) return 'Deleted';

  // Check deleted / archived state
  if (event.isActive === false || event.status === 'Deleted' || event.deletedAt) {
    return 'Deleted';
  }

  // Check cancelled state
  const rawStatus = (event.status || '').toString().toLowerCase().trim();
  if (rawStatus === 'cancelled' || event.cancelledAt) {
    return 'Cancelled';
  }

  // Check published state (including legacy 'Approved')
  if (
    rawStatus === 'published' ||
    rawStatus === 'approved' ||
    (event.isPublished === true && rawStatus !== 'draft' && rawStatus !== 'unpublished')
  ) {
    return 'Published';
  }

  // Default to Draft / Unpublished
  return 'Draft';
}

/**
 * Validates whether an event meets all required fields before it can be published.
 * Incomplete or invalid events are prevented from being published.
 */
export function validatePublishableEvent(event: Partial<Event> | any): {
  valid: boolean;
  missingFields: string[];
  message?: string;
} {
  const missingFields: string[] = [];

  if (!event) {
    return { valid: false, missingFields: ['event'], message: 'Event data is missing.' };
  }

  if (!event.title || typeof event.title !== 'string' || !event.title.trim()) {
    missingFields.push('title');
  }

  if (!event.description || typeof event.description !== 'string' || !event.description.trim()) {
    missingFields.push('description');
  }

  if (!event.date || typeof event.date !== 'string' || !event.date.trim()) {
    missingFields.push('date');
  }

  if (!event.time || typeof event.time !== 'string' || !event.time.trim()) {
    missingFields.push('time');
  }

  // Validate venue vs online link
  const isOnline = Boolean(event.isOnline);
  if (isOnline) {
    const hasLink = event.meetingLink?.trim() || event.onlineLink?.trim();
    if (!hasLink) {
      missingFields.push('meetingLink');
    }
  } else {
    const hasVenue = event.venue?.trim();
    if (!hasVenue) {
      missingFields.push('venue');
    }
  }

  // If external registration, must have valid externalRegistrationUrl
  if (event.registrationType === 'external') {
    const extUrl = event.externalRegistrationUrl?.trim();
    if (!extUrl || (!extUrl.startsWith('http://') && !extUrl.startsWith('https://'))) {
      missingFields.push('externalRegistrationUrl');
    }
  }

  if (missingFields.length > 0) {
    return {
      valid: false,
      missingFields,
      message: `Cannot publish event: missing required fields: ${missingFields.join(', ')}.`,
    };
  }

  return { valid: true, missingFields: [] };
}

/**
 * State machine validation for event lifecycle transitions.
 * Ensures only valid lifecycle transitions occur.
 */
export function validateLifecycleTransition(
  currentStatus: EventLifecycleStatus,
  action: LifecycleAction,
  payload?: { reason?: string }
): { valid: boolean; error?: string } {
  switch (action) {
    case 'publish':
      if (currentStatus === 'Published') {
        return { valid: false, error: 'Event is already published.' };
      }
      if (currentStatus === 'Cancelled') {
        return { valid: false, error: 'Cannot publish a cancelled event. Create a new event instead.' };
      }
      if (currentStatus === 'Deleted') {
        return { valid: false, error: 'Cannot publish a deleted or archived event.' };
      }
      if (currentStatus === 'Draft') {
        return { valid: true };
      }
      return { valid: false, error: `Invalid transition from ${currentStatus} to Published.` };

    case 'unpublish':
      if (currentStatus === 'Draft') {
        return { valid: false, error: 'Event is already in Draft / Unpublished status.' };
      }
      if (currentStatus === 'Cancelled') {
        return { valid: false, error: 'Cannot unpublish a cancelled event.' };
      }
      if (currentStatus === 'Deleted') {
        return { valid: false, error: 'Cannot unpublish a deleted or archived event.' };
      }
      if (currentStatus === 'Published') {
        return { valid: true };
      }
      return { valid: false, error: `Invalid transition from ${currentStatus} to Draft.` };

    case 'cancel':
      if (currentStatus === 'Cancelled') {
        return { valid: false, error: 'Event is already cancelled.' };
      }
      if (currentStatus === 'Deleted') {
        return { valid: false, error: 'Cannot cancel a deleted or archived event.' };
      }
      if (currentStatus === 'Draft') {
        return { valid: false, error: 'Draft events cannot be cancelled because they have never been published. Edit or delete the draft instead.' };
      }
      if (currentStatus === 'Published') {
        const reason = payload?.reason?.trim();
        if (!reason || reason.length < 3) {
          return { valid: false, error: 'A cancellation reason (at least 3 characters) is required to cancel an event.' };
        }
        return { valid: true };
      }
      return { valid: false, error: `Invalid transition from ${currentStatus} to Cancelled.` };

    case 'delete':
      if (currentStatus === 'Deleted') {
        return { valid: false, error: 'Event is already deleted or archived.' };
      }
      // Draft, Published, and Cancelled can all be safely soft-deleted/archived
      return { valid: true };

    default:
      return { valid: false, error: `Unknown lifecycle action: ${action}` };
  }
}
