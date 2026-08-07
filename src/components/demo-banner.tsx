export function DemoBanner() {
  return (
    <div className="bg-accent px-4 py-2 text-center text-xs font-medium text-primary-dark sm:text-sm">
      This is a live demo — all data resets automatically every night. Interested in this for your
      organization?{" "}
      <a
        href="https://www.fiverr.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:no-underline"
      >
        Get in touch
      </a>
      .
    </div>
  );
}
