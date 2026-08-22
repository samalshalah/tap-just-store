import Link from "next/link";
import { listMessages } from "@/lib/messages-admin";
import { MessagesList } from "./MessagesList";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const { all } = await searchParams;
  const showHandled = all === "1";
  const { messages, unread, subscribers } = await listMessages(showHandled);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="mt-1 text-zinc-400">
            {unread > 0 ? `${unread} unread · ` : ""}
            {subscribers} newsletter {subscribers === 1 ? "subscriber" : "subscribers"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={showHandled ? "/admin/messages" : "/admin/messages?all=1"}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            {showHandled ? "Hide handled" : "Show handled"}
          </Link>
        </div>
      </div>

      <MessagesList messages={messages} subscribers={subscribers} />
    </div>
  );
}
