import Link from "next/link";
import { ArrowLeft, MessageChatCircle, Send01 } from "@untitledui/icons";
import { requireProfile } from "@/lib/auth";
import { requireFeatureEnabled } from "@/lib/features";
import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { initials } from "@/lib/initials";
import { Reveal } from "@/components/reveal";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";

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
      <PageHeader title="Messages" description="Private conversations with other members." />
      <Reveal>
        <Card className="grid overflow-hidden sm:grid-cols-[280px_1fr]">
          <aside
            aria-label="Contacts"
            className={cx("border-secondary sm:border-r", selectedContact ? "hidden sm:block" : "")}
          >
            <div className="border-b border-secondary px-4 py-4">
              <h2 className="text-md font-semibold text-primary">Contacts</h2>
            </div>
            {contacts?.length ? (
              <ul className="max-h-[60vh] divide-y divide-secondary overflow-y-auto">
                {contacts.map((c) => {
                  const unread = unreadByContact.get(c.id) ?? 0;
                  const name = c.full_name || c.email;
                  const isSelected = selectedContact?.id === c.id;
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/messages?met=${c.id}`}
                        aria-current={isSelected ? "page" : undefined}
                        className={cx(
                          "flex items-center gap-3 px-4 py-3 outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:-outline-offset-2",
                          isSelected ? "bg-secondary" : "hover:bg-primary_hover",
                        )}
                      >
                        <Avatar size="sm" initials={initials(name)} alt={name} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-secondary">{name}</span>
                        {unread > 0 && (
                          <Badge type="pill-color" color="brand" size="sm">
                            {unread}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-4 py-6 text-sm text-tertiary">No other users yet.</p>
            )}
          </aside>

          <section className={cx("flex min-w-0 flex-col", !selectedContact ? "hidden sm:flex" : "")}>
            {selectedContact ? (
              <>
                <div className="flex items-center gap-3 border-b border-secondary px-4 py-3 sm:px-6 sm:py-4">
                  <Button
                    href="/messages"
                    color="tertiary"
                    size="sm"
                    aria-label="Back to contacts"
                    className="sm:hidden"
                    iconLeading={<ArrowLeft data-icon className="size-5" />}
                  />
                  <Avatar
                    size="md"
                    initials={initials(selectedContact.full_name || selectedContact.email)}
                    alt={selectedContact.full_name || selectedContact.email}
                  />
                  <h2 className="min-w-0 truncate text-md font-semibold text-primary">
                    {selectedContact.full_name || selectedContact.email}
                  </h2>
                </div>
                <div className="max-h-[50vh] min-h-64 flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
                  {thread.map((m) => {
                    const mine = m.sender_id === profile.id;
                    return (
                      <div key={m.id} className={cx("flex max-w-[80%] flex-col gap-1.5", mine && "ml-auto items-end")}>
                        <p className="text-xs text-tertiary">
                          {mine ? "You" : selectedContact.full_name || selectedContact.email} ·{" "}
                          {new Date(m.created_at).toLocaleString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p
                          className={cx(
                            "rounded-lg px-3.5 py-2.5 text-md whitespace-pre-wrap",
                            mine
                              ? "rounded-tr-none bg-brand-solid text-white"
                              : "rounded-tl-none bg-secondary text-primary ring-1 ring-secondary ring-inset",
                          )}
                        >
                          {m.body}
                        </p>
                      </div>
                    );
                  })}
                  {thread.length === 0 && (
                    <EmptyState icon={MessageChatCircle} title="No messages yet" description="Say hello below." />
                  )}
                </div>
                <form action={sendMessage} className="flex items-start gap-3 border-t border-secondary px-4 py-4 sm:px-6">
                  <input type="hidden" name="recipient_id" value={selectedContact.id} />
                  <Input name="body" isRequired aria-label="Message" placeholder="Type a message..." className="flex-1" />
                  <SubmitButton size="md" pendingText="Sending..." iconTrailing={<Send01 data-icon className="size-5" />}>
                    Send
                  </SubmitButton>
                </form>
              </>
            ) : (
              <EmptyState
                icon={MessageChatCircle}
                title="No conversation selected"
                description="Choose a contact on the left to start a conversation."
              />
            )}
          </section>
        </Card>
      </Reveal>
    </div>
  );
}
