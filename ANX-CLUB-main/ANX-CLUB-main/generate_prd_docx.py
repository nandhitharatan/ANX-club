import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_element(name):
    return OxmlElement(name)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def style_heading(p, text, level=1):
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.bold = True
    run.font.name = 'Calibri'
    if level == 1:
        run.font.size = Pt(18)
        run.font.color.rgb = RGBColor(24, 43, 73) # Deep Navy
    elif level == 2:
        run.font.size = Pt(14)
        run.font.color.rgb = RGBColor(147, 51, 234) # Purple/Indigo
    elif level == 3:
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(79, 70, 229)
    return run

def add_callout(doc, text, title="KEY ARCHITECTURAL PRINCIPLE"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "F3F4F6")
    set_cell_margins(cell, top=160, bottom=160, left=200, right=200)
    
    # Left border accent
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:left w:val="single" w:sz="24" w:space="0" w:color="7C3AED"/><w:top w:val="none"/><w:right w:val="none"/><w:bottom w:val="none"/></w:tcBorders>')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    r_title = p.add_run(f"[{title}]\n")
    r_title.bold = True
    r_title.font.name = 'Calibri'
    r_title.font.size = Pt(10)
    r_title.font.color.rgb = RGBColor(124, 58, 237)
    
    r_body = p.add_run(text)
    r_body.font.name = 'Calibri'
    r_body.font.size = Pt(10.5)
    r_body.font.color.rgb = RGBColor(55, 65, 81)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def format_table(tbl, col_widths, headers, data, header_bg="1E293B"):
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    # Header Row
    hdr_row = tbl.rows[0]
    for idx, heading in enumerate(headers):
        cell = hdr_row.cells[idx]
        set_cell_background(cell, header_bg)
        set_cell_margins(cell, top=140, bottom=140, left=140, right=140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(heading)
        run.bold = True
        run.font.name = 'Calibri'
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(255, 255, 255)
    
    # Data Rows
    for row_idx, row_data in enumerate(data):
        row = tbl.add_row()
        bg = "FFFFFF" if row_idx % 2 == 0 else "F8FAFC"
        for col_idx, val in enumerate(row_data):
            cell = row.cells[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(str(val))
            run.font.name = 'Calibri'
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(30, 41, 59)
            
    for row in tbl.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = Inches(width)

def generate_prd():
    doc = docx.Document()
    
    # Page setup - 0.8 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    # Title Section
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_title = title_p.add_run("A.N.X Ecosystem Platform")
    run_title.font.name = 'Calibri'
    run_title.font.size = Pt(26)
    run_title.bold = True
    run_title.font.color.rgb = RGBColor(15, 23, 42)
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(16)
    run_sub = sub_p.add_run("Master Product Requirements Document (PRD) — V1 Production Hardening & V2 Growth Engine")
    run_sub.font.name = 'Calibri'
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = RGBColor(124, 58, 237)
    run_sub.bold = True
    
    # Metadata Table
    meta_table = doc.add_table(rows=1, cols=4)
    meta_headers = ["Document Version", "Architecture Status", "Target Audience", "Effective Date"]
    meta_data = [["v2.0.0 (Unified Master)", "Production-Ready / Industry Grade", "Core Engineering, Product & Investors", "September 2026"]]
    format_table(meta_table, [1.6, 1.8, 2.1, 1.4], meta_headers, meta_data, header_bg="0F172A")
    
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # Section 1: Executive Summary & Vision
    style_heading(doc.add_paragraph(), "1. Executive Summary & Strategic Platform Vision", level=1)
    
    p = doc.add_paragraph()
    p.add_run("The A.N.X Platform is the digital operating system for modern engineering student communities. While V1 established the core utility layer—authentication, member dashboards, event ticketing, mentor bookings, and membership subscription billing—V2 elevates A.N.X into a fully self-sustaining growth and talent incubation ecosystem.\n\n"
              "V2 guarantees student retention and career outcomes by connecting every community activity to verifiable progress: members earn XP and milestone badges, incubate software products from concept to launch, access curated technical internships, get resumes reviewed by senior engineers, and receive tamper-proof digital credentials.")
    
    add_callout(doc, "V2 is explicitly an architectural expansion, not a rewrite. It preserves and extends the verified Next.js 14 App Router, Cloud Firestore, and Razorpay foundation while introducing automated event-driven hooks, scheduled aggregation workers, and multi-channel communication.", "STRATEGIC ARCHITECTURAL PILLAR")
    
    # Section 2: User Roles & Access Hierarchy
    style_heading(doc.add_paragraph(), "2. User Roles & Permission Hierarchy", level=1)
    
    roles_table = doc.add_table(rows=1, cols=3)
    role_headers = ["User Role", "Target Persona", "System Capabilities & Access Scope"]
    role_data = [
        ["Public Visitor", "Prospective students & external recruiters", "Browse landing page, public event directory, public project showcase, global leaderboard, and certificate verification portal."],
        ["Free Member", "Registered college students", "Access personal dashboard, register for free workshops, submit incubation ideas, access basic learning roadmaps, apply to internal roles, and earn XP."],
        ["Premium Member", "Paying members (₹149/mo, ₹999/yr)", "All Free perks + automatic ticket discounts, 5 hrs/mo priority mentor bookings, premium roadmap tracks, partner internship visibility, and automated verifiable certificates."],
        ["Verified Mentor", "Industry seniors & tech leads", "Review submitted product ideas, conduct 1-on-1 sessions with meeting links, provide structured resume feedback, and log weekly intern evaluations."],
        ["Campus Ambassador", "College student leaders", "Personalized ambassador portal, unique referral codes, conversion analytics, milestone commission tracking, and ambassador badge."],
        ["Partner Company", "Vetted hiring partners & startups", "Self-serve company portal, post technical internships/jobs, review verified candidate portfolios, and manage applicant interview statuses."],
        ["System Administrator", "Core team & department heads", "Full ecosystem governance: user roles, event publishing, Razorpay financial audits, idea validation, certificate templates, and broadcast communications."]
    ]
    format_table(roles_table, [1.5, 1.8, 3.6], role_headers, role_data)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # Section 3: V1 Production Hardening (Leftover Improvements Closed)
    style_heading(doc.add_paragraph(), "3. V1 Production Hardening & Scope Resolution", level=1)
    
    p = doc.add_paragraph()
    p.add_run("During the V1 code audit, critical gaps in security rules, contract alignments, and missing UI elements were identified and systematically resolved. The table below documents the production-grade fixes now active in the platform:")
    
    v1_table = doc.add_table(rows=1, cols=3)
    v1_headers = ["Module & Area", "Identified Gap / Vulnerability", "Implemented Production Resolution"]
    v1_data = [
        ["Module 1: Security Rules", "Client SDK could modify role & membership fields directly.", "Hardened firestore.rules: updates strictly restricted to non-privileged fields; sanitized AuthContext update payloads."],
        ["Module 2: Dashboard Real-time", "Dashboard relied on static mock arrays on data latency.", "Connected live API endpoints with auto-fallback and dynamic member-specific event streams."],
        ["Module 3: Payments & Memberships", "Verification updated users doc but skipped memberships collection.", "Implemented atomic dual writes to users and memberships collections with automated expiry downgrades."],
        ["Module 4: Event Registration", "Paid events bypassed Razorpay; Admin event creation schema mismatch.", "Integrated full Razorpay checkout script on EventDetailPage; normalized flexible event schema (eventType, seatsAvailable, onlineLink)."],
        ["Module 5: Mentor Booking", "Status transitions lacked automated notification and calendar sync.", "Connected automated Google Meet/Jitsi link generation and Resend email alerts with ICS calendar invites."],
        ["Module 6: Project Showcase", "No frontend showcase or project submission form existed.", "Created clean public showcase gallery, project submission modal, and admin approval pipeline."],
        ["Module 7: Roadmaps 1.0", "Roadmaps were isolated in code with broken dashboard buttons.", "Integrated tabbed interface on /resources with 12 curated tracks and direct Notion/external learning links."],
        ["Admin Panel Hub", "Admin overview displayed hardcoded mock figures; deletion was local only.", "Connected /admin to live Firestore analytics; implemented real DELETE /api/v1/events/:id and CSV data exporter."]
    ]
    format_table(v1_table, [1.6, 2.4, 2.9], v1_headers, v1_data)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # Section 4: V2 Comprehensive Feature Specifications
    style_heading(doc.add_paragraph(), "4. V2 Complete Feature Modules & Specifications", level=1)
    
    # Module 1
    style_heading(doc.add_paragraph(), "4.1 Module 1: Engagement & Gamification Engine (P0)", level=2)
    p = doc.add_paragraph()
    p.add_run("The gamification engine turns passive community members into active daily contributors through automated XP incentives, verifiable achievement badges, and multi-tier leadership ladders.")
    
    xp_table = doc.add_table(rows=1, cols=3)
    xp_headers = ["Action Trigger", "XP Awarded", "Earn Criteria & Validation Hook"]
    xp_data = [
        ["Workshop / Event Attendance", "+50 XP", "Awarded upon check-in verification or registration attendance."],
        ["Mentor Session Completed", "+75 XP", "Awarded when mentor marks session status as 'Completed'."],
        ["Product Idea Submitted", "+30 XP", "Awarded upon initial idea form submission in the Incubator."],
        ["Product Shipped / Launched", "+250 XP", "Awarded to all active team members when project reaches 'Launched' stage."],
        ["Roadmap Milestone Completed", "+40 XP", "Awarded upon completing all checkpoint tasks in a learning module."],
        ["Paid Member Referral", "+100 XP", "Awarded to referrer once referred member completes Razorpay subscription."]
    ]
    format_table(xp_table, [2.2, 1.2, 3.5], xp_headers, xp_data)
    
    p_lead = doc.add_paragraph()
    p_lead.add_run("\nLeadership Progression Ladder:\n").bold = True
    p_lead.add_run("1. Member (Default on registration)\n"
                   "2. Associate (100+ XP, 3 events attended)\n"
                   "3. Lead (350+ XP, 1 product in incubation, 1 mentor session)\n"
                   "4. Department Head (750+ XP, admin committee approval)\n"
                   "5. Core Team (1,500+ XP, chapter leadership)\n"
                   "6. Director (Executive platform governance)")
    
    # Module 2
    style_heading(doc.add_paragraph(), "4.2 Module 2: Omnichannel Notification System (P0)", level=2)
    p = doc.add_paragraph()
    p.add_run("Reaches students across their primary communication channels: Email (Resend.com), WhatsApp (Wati.io API), and an in-app notification center.\n"
              "• WhatsApp Automated Triggers: 24h event reminders, XP milestone unlocked, mentor session approved with meeting link, internship shortlist notice, and membership renewal alerts.\n"
              "• In-App Notification Center: Real-time bell dropdown on navbar with unread counters and category filtering.\n"
              "• Admin Broadcast Composer: Single composition UI allowing admins to broadcast alerts across Email + WhatsApp + In-App to filtered member cohorts.")
    
    # Module 3
    style_heading(doc.add_paragraph(), "4.3 Module 3: Product Incubation Pipeline (P0)", level=2)
    p = doc.add_paragraph()
    p.add_run("Transforms student hackathon ideas into deployed products through an agile incubation lifecycle:\n"
              "1. Idea Submission: Form capturing Problem Statement, Target Audience, Proposed Solution, and Tech Architecture.\n"
              "2. Mentor Validation: Industry mentors review submissions (Approved / Changes Requested / Rejected) with private feedback.\n"
              "3. Team Formation: Validated ideas post open role slots (Frontend, Backend, UI/UX); members apply with one-click.\n"
              "4. Weekly Sprint Tracker: Lightweight weekly goal boards (3-5 goals/week) to track delivery velocity.\n"
              "5. Milestone Tracker: Idea ➔ Validated ➔ Building ➔ Testing ➔ Launched (automatically showcases on public gallery upon launch).")
    
    # Module 4
    style_heading(doc.add_paragraph(), "4.4 Module 4: Internship & Job Portal (P1)", level=2)
    p = doc.add_paragraph()
    p.add_run("A unified portal for internal club leadership roles and partner company software internships:\n"
              "• 1-Click Profile Application: Auto-populates candidate details (GitHub, portfolio, skills, college, phone) from member profile.\n"
              "• Rule-Based Skill Match Indicator: Calculates dynamic match percentage (e.g. '80% Match - React, Node.js, Docker') against listing criteria.\n"
              "• Weekly Mentor Review Log: Supervisors log weekly intern ratings (1-5) and milestone progress.\n"
              "• Completion Outcome: Automatic generation of verifiable Experience Letter & Certificate.")
    
    # Module 5
    style_heading(doc.add_paragraph(), "4.5 Module 5: Resume Review & Career Prep Tools (P1)", level=2)
    p = doc.add_paragraph()
    p.add_run("Extends mentor bookings with dedicated placement prep workflows:\n"
              "• PDF Resume & Portfolio Review Queue: Students upload resumes with targeted role prompts (e.g. 'Targeting SDE-1 at Tier-1 FinTech').\n"
              "• Structured Reviewer Rubric: Mentors score Impact, Technical Depth, Presentation, and actionable improvements.\n"
              "• Mock Technical Interviews: 45-minute structured live coding and system design sessions with rubric scores.")
    
    # Module 6
    style_heading(doc.add_paragraph(), "4.6 Module 6: Automated Verifiable Certificate Generation (P1)", level=2)
    p = doc.add_paragraph()
    p.add_run("Replaces manual Canva certificate creation with cryptographically verifiable PDF credentials:\n"
              "• Automated Generation: Triggered upon event attendance, internship completion, or roadmap milestone.\n"
              "• Unique Verification Hash: Every certificate receives a permanent unique ID (e.g. 'ANX-CERT-2026-X892').\n"
              "• Public Verification Portal (/verify/[id]): Anyone (employers, college panels) can verify authenticity and view recipient details.\n"
              "• Dynamic PDF Rendering: Generates high-resolution PDF with embedded QR code stored in Firebase Storage.")
    
    # Module 7
    style_heading(doc.add_paragraph(), "4.7 Module 7: Learning Roadmaps 2.0 (P1)", level=2)
    p = doc.add_paragraph()
    p.add_run("Native in-platform interactive learning tracks covering 9 domains: Full-Stack Web, AI/ML, Mobile App, UI/UX, Cloud & DevOps, Cybersecurity, Data Science, Blockchain, and Product Management.\n"
              "• Interactive Step Checkboxes: Students check off modules as they study; progress bars update in real time.\n"
              "• Curated Curriculums: Direct links to official docs, video masterclasses, practice repos, and capstone tasks.\n"
              "• No-Code Admin Curriculum Editor: Admins can update roadmap steps and links directly from the admin panel.")
    
    # Module 8
    style_heading(doc.add_paragraph(), "4.8 Module 8: Executive Admin Analytics Hub (P1)", level=2)
    p = doc.add_paragraph()
    p.add_run("Executive reporting dashboard providing real visibility into ecosystem health:\n"
              "• North Star Metric (Monthly Active Members - MAM): Tracks members who attended events, booked mentors, or shipped code in the last 30 days.\n"
              "• Cohort Retention Matrices: Evaluates month-on-month retention across student batches.\n"
              "• Mentor Capacity & Utilization Gauges: Tracks hours booked vs available slots to prevent mentor fatigue.\n"
              "• Comprehensive CSV Export Engine: Download filtered user rosters, financial ledgers, and event attendance data.")
    
    # Modules 9 to 12
    style_heading(doc.add_paragraph(), "4.9 Modules 9 to 12: Ecosystem Expansion & Growth Loops (P2/P3)", level=2)
    p = doc.add_paragraph()
    p.add_run("• Partner Company Portal (P2): Self-serve employer registration, job posting creation, and lightweight candidate dashboard.\n"
              "• Referral & Growth Engine (P2): Unique referral codes; 'Refer 3 Paid Members ➔ Get 1 Month Free' rule executed automatically.\n"
              "• Campus Ambassador Portal (P2): Chapter lead dashboards tracking college-specific signups, conversions, and reward revenue share.\n"
              "• Community Space & Discord Gateway (P3): OAuth sync assigning Discord roles (Elite Member, Tech Lead) and incubator project channels.")
    
    # Section 5: Database Architecture
    style_heading(doc.add_paragraph(), "5. Complete Unified Firestore Database Schema", level=1)
    p = doc.add_paragraph()
    p.add_run("The table below details the complete 20-collection schema spanning V1 core tables and V2 ecosystem collections:")
    
    db_table = doc.add_table(rows=1, cols=3)
    db_headers = ["Collection Name", "Primary Key & Scope", "Key Schema Fields & Indexes"]
    db_data = [
        ["users", "users/{userId}", "uid, email, fullName, role, membershipType, membershipExpiry, xpTotal, leadershipStage, phoneNumber, collegeName, skills[], portfolioUrl, referralCode, createdAt"],
        ["xpLedger", "xpLedger/{txId}", "id, userId, actionType (event, mentor, idea, referral), xpValue, sourceRefId, reason, awardedBy, createdAt"],
        ["badges", "badges/{badgeId}", "id, name, description, iconUrl, earnConditionType, category, xpBonus, recipientsCount"],
        ["userBadges", "userBadges/{userId_badgeId}", "id, userId, badgeId, earnedDate, awardedBy, sourceRefId"],
        ["leaderboardSnapshots", "leaderboardSnapshots/{id}", "id, scope (global/dept), period (weekly/monthly/all_time), rankings: [{ rank, userId, fullName, xp }], generatedAt"],
        ["leadershipStages", "leadershipStages/{stageId}", "id, userId, stage (Member to Director), department, approvedBy, effectiveDate, criteriaNotes"],
        ["notifications", "notifications/{notifId}", "id, recipientId, channels[] (in_app, whatsapp, email), category, title, body, actionUrl, isRead, createdAt"],
        ["ideas", "ideas/{ideaId}", "id, title, problemStatement, proposedSolution, targetUsers, techStack[], submitterId, status (Idea..Launched), mentorFeedback, createdAt"],
        ["ideaTeams", "ideaTeams/{ideaId_userId}", "id, ideaId, userId, role (Lead/Dev/Designer), status, joinedDate"],
        ["sprints", "sprints/{sprintId}", "id, ideaId, weekNumber, goals: [{ id, text, isCompleted }], blockers, demoUrl, startDate, endDate, status"],
        ["internships", "internships/{internshipId}", "id, title, type (internal/partner), companyOrDept, description, requiredSkills[], stipend, duration, deadline, isActive"],
        ["internshipApplications", "internshipApplications/{appId}", "id, internshipId, memberId, memberDetails: { name, email, phone, skills }, status, skillMatchScore, appliedDate"],
        ["internshipReviews", "internshipReviews/{reviewId}", "id, applicationId, memberId, internshipId, weekNumber, rating (1-5), deliverablesSummary, mentorNotes, createdAt"],
        ["reviewRequests", "reviewRequests/{reqId}", "id, memberId, type (resume/portfolio/mock), fileUrl, targetRole, status, assignedMentorId, mentorFeedback, createdAt"],
        ["certificates", "certificates/{certId}", "id (Verification Hash), memberId, recipientName, templateType, title, issueDate, verificationUrl, pdfStorageUrl, isValid"],
        ["roadmapProgress", "roadmapProgress/{userId_roadmapId}", "id, userId, roadmapId, completedStepIds[], progressPercentage, isCompleted, lastActiveTimestamp"],
        ["events", "events/{eventId}", "id, title, description, date, time, venue, isOnline, category, price, premiumPrice, capacity, seatsBooked, posterUrl, isActive"],
        ["eventRegistrations", "eventRegistrations/{regId}", "id, eventId, userId, name, email, phone, paymentStatus, orderId, amount, registeredAt, status"],
        ["memberships", "memberships/{membershipId}", "id, userId, plan (monthly/annual), status, startDate, endDate, razorpayPaymentId, orderId, amount, createdAt"],
        ["payments", "payments/{orderId}", "id, userId, paymentId, orderId, amount, paymentType (membership/event), status, verifiedAt, createdAt"],
        ["partners", "partners/{partnerId}", "id, companyName, website, logoUrl, industry, recruiterEmail, approvalStatus, activeListingsCount, createdAt"],
        ["referrals", "referrals/{referralId}", "id, referrerId, referredUserId, status (registered/paid), rewardClaimed, registeredAt, convertedAt"],
        ["ambassadors", "ambassadors/{ambassadorId}", "id, memberId, collegeName, referralCode, totalSignups, totalPaidConversions, earnedRewardsTotal, approvalStatus"],
        ["analyticsSnapshots", "analyticsSnapshots/{date}", "date, totalUsers, paidMembers, mrr, mams, eventAttendanceRate, mentorUtilizationRate, generatedAt"]
    ]
    format_table(db_table, [1.6, 2.0, 3.3], db_headers, db_data)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # Section 6: Non-Functional & Security Architecture
    style_heading(doc.add_paragraph(), "6. Non-Functional, Security & Performance Requirements", level=1)
    
    p = doc.add_paragraph()
    p.add_run("• Zero-Trust Client Security: All critical state transitions (role changes, membership upgrades, XP grants, certificate creation) occur strictly on server API routes using Firebase Admin SDK. Client firestore.rules block direct client writes to protected fields.\n"
              "• Cryptographic Integrity: Razorpay webhooks and payment verifications utilize HMAC-SHA256 signatures with constant-time equality checks to prevent timing attacks.\n"
              "• Scalability (1,000+ Active Members): Heavy computations (Leaderboards, Cohort retention, MAM North Star metrics) run via nightly scheduled background cron jobs into pre-computed snapshot tables, avoiding expensive unindexed full-collection scans.\n"
              "• Resilient Email & Messaging Delivery: All Resend and Wati.io API calls are wrapped in non-blocking try-catch workers to ensure notification failures never block core user database transactions.")
    
    # Section 7: 16-Week Roadmap & Success Metrics
    style_heading(doc.add_paragraph(), "7. 16-Week Implementation Roadmap & Success Targets", level=1)
    
    sprint_table = doc.add_table(rows=1, cols=3)
    sprint_headers = ["Sprint Phase", "Target Focus & Primary Modules", "Core Acceptance Milestones"]
    sprint_data = [
        ["Sprint 1 (Weeks 1–4)", "Engagement & Gamification + Omnichannel Notifications", "Automated XP ledger active; Wati.io WhatsApp triggers operating; leaderboard refreshes nightly."],
        ["Sprint 2 (Weeks 5–8)", "Product Incubation Pipeline & Team Formation", "Idea submission form live; mentor validation queue active; weekly sprint trackers operational."],
        ["Sprint 3 (Weeks 9–12)", "Career Outcomes: Internships, Resumes & Certificates", "Internship portal with skill matching; resume feedback rubrics; /verify/[id] PDF credential verification."],
        ["Sprint 4 (Weeks 13–16)", "Executive Analytics, Partner Portal & Growth Loops", "MAM North Star dashboard active; partner company self-serve portal; automated referral rewards."]
    ]
    format_table(sprint_table, [1.6, 2.7, 2.6], sprint_headers, sprint_data)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    kpi_table = doc.add_table(rows=1, cols=3)
    kpi_headers = ["Platform Growth Metric", "V1 Baseline", "V2 16-Week Target"]
    kpi_data = [
        ["Total Registered Members", "~200 Students", "1,000+ Verified Students"],
        ["Paid Premium Subscribers", "~30 Members", "150 – 300 Members"],
        ["Monthly Recurring Revenue (MRR)", "₹15,000", "₹50,000 – ₹1,00,000"],
        ["Monthly Active Members (North Star MAM)", "25%", "> 60% Monthly Active"],
        ["Products in Incubation Lifecycle", "0", "5 – 10 Shipped Products"],
        ["Technical Internships Placed", "0", "20+ Placed Students"],
        ["Active Campus Ambassador Chapters", "0", "3 – 5 Engineering Colleges"]
    ]
    format_table(kpi_table, [2.5, 2.0, 2.4], kpi_headers, kpi_data)
    
    # Save document
    output_path = r"C:\Users\saira\Desktop\ANXversion1\ANXversion1\ANX_Master_PRD_V1_V2.docx"
    doc.save(output_path)
    print("Document successfully created at:", output_path)

if __name__ == "__main__":
    generate_prd()
