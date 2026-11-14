/**
 * Compares the indexes declared in the Mongoose models with the live database.
 * Exits 1 on drift. Does not change anything: indexes are created by migrations.
 *
 *   npm run db:check-indexes
 */
import mongoose from "mongoose";
import { UserModel } from "@/modules/auth/models/user.model";
import { SessionModel } from "@/modules/auth/models/session.model";
import { PasswordResetModel } from "@/modules/auth/models/password-reset.model";
import { WeddingModel } from "@/modules/weddings/models/wedding.model";
import { MembershipModel } from "@/modules/team/models/membership.model";
import { TeamInviteModel } from "@/modules/team/models/team-invite.model";
import { EventModel } from "@/modules/events/models/event.model";
import { GuestModel } from "@/modules/guests/models/guest.model";
import { InvitationModel } from "@/modules/invitations/models/invitation.model";
import { PhotoModel } from "@/modules/photos/models/photo.model";
import { TodoModel } from "@/modules/todos/models/todo.model";
import { NotificationModel } from "@/modules/notifications/models/notification.model";

const MODELS = [
  UserModel,
  SessionModel,
  PasswordResetModel,
  WeddingModel,
  MembershipModel,
  TeamInviteModel,
  EventModel,
  GuestModel,
  InvitationModel,
  PhotoModel,
  TodoModel,
  NotificationModel,
];

async function main() {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Use the shell environment as is.
  }
  const uri = process.env.MIGRATE_MONGODB_URI ?? process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MIGRATE_MONGODB_URI or MONGODB_URI.");

  await mongoose.connect(uri, {
    autoIndex: false,
    autoCreate: false,
    serverSelectionTimeoutMS: 10_000,
  });

  let drift = false;
  for (const Model of MODELS) {
    const { toCreate, toDrop } = await Model.diffIndexes();
    const name = Model.collection.collectionName;
    if (toCreate.length === 0 && toDrop.length === 0) {
      console.log(`ok     ${name}`);
      continue;
    }
    drift = true;
    console.log(`DRIFT  ${name}`);
    for (const index of toCreate)
      console.log(`  missing in DB: ${JSON.stringify(index)}`);
    for (const index of toDrop)
      console.log(`  not in model:  ${JSON.stringify(index)}`);
  }

  await mongoose.disconnect();
  if (drift) {
    console.log("\nIndex drift found: add a migration (or update the model).");
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
