import { Spinner } from "@/components/spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-primary">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
