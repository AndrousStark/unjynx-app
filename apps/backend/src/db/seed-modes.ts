/**
 * Seed industry modes, vocabulary, templates, and dashboard widgets.
 *
 * Run: npx tsx src/db/seed-modes.ts
 *
 * Idempotent: uses ON CONFLICT DO NOTHING for modes (by slug).
 * Re-running will only insert NEW modes/vocab/templates that don't exist.
 */

import { db } from "./index.js";
import { industryModes, modeVocabulary, modeTemplates, modeDashboardWidgets } from "./schema/index.js";
import { eq } from "drizzle-orm";

// ── Mode Definitions ─────────────────────────────────────────────────

interface ModeSeed {
  slug: string;
  name: string;
  description: string;
  icon: string;
  colorHex: string;
  sortOrder: number;
  vocabulary: Record<string, string>;
  templates: { name: string; description: string; category: string; subtasks: string[] }[];
  widgets: { widgetType: string; config: Record<string, unknown> }[];
}

const MODES: readonly ModeSeed[] = [
  // ── 1. Legal ──────────────────────────────────────────────────────
  {
    slug: "legal",
    name: "Legal",
    description: "Law firms, solo practitioners, paralegals — case management, deadlines, billing",
    icon: "scale",
    colorHex: "#1E3A5F",
    sortOrder: 1,
    vocabulary: {
      Task: "Matter", Project: "Case", Section: "Phase", Tag: "Practice Area",
      Subtask: "Action Item", Assignee: "Attorney", "Due Date": "Filing Date",
      Comment: "Case Note", Template: "Playbook", Progress: "Case Status",
      "Priority: Urgent": "Emergency Motion", "Priority: High": "Court Deadline",
      "Priority: Medium": "Client Request", "Priority: Low": "Internal Review",
    },
    templates: [
      { name: "New Client Intake", description: "Onboard a new client", category: "intake", subtasks: ["Conflict check", "Engagement letter", "Retainer agreement", "Welcome email", "Add to billing system"] },
      { name: "Litigation Timeline", description: "Track litigation phases", category: "litigation", subtasks: ["Complaint filed", "Answer due date", "Discovery period", "Depositions", "Pre-trial motions", "Trial preparation", "Trial"] },
      { name: "Contract Review", description: "Review and redline a contract", category: "contracts", subtasks: ["Read contract", "Identify key terms", "Flag risk areas", "Draft redlines", "Client review call", "Final execution"] },
      { name: "Court Filing Prep", description: "Prepare for court filing", category: "filing", subtasks: ["Draft motion", "Cite check", "Format per court rules", "File electronically", "Serve opposing counsel"] },
      { name: "Due Diligence", description: "Corporate due diligence checklist", category: "corporate", subtasks: ["Corporate documents", "Financial statements", "IP review", "Contracts review", "Regulatory compliance", "Final report"] },
      { name: "Monthly Billing", description: "End-of-month billing cycle", category: "billing", subtasks: ["Review time entries", "Generate invoices", "Trust reconciliation", "Send statements", "Follow up on overdue"] },
    ],
    widgets: [
      { widgetType: "kpi_counter", config: { metric: "active_cases", label: "Active Cases", icon: "briefcase" } },
      { widgetType: "kpi_counter", config: { metric: "billable_hours_week", label: "Billable Hours (Week)", icon: "clock" } },
      { widgetType: "timeline", config: { source: "tasks", filter: { priority: ["urgent", "high"] }, label: "Court Deadlines" } },
      { widgetType: "compliance_tracker", config: { label: "Statute of Limitations" } },
      { widgetType: "bar_chart", config: { metric: "tasks_by_tag", label: "Cases by Practice Area" } },
      { widgetType: "calendar_upcoming", config: { daysAhead: 14, label: "Upcoming Deadlines" } },
    ],
  },

  // ── 2. Healthcare ─────────────────────────────────────────────────
  {
    slug: "healthcare",
    name: "Healthcare",
    description: "Clinics, therapists, providers — appointments, follow-ups, compliance",
    icon: "heart-pulse",
    colorHex: "#0D7377",
    sortOrder: 2,
    vocabulary: {
      Task: "Appointment", Project: "Treatment Plan", Section: "Treatment Phase",
      Tag: "Specialty", Subtask: "Follow-up", Assignee: "Provider",
      "Due Date": "Appointment Date", Comment: "Clinical Note",
      Template: "Protocol", Progress: "Patient Status",
      "Priority: Urgent": "Emergency", "Priority: High": "Same-Day",
    },
    templates: [
      { name: "New Patient Intake", description: "Onboard a new patient", category: "intake", subtasks: ["Demographics form", "Insurance verification", "Consent forms", "Medical history", "Initial assessment"] },
      { name: "Annual Physical", description: "Yearly exam checklist", category: "exam", subtasks: ["Vitals check", "Lab orders", "Screening questions", "Preventive care review", "Follow-up scheduling"] },
      { name: "Therapy Session Prep", description: "Prepare for therapy session", category: "therapy", subtasks: ["Review previous notes", "Treatment plan check", "Session agenda", "Post-session documentation"] },
      { name: "Insurance Pre-Auth", description: "Pre-authorization workflow", category: "billing", subtasks: ["Gather clinical info", "Submit request", "Track approval", "Notify patient", "Schedule procedure"] },
      { name: "Lab Result Follow-up", description: "Process lab results", category: "labs", subtasks: ["Review results", "Flag abnormals", "Prepare communication", "Contact patient", "Update treatment plan"] },
      { name: "Discharge Planning", description: "Patient discharge checklist", category: "discharge", subtasks: ["Medication review", "Follow-up appointments", "Patient education", "Referral letters", "DME orders"] },
    ],
    widgets: [
      { widgetType: "timeline", config: { source: "tasks", label: "Today's Appointments" } },
      { widgetType: "kpi_counter", config: { metric: "pending_followups", label: "Pending Follow-ups", icon: "clipboard" } },
      { widgetType: "kpi_counter", config: { metric: "tasks_overdue", label: "Overdue Follow-ups", icon: "alert-triangle" } },
      { widgetType: "calendar_upcoming", config: { daysAhead: 7, label: "This Week" } },
      { widgetType: "bar_chart", config: { metric: "tasks_by_tag", label: "By Specialty" } },
      { widgetType: "compliance_tracker", config: { label: "Compliance Deadlines" } },
    ],
  },

  // ── 3. Dev Teams ──────────────────────────────────────────────────
  {
    slug: "dev_teams",
    name: "Dev Teams",
    description: "Software teams — sprints, issues, code review, CI/CD, deployments",
    icon: "code",
    colorHex: "#7C3AED",
    sortOrder: 3,
    vocabulary: {
      Task: "Issue", Project: "Repository", Section: "Sprint",
      Tag: "Label", Subtask: "Sub-issue", Assignee: "Developer",
      "Due Date": "Sprint End", Comment: "Comment",
      Template: "Issue Template", Progress: "Status",
      "Priority: Urgent": "P0 / Blocker", "Priority: High": "P1 / Critical",
      "Priority: Medium": "P2 / Normal", "Priority: Low": "P3 / Minor",
    },
    templates: [
      { name: "Sprint Planning", description: "Plan the next sprint", category: "agile", subtasks: ["Review backlog", "Groom stories", "Estimate points", "Set sprint goal", "Assign owners", "Update board"] },
      { name: "Bug Report", description: "Standard bug template", category: "bugs", subtasks: ["Reproduce steps", "Expected vs actual", "Screenshots/logs", "Set severity", "Assign to owner"] },
      { name: "Feature RFC", description: "Request for comments", category: "features", subtasks: ["Problem statement", "Proposed solution", "Alternatives considered", "Technical design", "Implementation plan"] },
      { name: "Code Review", description: "PR review checklist", category: "review", subtasks: ["Read PR description", "Review code changes", "Check tests", "Security review", "Performance check", "Approve or request changes"] },
      { name: "Release Checklist", description: "Ship a release", category: "release", subtasks: ["Freeze branch", "Run full CI", "Update changelog", "Tag release", "Deploy to staging", "Deploy to production", "Monitor metrics"] },
      { name: "Incident Response", description: "Production incident", category: "ops", subtasks: ["Detect and alert", "Triage severity", "Mitigate impact", "Communicate status", "Root cause analysis", "Write postmortem", "Action items"] },
      { name: "Sprint Retrospective", description: "End-of-sprint retro", category: "agile", subtasks: ["What went well", "What didn't", "Action items", "Velocity review"] },
    ],
    widgets: [
      { widgetType: "burndown", config: { metric: "points", label: "Sprint Burndown" } },
      { widgetType: "kpi_counter", config: { metric: "open_issues", label: "Open Issues", icon: "circle-dot" } },
      { widgetType: "bar_chart", config: { metric: "issues_by_priority", label: "By Priority", groupBy: "priority" } },
      { widgetType: "kpi_counter", config: { metric: "velocity", label: "Velocity (Avg)", icon: "zap" } },
      { widgetType: "kpi_counter", config: { metric: "bugs_open", label: "Open Bugs", icon: "bug" } },
      { widgetType: "calendar_upcoming", config: { daysAhead: 14, label: "Sprint End & Releases" } },
    ],
  },

  // ── 4. Construction ───────────────────────────────────────────────
  {
    slug: "construction",
    name: "Construction",
    description: "Builders, contractors, foremen — job sites, inspections, permits, safety",
    icon: "hard-hat",
    colorHex: "#C2410C",
    sortOrder: 4,
    vocabulary: {
      Task: "Work Order", Project: "Job Site", Section: "Phase",
      Tag: "Trade", Subtask: "Punch Item", Assignee: "Foreman",
      "Due Date": "Inspection Date", Comment: "Daily Log",
      Template: "Checklist", "Priority: Urgent": "Safety Hazard",
      "Priority: High": "Inspection Required",
    },
    templates: [
      { name: "Pre-Construction", description: "Before breaking ground", category: "planning", subtasks: ["Permits obtained", "Site survey", "Soil test", "Utility locate", "Insurance verified", "Contracts signed"] },
      { name: "Daily Safety Inspection", description: "Morning safety check", category: "safety", subtasks: ["PPE check", "Scaffolding inspection", "Fall protection", "Electrical safety", "Fire extinguishers", "Sign inspection log"] },
      { name: "Punch List", description: "Pre-handover items", category: "closeout", subtasks: ["Walk-through inspection", "Document deficiencies", "Assign to trades", "Verify corrections", "Final sign-off"] },
      { name: "Change Order", description: "Scope change process", category: "changes", subtasks: ["Scope review", "Cost estimate", "Client approval", "Update budget", "Schedule impact assessment"] },
      { name: "Project Closeout", description: "Final project handoff", category: "closeout", subtasks: ["Final inspection", "As-built drawings", "Warranty documents", "Lien releases", "Certificate of occupancy"] },
    ],
    widgets: [
      { widgetType: "kpi_counter", config: { metric: "active_projects", label: "Active Job Sites", icon: "building" } },
      { widgetType: "calendar_upcoming", config: { daysAhead: 7, label: "Upcoming Inspections" } },
      { widgetType: "bar_chart", config: { metric: "tasks_by_status", label: "Work Orders by Status" } },
      { widgetType: "kpi_counter", config: { metric: "tasks_overdue", label: "Overdue Items", icon: "alert-triangle" } },
      { widgetType: "weather_forecast", config: { label: "Weather Impact" } },
    ],
  },

  // ── 5. Real Estate ────────────────────────────────────────────────
  {
    slug: "real_estate",
    name: "Real Estate",
    description: "Agents, brokers — listings, showings, transactions, lead nurture",
    icon: "home",
    colorHex: "#0891B2",
    sortOrder: 5,
    vocabulary: {
      Task: "Follow-up", Project: "Transaction", Section: "Pipeline Stage",
      Tag: "Property Type", Assignee: "Agent", Comment: "Showing Notes",
      Template: "Transaction Checklist",
    },
    templates: [
      { name: "Buyer Transaction", description: "End-to-end buyer process", category: "buying", subtasks: ["Pre-approval letter", "Property showings", "Submit offer", "Home inspection", "Appraisal", "Closing coordination"] },
      { name: "Seller Listing", description: "List a property", category: "selling", subtasks: ["CMA analysis", "Listing agreement", "Professional photos", "MLS entry", "Open house prep", "Review offers"] },
      { name: "Lead Nurture", description: "Nurture a new lead", category: "leads", subtasks: ["Initial contact", "Property matches email", "Follow-up call", "Schedule showing", "Send market update"] },
      { name: "Closing Coordination", description: "Final steps to close", category: "closing", subtasks: ["Title company coordination", "Lender communication", "Final walkthrough", "Signing appointment", "Keys handoff"] },
    ],
    widgets: [
      { widgetType: "pipeline", config: { stages: ["Lead", "Showing", "Offer", "Under Contract", "Closed"], label: "Deal Pipeline" } },
      { widgetType: "kpi_counter", config: { metric: "active_listings", label: "Active Listings", icon: "home" } },
      { widgetType: "kpi_counter", config: { metric: "tasks_due_today", label: "Follow-ups Today", icon: "phone" } },
      { widgetType: "calendar_upcoming", config: { daysAhead: 7, label: "Upcoming Showings" } },
    ],
  },

  // ── 6. Education ──────────────────────────────────────────────────
  {
    slug: "education",
    name: "Education",
    description: "Teachers, professors, tutors — lessons, assignments, grading, curriculum",
    icon: "graduation-cap",
    colorHex: "#2563EB",
    sortOrder: 6,
    vocabulary: {
      Task: "Assignment", Project: "Course", Section: "Module",
      Tag: "Subject", Subtask: "Sub-assignment", Assignee: "Teacher",
      "Due Date": "Submission Deadline", Comment: "Feedback",
      Template: "Lesson Plan", Progress: "Grade",
      "Priority: Urgent": "Exam", "Priority: High": "Project Due",
    },
    templates: [
      { name: "Lesson Plan", description: "Plan a class session", category: "teaching", subtasks: ["Learning objectives", "Materials prep", "Warm-up activity", "Main instruction", "Student activity", "Assessment", "Reflection"] },
      { name: "Semester Prep", description: "Prepare for new semester", category: "planning", subtasks: ["Syllabus creation", "Course outline", "Materials ordered", "LMS setup", "First week activities"] },
      { name: "Exam Creation", description: "Create an assessment", category: "assessment", subtasks: ["Question bank review", "Format decision", "Rubric creation", "Answer key", "Proctor instructions"] },
      { name: "Student Progress Review", description: "Review student performance", category: "review", subtasks: ["Attendance check", "Grade analysis", "Participation notes", "Parent contact if needed", "Intervention plan"] },
      { name: "Parent-Teacher Conference", description: "Prepare for parent meeting", category: "communication", subtasks: ["Review grades", "Behavior notes", "Set goals", "Action plan", "Follow-up date"] },
    ],
    widgets: [
      { widgetType: "kpi_counter", config: { metric: "tasks_due_today", label: "Assignments Due", icon: "book-open" } },
      { widgetType: "kpi_counter", config: { metric: "active_projects", label: "Active Courses", icon: "graduation-cap" } },
      { widgetType: "calendar_upcoming", config: { daysAhead: 14, label: "Upcoming Deadlines" } },
      { widgetType: "bar_chart", config: { metric: "tasks_by_tag", label: "By Subject" } },
    ],
  },

  // ── 7. Finance ────────────────────────────────────────────────────
  {
    slug: "finance",
    name: "Finance",
    description: "Accountants, advisors, auditors — reporting, compliance, client portfolios",
    icon: "landmark",
    colorHex: "#047857",
    sortOrder: 7,
    vocabulary: {
      Task: "Review Item", Project: "Client Account", Section: "Quarter",
      Tag: "Account Type", Assignee: "Analyst", "Due Date": "Filing Deadline",
      "Priority: Urgent": "Audit Finding",
    },
    templates: [
      { name: "Month-End Close", description: "Monthly close process", category: "accounting", subtasks: ["Journal entries", "Bank reconciliation", "Accruals review", "Financial reports", "Manager review"] },
      { name: "Tax Filing Prep", description: "Prepare tax returns", category: "tax", subtasks: ["Gather documents", "Calculate liability", "Prepare returns", "Quality review", "File electronically", "Confirm acceptance"] },
      { name: "Portfolio Review", description: "Client portfolio meeting", category: "advisory", subtasks: ["Performance analysis", "Rebalancing assessment", "Risk evaluation", "Report preparation", "Client meeting"] },
      { name: "Audit Preparation", description: "Prepare for audit", category: "audit", subtasks: ["Document gathering", "Reconciliation review", "Control testing", "Management letter draft", "Follow-up items"] },
    ],
    widgets: [
      { widgetType: "compliance_tracker", config: { label: "Filing Deadlines" } },
      { widgetType: "kpi_counter", config: { metric: "tasks_due_this_week", label: "Due This Week", icon: "calendar" } },
      { widgetType: "bar_chart", config: { metric: "tasks_by_tag", label: "By Account Type" } },
      { widgetType: "kpi_counter", config: { metric: "tasks_overdue", label: "Overdue Items", icon: "alert-triangle" } },
    ],
  },

  // ── 8. HR ─────────────────────────────────────────────────────────
  {
    slug: "hr",
    name: "HR",
    description: "HR teams — hiring, onboarding, performance, compliance, benefits",
    icon: "users",
    colorHex: "#DB2777",
    sortOrder: 8,
    vocabulary: {
      Task: "Action Item", Project: "Initiative", Section: "Quarter",
      Tag: "Department", Assignee: "HR Partner",
      "Priority: Urgent": "Compliance Issue",
    },
    templates: [
      { name: "New Hire Onboarding", description: "30-day onboarding plan", category: "onboarding", subtasks: ["Offer letter signed", "Background check", "IT equipment setup", "Orientation day", "Buddy assignment", "30-day check-in"] },
      { name: "Performance Review", description: "Review cycle", category: "performance", subtasks: ["Self-assessment sent", "Manager review", "Calibration meeting", "Feedback session", "Goal setting", "Documentation"] },
      { name: "Offboarding", description: "Employee exit process", category: "offboarding", subtasks: ["Exit interview", "Equipment return", "Access revocation", "Final paycheck", "Benefits transition"] },
      { name: "Recruitment Pipeline", description: "Hire for a role", category: "recruiting", subtasks: ["Job description", "Post to boards", "Screen resumes", "Phone screens", "Panel interviews", "Offer negotiation", "Onboarding handoff"] },
      { name: "Benefits Enrollment", description: "Annual enrollment", category: "benefits", subtasks: ["Communicate open enrollment", "Plan comparison guide", "Enrollment deadline reminders", "Process elections", "Confirm coverage"] },
    ],
    widgets: [
      { widgetType: "pipeline", config: { stages: ["Applied", "Screening", "Interview", "Offer", "Hired"], label: "Hiring Pipeline" } },
      { widgetType: "kpi_counter", config: { metric: "tasks_due_today", label: "Action Items Today", icon: "clipboard" } },
      { widgetType: "compliance_tracker", config: { label: "HR Compliance" } },
      { widgetType: "bar_chart", config: { metric: "tasks_by_tag", label: "By Department" } },
    ],
  },

  // ── 9. Marketing ──────────────────────────────────────────────────
  {
    slug: "marketing",
    name: "Marketing",
    description: "Marketing teams — campaigns, content, social media, analytics",
    icon: "megaphone",
    colorHex: "#E11D48",
    sortOrder: 9,
    vocabulary: {
      Task: "Deliverable", Project: "Campaign", Section: "Phase",
      Tag: "Channel", Assignee: "Creator",
      "Priority: Urgent": "Launch Day",
    },
    templates: [
      { name: "Campaign Launch", description: "End-to-end campaign", category: "campaigns", subtasks: ["Creative brief", "Asset creation", "Copy writing", "Landing page", "Tracking setup", "Launch", "Monitor performance"] },
      { name: "Blog Post", description: "Content pipeline", category: "content", subtasks: ["Topic research", "Outline", "First draft", "Edit and proofread", "SEO optimization", "Publish", "Social promotion"] },
      { name: "Social Media Calendar", description: "Weekly social plan", category: "social", subtasks: ["Content themes", "Create posts", "Schedule posts", "Community engagement", "Weekly analytics"] },
      { name: "Email Campaign", description: "Email marketing flow", category: "email", subtasks: ["Segment audience", "Write copy", "Design template", "A/B test setup", "Send campaign", "Analyze results"] },
      { name: "Product Launch", description: "Go-to-market plan", category: "launch", subtasks: ["Messaging framework", "Press release", "Demo video", "Website updates", "Email blast", "Social media blitz", "Launch event"] },
    ],
    widgets: [
      { widgetType: "pipeline", config: { stages: ["Planning", "Creation", "Review", "Live", "Analysis"], label: "Content Pipeline" } },
      { widgetType: "kpi_counter", config: { metric: "tasks_due_today", label: "Deliverables Due", icon: "target" } },
      { widgetType: "calendar_upcoming", config: { daysAhead: 14, label: "Content Calendar" } },
      { widgetType: "bar_chart", config: { metric: "tasks_by_tag", label: "By Channel" } },
    ],
  },

  // ── 10. Family ────────────────────────────────────────────────────
  {
    slug: "family",
    name: "Family",
    description: "Families — chores, meal planning, events, shared calendars",
    icon: "house",
    colorHex: "#8B5CF6",
    sortOrder: 10,
    vocabulary: {
      Task: "To-Do", Project: "Event", Section: "Week",
      Tag: "Person", Assignee: "Family Member",
      "Priority: Urgent": "Today!",
    },
    templates: [
      { name: "Weekly Meal Plan", description: "Plan meals for the week", category: "meals", subtasks: ["Plan meals", "Make grocery list", "Sunday prep", "Weeknight cooking", "Leftover plan"] },
      { name: "Birthday Party", description: "Plan a birthday celebration", category: "events", subtasks: ["Guest list", "Venue booking", "Invitations", "Food and cake", "Decorations", "Activities planned"] },
      { name: "Family Vacation", description: "Trip planning", category: "travel", subtasks: ["Choose destination", "Book flights/hotel", "Pack essentials", "Create itinerary", "Emergency contacts", "Set out-of-office"] },
      { name: "Back to School", description: "School year prep", category: "school", subtasks: ["School supplies", "Uniforms/clothes", "Schedule review", "Teacher meeting", "After-school activities"] },
    ],
    widgets: [
      { widgetType: "chore_chart", config: { label: "Chore Chart" } },
      { widgetType: "calendar_upcoming", config: { daysAhead: 7, label: "This Week" } },
      { widgetType: "kpi_counter", config: { metric: "tasks_due_today", label: "Today's To-Dos", icon: "check-circle" } },
    ],
  },

  // ── 11. Students ──────────────────────────────────────────────────
  {
    slug: "students",
    name: "Students",
    description: "Students — homework, exams, research, study schedules, group projects",
    icon: "book-open",
    colorHex: "#4F46E5",
    sortOrder: 11,
    vocabulary: {
      Task: "Assignment", Project: "Course", Section: "Week",
      Tag: "Subject", Assignee: "Study Partner",
      "Due Date": "Submission Deadline",
      "Priority: Urgent": "Due Tomorrow!", "Priority: High": "Exam Prep",
    },
    templates: [
      { name: "Exam Study Plan", description: "Prepare for an exam", category: "exams", subtasks: ["Gather materials", "Review lecture notes", "Practice problems", "Create flashcards", "Mock test", "Rest day before exam"] },
      { name: "Research Paper", description: "End-to-end paper", category: "papers", subtasks: ["Topic selection", "Literature review", "Create outline", "Write first draft", "Add citations", "Proofread", "Submit"] },
      { name: "Group Project", description: "Collaborative assignment", category: "group", subtasks: ["Assign roles", "Research phase", "Create presentation", "Rehearse", "Present", "Peer review"] },
      { name: "Semester Planning", description: "Plan the semester", category: "planning", subtasks: ["Course schedule", "Assignment calendar", "Exam dates marked", "Study blocks scheduled", "Break schedule"] },
    ],
    widgets: [
      { widgetType: "study_timer", config: { technique: "pomodoro", label: "Study Timer" } },
      { widgetType: "kpi_counter", config: { metric: "tasks_due_this_week", label: "Due This Week", icon: "book" } },
      { widgetType: "calendar_upcoming", config: { daysAhead: 14, label: "Upcoming Deadlines" } },
      { widgetType: "bar_chart", config: { metric: "tasks_by_tag", label: "By Subject" } },
    ],
  },
];

// ── Seed Function ────────────────────────────────────────────────────

async function seedModes() {
  process.stdout.write(`Seeding ${MODES.length} industry modes...\n`);

  for (const mode of MODES) {
    // Upsert mode (idempotent by slug)
    const existing = await db
      .select({ id: industryModes.id })
      .from(industryModes)
      .where(eq(industryModes.slug, mode.slug))
      .limit(1);

    let modeId: string;

    if (existing.length > 0) {
      modeId = existing[0].id;
      process.stdout.write(`  Mode "${mode.name}" already exists (${modeId})\n`);
    } else {
      const [inserted] = await db
        .insert(industryModes)
        .values({
          slug: mode.slug,
          name: mode.name,
          description: mode.description,
          icon: mode.icon,
          colorHex: mode.colorHex,
          sortOrder: mode.sortOrder,
        })
        .returning({ id: industryModes.id });
      modeId = inserted.id;
      process.stdout.write(`  Created mode "${mode.name}" (${modeId})\n`);
    }

    // Seed vocabulary
    const vocabEntries = Object.entries(mode.vocabulary).map(([original, translated]) => ({
      modeId,
      originalTerm: original,
      translatedTerm: translated,
    }));

    if (vocabEntries.length > 0) {
      await db
        .insert(modeVocabulary)
        .values(vocabEntries)
        .onConflictDoNothing();
      process.stdout.write(`    ${vocabEntries.length} vocabulary terms\n`);
    }

    // Seed templates
    if (mode.templates.length > 0) {
      const existingTemplates = await db
        .select({ name: modeTemplates.name })
        .from(modeTemplates)
        .where(eq(modeTemplates.modeId, modeId));
      const existingNames = new Set(existingTemplates.map((t) => t.name));

      const newTemplates = mode.templates
        .filter((t) => !existingNames.has(t.name))
        .map((t, i) => ({
          modeId,
          name: t.name,
          description: t.description,
          category: t.category,
          subtasksJson: t.subtasks,
          sortOrder: i,
        }));

      if (newTemplates.length > 0) {
        await db.insert(modeTemplates).values(newTemplates);
      }
      process.stdout.write(`    ${newTemplates.length} new templates (${mode.templates.length} total)\n`);
    }

    // Seed widgets
    if (mode.widgets.length > 0) {
      const existingWidgets = await db
        .select({ widgetType: modeDashboardWidgets.widgetType })
        .from(modeDashboardWidgets)
        .where(eq(modeDashboardWidgets.modeId, modeId));

      if (existingWidgets.length === 0) {
        await db.insert(modeDashboardWidgets).values(
          mode.widgets.map((w, i) => ({
            modeId,
            widgetType: w.widgetType,
            configJson: w.config,
            sortOrder: i,
          })),
        );
        process.stdout.write(`    ${mode.widgets.length} widgets\n`);
      } else {
        process.stdout.write(`    widgets already seeded\n`);
      }
    }
  }

  // Summary
  const [modeCount] = await db.select({ count: industryModes.id }).from(industryModes);
  const [vocabCount] = await db.select({ count: modeVocabulary.id }).from(modeVocabulary);
  const [templateCount] = await db.select({ count: modeTemplates.id }).from(modeTemplates);
  const [widgetCount] = await db.select({ count: modeDashboardWidgets.id }).from(modeDashboardWidgets);

  process.stdout.write(`\nSeed complete:\n`);
  process.stdout.write(`  Modes: ${modeCount?.count ?? 0}\n`);
  process.stdout.write(`  Vocabulary: ${vocabCount?.count ?? 0}\n`);
  process.stdout.write(`  Templates: ${templateCount?.count ?? 0}\n`);
  process.stdout.write(`  Widgets: ${widgetCount?.count ?? 0}\n`);

  process.exit(0);
}

seedModes().catch((err) => {
  process.stderr.write(`Seed failed: ${err}\n`);
  process.exit(1);
});
