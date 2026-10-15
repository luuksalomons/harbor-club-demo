import { requireProfile } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { initials } from "@/lib/initials";
import { updateOwnProfile } from "./actions";
import PasswordForm from "./password-form";
import { SubmitButton } from "@/components/submit-button";
import { Reveal } from "@/components/reveal";
import { Card, CardHeader } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Input } from "@/components/base/input/input";
import { NativeSelect } from "@/components/base/select/select-native";

const GENDERS = [
  { value: "", label: "Prefer not to say" },
  { value: "man", label: "Male" },
  { value: "vrouw", label: "Female" },
  { value: "anders", label: "Other" },
];

export default async function ProfilePage() {
  const profile = await requireProfile();

  const displayName = profile.full_name || profile.email;

  return (
    <div>
      <PageHeader title="My Profile" description="Update your personal details and password." />

      <Reveal>
        <Card className="mb-8 flex items-center gap-4 p-4 sm:p-6">
          <Avatar size="xl" initials={initials(displayName)} alt={displayName} />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-primary">{displayName}</p>
            <p className="truncate text-sm text-tertiary">{profile.email}</p>
          </div>
          <Badge type="pill-color" color="brand" size="md" className="ml-auto max-sm:hidden">
            {ROLE_LABELS[profile.role]}
          </Badge>
        </Card>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Reveal>
          <Card as="section">
            <CardHeader title="Personal details" description="Shown to other members of the club." />
            <form action={updateOwnProfile} className="space-y-4 p-4 sm:p-6">
              <Input name="full_name" label="Name" defaultValue={profile.full_name} />
              <Input
                name="age"
                label="Age"
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                defaultValue={profile.age != null ? String(profile.age) : ""}
              />
              <NativeSelect name="gender" label="Gender" defaultValue={profile.gender ?? ""} options={GENDERS} />
              <div className="flex justify-end">
                <SubmitButton size="md" pendingText="Saving...">
                  Save
                </SubmitButton>
              </div>
            </form>
          </Card>
        </Reveal>

        <Reveal delayMs={80}>
          <Card as="section">
            <CardHeader title="Password" description="Use at least 8 characters." />
            <div className="p-4 sm:p-6">
              <PasswordForm />
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
