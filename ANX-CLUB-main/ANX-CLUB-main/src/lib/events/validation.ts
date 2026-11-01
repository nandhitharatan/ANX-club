/**
 * Validation utilities for ANX Club Event Management.
 * Enforces server-side validation, field protection, and state invariants.
 */

export const PROTECTED_EVENT_FIELDS = [
  "id",
  "_id",
  "createdAt",
  "createdBy",
  "createdByRole",
  "seatsBooked",
  "registeredCount",
  "status",
  "isPublished",
  "isActive",
  "cancelledAt",
  "cancelledBy",
  "cancellationReason",
  "publishedAt",
  "unpublishedAt",
  "deletedAt",
  "deletedBy",
] as const;

/**
 * Validates whether a given string is a valid HTTP or HTTPS URL.
 */
export function isValidHttpUrl(urlString: any): boolean {
  if (typeof urlString !== "string" || !urlString.trim()) return false;
  const trimmed = urlString.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export interface EventUpdateValidationResult {
  valid: boolean;
  error?: string;
  sanitizedUpdates?: Record<string, any>;
}

/**
 * Validates and sanitizes payload for updating an existing event via PUT /api/v1/events/:id.
 * 
 * Enforces:
 * 1. Title and description presence and non-emptiness.
 * 2. Valid date structures and deadline constraints (registration deadline <= event date).
 * 3. URL validity for external links, posters, meeting links, and avatars.
 * 4. Capacity and price bounds (capacity > 0, price >= 0).
 * 5. Invariant maintenance for seatsAvailable = Math.max(0, capacity - seatsBooked).
 * 6. Protection of immutables (createdAt, createdBy, seatsBooked, status, isPublished).
 */
export function validateEventUpdatePayload(
  body: any,
  existingData: Record<string, any>
): EventUpdateValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { valid: false, error: "Invalid request payload. Expected JSON object." };
  }

  // 1. Cannot update an event that is deleted or archived
  if (existingData.isActive === false || existingData.status === "Deleted") {
    return { valid: false, error: "Cannot edit a deleted or archived event." };
  }

  const updates: Record<string, any> = {};

  // 2. Title validation
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return { valid: false, error: "Event title is required and cannot be empty." };
    }
    updates.title = body.title.trim();
  } else if (!existingData.title) {
    return { valid: false, error: "Event title is required." };
  }

  // 3. Description validation
  if (body.description !== undefined) {
    if (typeof body.description !== "string" || !body.description.trim()) {
      return { valid: false, error: "Event description is required and cannot be empty." };
    }
    updates.description = body.description.trim();
  } else if (!existingData.description) {
    return { valid: false, error: "Event description is required." };
  }

  // 4. Date validation
  if (body.date !== undefined) {
    if (typeof body.date !== "string" || !body.date.trim()) {
      return { valid: false, error: "Event date is required and cannot be empty." };
    }
    const d = new Date(body.date.trim());
    if (isNaN(d.getTime())) {
      return { valid: false, error: "Invalid event date format." };
    }
    updates.date = body.date.trim();
  }

  const effectiveDateStr = updates.date || existingData.date;
  const effectiveDate = effectiveDateStr ? new Date(effectiveDateStr) : null;

  // 5. End Date validation
  if (body.endDate !== undefined && body.endDate !== null && body.endDate !== "") {
    if (typeof body.endDate !== "string" || !body.endDate.trim()) {
      return { valid: false, error: "Invalid event end date format." };
    }
    const ed = new Date(body.endDate.trim());
    if (isNaN(ed.getTime())) {
      return { valid: false, error: "Invalid event end date format." };
    }
    if (effectiveDate && !isNaN(effectiveDate.getTime()) && ed.getTime() < effectiveDate.getTime()) {
      return { valid: false, error: "Event end date cannot be scheduled before the event start date." };
    }
    updates.endDate = body.endDate.trim();
  } else if (body.endDate === null || body.endDate === "") {
    updates.endDate = null;
  }

  // 6. Registration Deadline validation
  if (body.registrationDeadline !== undefined && body.registrationDeadline !== null && body.registrationDeadline !== "") {
    if (typeof body.registrationDeadline !== "string" || !body.registrationDeadline.trim()) {
      return { valid: false, error: "Invalid registration deadline format." };
    }
    const rd = new Date(body.registrationDeadline.trim());
    if (isNaN(rd.getTime())) {
      return { valid: false, error: "Invalid registration deadline format." };
    }
    if (effectiveDate && !isNaN(effectiveDate.getTime()) && rd.getTime() > effectiveDate.getTime()) {
      return { valid: false, error: "Registration deadline cannot be scheduled after the event date." };
    }
    updates.registrationDeadline = body.registrationDeadline.trim();
  } else if (body.registrationDeadline === null || body.registrationDeadline === "") {
    updates.registrationDeadline = null;
  }

  // 7. Registration Type & External URL validation
  const effectiveRegType = body.registrationType !== undefined
    ? body.registrationType
    : (existingData.registrationType || "internal");

  if (body.registrationType !== undefined) {
    if (body.registrationType !== "internal" && body.registrationType !== "external") {
      return { valid: false, error: "Registration type must be either 'internal' or 'external'." };
    }
    updates.registrationType = body.registrationType;
  }

  if (effectiveRegType === "external") {
    const extUrl = body.externalRegistrationUrl !== undefined
      ? body.externalRegistrationUrl
      : existingData.externalRegistrationUrl;

    if (!extUrl || typeof extUrl !== "string" || !isValidHttpUrl(extUrl)) {
      return {
        valid: false,
        error: "External registration link must be a valid URL starting with http:// or https://",
      };
    }
    if (body.externalRegistrationUrl !== undefined) {
      updates.externalRegistrationUrl = body.externalRegistrationUrl.trim();
    }
  } else {
    if (body.externalRegistrationUrl !== undefined) {
      if (body.externalRegistrationUrl && !isValidHttpUrl(body.externalRegistrationUrl)) {
        return {
          valid: false,
          error: "External registration link must be a valid URL starting with http:// or https://",
        };
      }
      updates.externalRegistrationUrl = body.externalRegistrationUrl?.trim() || null;
    }
  }

  // 8. Event Format & Online/Physical Venue validation
  const effectiveIsOnline = body.isOnline !== undefined
    ? Boolean(body.isOnline)
    : (existingData.isOnline !== undefined
      ? Boolean(existingData.isOnline)
      : (existingData.venue ? existingData.venue.toLowerCase().includes("online") : false));

  if (body.isOnline !== undefined) {
    updates.isOnline = Boolean(body.isOnline);
  }

  if (body.format !== undefined) {
    const fmt = String(body.format).toLowerCase().trim();
    if (!["online", "offline", "hybrid", "in-person"].includes(fmt)) {
      return { valid: false, error: "Invalid event format. Supported formats: 'online', 'offline', 'hybrid'." };
    }
    updates.format = fmt;
  }

  if (effectiveIsOnline) {
    if (body.meetingLink !== undefined) {
      if (body.meetingLink && !isValidHttpUrl(body.meetingLink)) {
        return { valid: false, error: "Meeting link must be a valid URL starting with http:// or https://" };
      }
      updates.meetingLink = body.meetingLink ? body.meetingLink.trim() : "";
    }
    if (body.onlineLink !== undefined) {
      if (body.onlineLink && !isValidHttpUrl(body.onlineLink)) {
        return { valid: false, error: "Online meeting link must be a valid URL starting with http:// or https://" };
      }
      updates.onlineLink = body.onlineLink ? body.onlineLink.trim() : "";
    }
  } else {
    // Physical event requires venue
    if (body.venue !== undefined) {
      if (typeof body.venue !== "string" || !body.venue.trim()) {
        return { valid: false, error: "Physical events require a valid venue location." };
      }
      updates.venue = body.venue.trim();
    } else if (!existingData.venue || !existingData.venue.trim()) {
      return { valid: false, error: "Physical events require a valid venue location." };
    }
  }

  // 9. Poster & Speaker image URLs
  if (body.posterUrl !== undefined && body.posterUrl !== null && body.posterUrl.trim() !== "") {
    if (!isValidHttpUrl(body.posterUrl)) {
      return { valid: false, error: "Poster URL must be a valid URL starting with http:// or https://" };
    }
    updates.posterUrl = body.posterUrl.trim();
  } else if (body.posterUrl === null || body.posterUrl === "") {
    updates.posterUrl = "";
  }

  if (body.speakerImage !== undefined && body.speakerImage !== null && body.speakerImage.trim() !== "") {
    if (!isValidHttpUrl(body.speakerImage)) {
      return { valid: false, error: "Speaker image URL must be a valid URL starting with http:// or https://" };
    }
    updates.speakerImage = body.speakerImage.trim();
  } else if (body.speakerImage === null || body.speakerImage === "") {
    updates.speakerImage = "";
  }

  // 10. Pricing validation
  if (body.price !== undefined) {
    const p = Number(body.price);
    if (isNaN(p) || p < 0) {
      return { valid: false, error: "Event price must be a non-negative number." };
    }
    updates.price = p;
  }

  if (body.premiumPrice !== undefined) {
    const pp = Number(body.premiumPrice);
    if (isNaN(pp) || pp < 0) {
      return { valid: false, error: "Premium price must be a non-negative number." };
    }
    updates.premiumPrice = pp;
  }

  if (body.premiumOnly !== undefined) {
    updates.premiumOnly = Boolean(body.premiumOnly);
  }

  // 11. Capacity & Seats Invariant Maintenance
  // Authoritative booked count is stored on existing document
  const currentSeatsBooked = Math.max(
    0,
    Number(existingData.seatsBooked ?? existingData.registeredCount ?? 0)
  );

  if (effectiveRegType === "internal") {
    if (body.capacity !== undefined) {
      const cap = Number(body.capacity);
      if (isNaN(cap) || cap <= 0 || !Number.isInteger(cap)) {
        return { valid: false, error: "Event capacity must be a positive integer." };
      }
      if (cap < currentSeatsBooked) {
        return {
          valid: false,
          error: `Cannot reduce capacity to ${cap}. It cannot be less than currently booked seats (${currentSeatsBooked}).`,
        };
      }
      updates.capacity = cap;
      updates.seatsAvailable = Math.max(0, cap - currentSeatsBooked);
    } else if (existingData.capacity !== undefined) {
      // Maintain invariant with existing capacity
      const existingCap = Number(existingData.capacity);
      updates.seatsAvailable = Math.max(0, existingCap - currentSeatsBooked);
    }
  } else {
    // External event: capacity is unmanaged or informational
    if (body.capacity !== undefined) {
      const cap = Number(body.capacity);
      if (isNaN(cap) || cap < 0) {
        return { valid: false, error: "Capacity for external events cannot be negative." };
      }
      updates.capacity = cap;
    }
  }

  // 12. Duration & Schedule
  if (body.duration !== undefined) {
    const dur = Number(body.duration);
    if (isNaN(dur) || dur <= 0) {
      return { valid: false, error: "Event duration must be a positive number of minutes." };
    }
    updates.duration = dur;
  }

  if (body.time !== undefined) {
    updates.time = typeof body.time === "string" ? body.time.trim() : String(body.time);
  }

  // 13. Agenda validation
  if (body.agenda !== undefined) {
    if (!Array.isArray(body.agenda)) {
      return { valid: false, error: "Agenda must be an array of schedule items." };
    }
    updates.agenda = body.agenda
      .filter((item: any) => typeof item === "string" && item.trim().length > 0)
      .map((item: string) => item.trim());
  }

  // 14. Speaker details
  if (body.speaker !== undefined) updates.speaker = typeof body.speaker === "string" ? body.speaker.trim() : "";
  if (body.speakerName !== undefined) updates.speakerName = typeof body.speakerName === "string" ? body.speakerName.trim() : "";
  if (body.speakerRole !== undefined) updates.speakerRole = typeof body.speakerRole === "string" ? body.speakerRole.trim() : "";
  if (body.speakerCompany !== undefined) updates.speakerCompany = typeof body.speakerCompany === "string" ? body.speakerCompany.trim() : "";
  if (body.speakerBio !== undefined) updates.speakerBio = typeof body.speakerBio === "string" ? body.speakerBio.trim() : "";

  // 15. Meeting platform and access
  if (body.meetingPlatform !== undefined) updates.meetingPlatform = typeof body.meetingPlatform === "string" ? body.meetingPlatform.trim() : "";
  if (body.meetingId !== undefined) updates.meetingId = typeof body.meetingId === "string" ? body.meetingId.trim() : "";
  if (body.meetingPasscode !== undefined) updates.meetingPasscode = typeof body.meetingPasscode === "string" ? body.meetingPasscode.trim() : "";
  if (body.meetingInstructions !== undefined) updates.meetingInstructions = typeof body.meetingInstructions === "string" ? body.meetingInstructions.trim() : "";
  if (body.address !== undefined) updates.address = typeof body.address === "string" ? body.address.trim() : "";

  // 16. Categorization & College
  if (body.category !== undefined) updates.category = typeof body.category === "string" ? body.category.trim() : "";
  if (body.eventType !== undefined) updates.eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
  if (body.collegeId !== undefined) updates.collegeId = body.collegeId ? String(body.collegeId).trim() : null;
  if (body.collegeName !== undefined) updates.collegeName = body.collegeName ? String(body.collegeName).trim() : "All Campuses";

  // 17. Ensure NO protected fields leaked into updates
  for (const protectedField of PROTECTED_EVENT_FIELDS) {
    delete (updates as any)[protectedField];
  }

  return {
    valid: true,
    sanitizedUpdates: updates,
  };
}
