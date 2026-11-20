import SiteLayout from "./(site)/layout";
import NotFoundContent from "./(site)/not-found";

/** Unmatched URLs render the ink-spill 404 inside the normal site chrome. */
export default function NotFound() {
  return (
    <SiteLayout>
      <NotFoundContent />
    </SiteLayout>
  );
}
