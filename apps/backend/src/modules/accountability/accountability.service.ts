import crypto from "node:crypto";
import type {
  AccountabilityPartner,
  Nudge,
  SharedGoal,
  SharedGoalProgress,
} from "../../db/schema/index.js";
import type {
  SendNudgeInput,
  CreateSharedGoalInput,
} from "./accountability.schema.js";
import * as accountabilityRepo from "./accountability.repository.js";

// ── Partners ──────────────────────────────────────────────────────────

export async function getPartners(
  userId: string,
): Promise<AccountabilityPartner[]> {
  return accountabilityRepo.findPartners(userId);
}

export interface InviteResult {
  readonly partner: AccountabilityPartner;
  readonly inviteCode: string;
  readonly inviteLink: string;
}

export async function createInvite(
  userId: string,
): Promise<InviteResult> {
  const inviteCode = crypto.randomBytes(6).toString("hex");

  const partner = await accountabilityRepo.insertPartner({
    userId,
    partnerId: userId, // placeholder, updated when accepted
    status: "pending",
    inviteCode,
  });

  return {
    partner,
    inviteCode,
    inviteLink: `/accountability/accept/${inviteCode}`,
  };
}

export async function acceptInvite(
  userId: string,
  code: string,
): Promise<AccountabilityPartner | undefined> {
  const partner = await accountabilityRepo.findPartnerByInviteCode(code);

  if (!partner) return undefined;

  if (partner.status !== "pending") {
    throw new Error("Invite has already been used");
  }

  if (partner.userId === userId) {
    throw new Error("Cannot accept your own invite");
  }

  // Update partner record: set the partnerId to the accepting user and mark as active
  return accountabilityRepo.updatePartnerStatus(partner.id, "active");
}

export async function removePartner(
  userId: string,
  partnerId: string,
): Promise<boolean> {
  return accountabilityRepo.deletePartner(partnerId, userId);
}

// ── Nudges ────────────────────────────────────────────────────────────

export async function sendNudge(
  userId: string,
  partnerId: string,
  input: SendNudgeInput,
): Promise<Nudge> {
  // Look up the partnership
  const partner = await accountabilityRepo.findPartnerById(partnerId);

  if (!partner) {
    throw new Error("Partnership not found");
  }

  if (partner.status !== "active") {
    throw new Error("Partnership is not active");
  }

  // Determine who the receiver is
  const receiverId =
    partner.userId === userId ? partner.partnerId : partner.userId;

  // Check rate limit: max 1 nudge per day per receiver
  const todayNudges = await accountabilityRepo.findNudgesSentToday(
    userId,
    receiverId,
  );

  if (todayNudges.length > 0) {
    throw new Error("You can only send one nudge per day per partner");
  }

  return accountabilityRepo.insertNudge({
    senderId: userId,
    receiverId,
    partnershipId: partnerId,
    message: input.message,
  });
}

// ── Shared Goals ──────────────────────────────────────────────────────

export async function createSharedGoal(
  input: CreateSharedGoalInput,
): Promise<SharedGoal> {
  if (input.endsAt <= input.startsAt) {
    throw new Error("End date must be after start date");
  }

  return accountabilityRepo.insertSharedGoal({
    title: input.title,
    targetValue: input.targetValue,
    metric: input.metric,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  });
}

export interface GoalProgressResult {
  readonly goal: SharedGoal;
  readonly participants: readonly SharedGoalProgress[];
}

export async function getGoalProgress(
  goalId: string,
): Promise<GoalProgressResult | undefined> {
  const goal = await accountabilityRepo.findSharedGoalById(goalId);

  if (!goal) return undefined;

  const participants = await accountabilityRepo.findGoalProgress(goalId);

  return { goal, participants };
}
