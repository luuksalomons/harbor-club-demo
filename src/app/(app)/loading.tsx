import { Spinner } from "@/components/spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-fg-brand-primary">
      <Spinner className="size-8" />
    </div>
  );
}
