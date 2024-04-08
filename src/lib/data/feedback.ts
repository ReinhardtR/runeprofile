"use server";

import { db } from "~/db";
import { feedback } from "~/db/schema/feedback";

export async function sendFeedbackAction(message: string) {
  await db.insert(feedback).values({ message });
}
