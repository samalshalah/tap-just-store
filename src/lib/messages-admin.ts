"use server";

import { desc, eq, isNull, sql, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/admin-auth";
import { contactMessagesTable } from "@/lib/schema/contactMessages";
import { newsletterSubscribersTable } from "@/lib/schema/newsletterSubscribers";

/**
 * Contact messages and newsletter subscribers.
 *
 * Every export calls assertAdmin() first — a "use server" export is POSTable
 * by anyone who learns its action id, so the admin layout is not a gate.
 */

export async function listMessages(showHandled = false) {
  await assertAdmin();

  const [rows, [{ value: unread }], [{ value: subscribers }]] = await Promise.all([
    db
      .select()
      .from(contactMessagesTable)
      .where(showHandled ? undefined : isNull(contactMessagesTable.handledAt))
      .orderBy(desc(contactMessagesTable.createdAt))
      .limit(100),
    db
      .select({ value: count() })
      .from(contactMessagesTable)
      .where(isNull(contactMessagesTable.readAt)),
    db
      .select({ value: count() })
      .from(newsletterSubscribersTable)
      .where(isNull(newsletterSubscribersTable.unsubscribedAt)),
  ]);

  return { messages: rows, unread, subscribers };
}

/** Called when a message is opened, so the unread badge means something. */
export async function markMessageRead(id: number) {
  await assertAdmin();
  await db
    .update(contactMessagesTable)
    .set({ readAt: new Date() })
    .where(sql`${contactMessagesTable.id} = ${id} and ${contactMessagesTable.readAt} is null`);
  revalidatePath("/admin/messages");
  return { ok: true as const };
}

export async function setMessageHandled(id: number, handled: boolean) {
  await assertAdmin();
  await db
    .update(contactMessagesTable)
    .set({ handledAt: handled ? new Date() : null, readAt: new Date() })
    .where(eq(contactMessagesTable.id, id));
  revalidatePath("/admin/messages");
  return { ok: true as const };
}

/**
 * The subscriber list as CSV text.
 *
 * Exported rather than synced to a platform, because no email platform is
 * connected yet and a list you cannot get out of the system is not an asset.
 */
export async function exportSubscribers(): Promise<string> {
  await assertAdmin();
  const rows = await db
    .select()
    .from(newsletterSubscribersTable)
    .where(isNull(newsletterSubscribersTable.unsubscribedAt))
    .orderBy(desc(newsletterSubscribersTable.createdAt));

  return [
    "email,signed_up",
    ...rows.map((r) => `${csv(r.email)},${r.createdAt.toISOString()}`),
  ].join("\n");
}

/** Quote a field so an address containing a comma cannot break the file. */
function csv(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}
