import { requireProfile } from "@/lib/auth";
import { requireFeatureEnabled } from "@/lib/features";
import { createClient } from "@/lib/supabase/server";
import { createNewsPost, deleteNewsPost } from "./actions";
import { SubmitButton } from "@/components/submit-button";

export default async function NieuwsPage() {
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
      <h1 className="mb-6 text-2xl font-semibold text-primary">Nieuws</h1>

      {canPost && (
        <form
          action={createNewsPost}
          className="mb-8 space-y-3 rounded-lg border border-border bg-background p-4"
        >
          <input
            name="title"
            required
            placeholder="Titel"
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Bericht..."
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <SubmitButton
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            pendingText="Bezig..."
          >
            Plaatsen
          </SubmitButton>
        </form>
      )}

      <div className="space-y-4">
        {posts?.length ? (
          posts.map((post) => {
            const author = post.profiles as unknown as { full_name: string } | null;
            const canDelete = profile.role === "admin" || post.author_id === profile.id;
            return (
              <article
                key={post.id}
                className="rounded-lg border border-border bg-background p-4"
              >
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="font-medium">{post.title}</h2>
                  {canDelete && (
                    <form action={deleteNewsPost}>
                      <input type="hidden" name="id" value={post.id} />
                      <SubmitButton className="text-xs text-primary-dark hover:underline" pendingText="Bezig...">
                        Verwijderen
                      </SubmitButton>
                    </form>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground/80">{post.body}</p>
                <p className="mt-2 text-xs text-foreground/50">
                  {author?.full_name ?? "Onbekend"} ·{" "}
                  {new Date(post.created_at).toLocaleString("nl-NL")}
                </p>
              </article>
            );
          })
        ) : (
          <p className="text-foreground/60">Nog geen nieuws geplaatst.</p>
        )}
      </div>
    </div>
  );
}
