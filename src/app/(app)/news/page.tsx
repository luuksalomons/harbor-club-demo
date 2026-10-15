import { Announcement02 } from "@untitledui/icons";
import { requireProfile } from "@/lib/auth";
import { requireFeatureEnabled } from "@/lib/features";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/initials";
import { createNewsPost, deleteNewsPost } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { Reveal } from "@/components/reveal";
import { Card, CardHeader } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Avatar } from "@/components/base/avatar/avatar";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";

export default async function NewsPage() {
  const profile = await requireProfile();
  await requireFeatureEnabled("nieuws");
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("news_posts")
    .select("id, title, body, created_at, author_id, profiles(full_name)")
    .order("created_at", { ascending: false });

  const canPost = profile.role === "docent" || profile.role === "admin";

  return (
    <div>
      <PageHeader title="News" description="Announcements and updates from the club." />

      <div className={canPost ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start" : "max-w-3xl"}>
        {canPost && (
          <Reveal className="lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
            <Card as="section">
              <CardHeader title="New post" description="Visible to all members." />
              <form action={createNewsPost} className="space-y-4 p-4 sm:p-6">
                <Input name="title" label="Title" isRequired placeholder="e.g. Summer regatta" />
                <TextArea name="body" label="Message" isRequired rows={4} placeholder="Write your announcement..." />
                <SubmitButton size="md" className="w-full" pendingText="Posting...">
                  Post
                </SubmitButton>
              </form>
            </Card>
          </Reveal>
        )}
        <div className="space-y-4 lg:col-start-1 lg:row-start-1">
          {posts?.length ? (
            posts.map((post, i) => {
              const author = post.profiles as unknown as { full_name: string } | null;
              const authorName = author?.full_name ?? "Unknown";
              const canDelete = profile.role === "admin" || post.author_id === profile.id;
              return (
                <Reveal key={post.id} delayMs={Math.min(i, 5) * 60}>
                  <Card as="article" className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar size="md" initials={initials(authorName)} alt={authorName} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-primary">{authorName}</p>
                          <p className="text-sm text-tertiary">
                            {new Date(post.created_at).toLocaleString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      {canDelete && (
                        <form action={deleteNewsPost}>
                          <input type="hidden" name="id" value={post.id} />
                          <SubmitButton color="link-destructive" size="sm" pendingText="Deleting...">
                            Delete
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-primary">{post.title}</h2>
                    <p className="mt-1 text-md whitespace-pre-wrap text-tertiary">{post.body}</p>
                  </Card>
                </Reveal>
              );
            })
          ) : (
            <Card>
              <EmptyState icon={Announcement02} title="No news yet" description="No news posted yet." />
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
