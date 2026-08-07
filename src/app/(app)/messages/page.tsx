import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { requireFeatureEnabled } from "@/lib/features";
import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { Reveal } from "@/components/reveal";
import { TiltCard } from "@/components/tilt-card";

export default async function MessagesPage(props: {
  searchParams: Promise<{ met?: string }>;
}) {
  const { met } = await props.searchParams;
  const profile = await requireProfile();
  await requireFeatureEnabled("berichten");
  const supabase = await createClient();

  const { data: contacts } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .neq("id", profile.id)
    .order("full_name");

  const { data: allMessages } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, body, created_at, read_at")
    .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
    .order("created_at", { ascending: true });

  const unreadByContact = new Map<string, number>();
  for (const m of allMessages ?? []) {
    if (m.recipient_id === profile.id && !m.read_at) {
      unreadByContact.set(m.sender_id, (unreadByContact.get(m.sender_id) ?? 0) + 1);
    }
  }

  const selectedContact = contacts?.find((c) => c.id === met);
  const thread = selectedContact
    ? (allMessages ?? []).filter(
        (m) =>
          (m.sender_id === profile.id && m.recipient_id === selectedContact.id) ||
          (m.sender_id === selectedContact.id && m.recipient_id === profile.id),
      )
    : [];

  if (selectedContact) {
    const unreadIds = thread
      .filter((m) => m.recipient_id === profile.id && !m.read_at)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadIds);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-primary">Messages</h1>
      <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
        <Reveal as="aside" className={`space-y-1 ${selectedContact ? "hidden sm:block" : ""}`}>
          {contacts?.length ? (
            contacts.map((c) => {
              const unread = unreadByContact.get(c.id) ?? 0;
              return (
                <Link
                  key={c.id}
                  href={`/messages?met=${c.id}`}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                    selectedContact?.id === c.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-background"
                  }`}
                >
                  <span>{c.full_name || c.email}</span>
                  {unread > 0 && (
                    <span className="rounded-full bg-accent px-1.5 text-xs text-primary-foreground">
                      {unread}
                    </span>
                  )}
                </Link>
              );
            })
          ) : (
            <p className="text-sm text-foreground/60">No other users yet.</p>
          )}
        </Reveal>

        <Reveal delayMs={120} className={!selectedContact ? "hidden sm:block" : ""}>
          <TiltCard as="section" className="rounded-lg border border-border bg-background p-4">
            {selectedContact ? (
              <>
                <Link
                  href="/messages"
                  className="mb-3 inline-block text-sm text-foreground/60 hover:text-primary sm:hidden"
                >
                  ← Back to contacts
                </Link>
                <h2 className="mb-4 font-medium">
                  Conversation with {selectedContact.full_name || selectedContact.email}
                </h2>
                <div className="mb-4 max-h-[50vh] space-y-2 overflow-y-auto">
                  {thread.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                        m.sender_id === profile.id
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-surface"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p className="mt-1 text-[10px] opacity-70">
                        {new Date(m.created_at).toLocaleString("en-GB")}
                      </p>
                    </div>
                  ))}
                  {thread.length === 0 && (
                    <p className="text-sm text-foreground/60">No messages yet.</p>
                  )}
                </div>
                <form action={sendMessage} className="flex gap-2">
                  <input type="hidden" name="recipient_id" value={selectedContact.id} />
                  <input
                    name="body"
                    required
                    placeholder="Type a message..."
                    className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
                  />
                  <SubmitButton
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    pendingText="Sending..."
                  >
                    Send
                  </SubmitButton>
                </form>
              </>
            ) : (
              <p className="text-foreground/60">Choose a contact on the left to start a conversation.</p>
            )}
          </TiltCard>
        </Reveal>
      </div>
    </div>
  );
}
