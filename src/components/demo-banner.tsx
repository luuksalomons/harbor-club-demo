export function DemoBanner() {
  return (
    <div className="border-b border-accent/30 bg-accent/15 px-4 py-2.5 text-center text-sm text-primary">
      <span className="mr-2 inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
        Live demo
      </span>
      All data resets automatically every night. Interested in this for your organization?{" "}
      <a
        href="mailto:mail@absoluukt.nl?subject=Harbor%20Club%20demo%20portal"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-brand-secondary underline decoration-transparent underline-offset-2 hover:decoration-current"
      >
        Get in touch
      </a>
    </div>
  );
}
