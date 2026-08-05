import { requireProfile } from "@/lib/auth";
import { updateOwnProfile } from "./actions";
import PasswordForm from "./password-form";
import { SubmitButton } from "@/components/submit-button";

const GENDERS = [
  { value: "", label: "Zeg ik liever niet" },
  { value: "man", label: "Man" },
  { value: "vrouw", label: "Vrouw" },
  { value: "anders", label: "Anders" },
];

export default async function ProfielPage() {
  const profile = await requireProfile();

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold text-primary">Mijn profiel</h1>

      <section>
        <h2 className="mb-3 font-medium">Persoonlijke gegevens</h2>
        <form action={updateOwnProfile} className="max-w-sm space-y-3">
          <div>
            <label htmlFor="full_name" className="mb-1 block text-sm font-medium">
              Naam
            </label>
            <input
              id="full_name"
              name="full_name"
              defaultValue={profile.full_name}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="age" className="mb-1 block text-sm font-medium">
              Leeftijd
            </label>
            <input
              id="age"
              name="age"
              type="number"
              min={0}
              max={120}
              defaultValue={profile.age ?? ""}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="gender" className="mb-1 block text-sm font-medium">
              Geslacht
            </label>
            <select
              id="gender"
              name="gender"
              defaultValue={profile.gender ?? ""}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            >
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <SubmitButton
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            pendingText="Bezig..."
          >
            Opslaan
          </SubmitButton>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-medium">Wachtwoord</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
