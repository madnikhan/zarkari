export function CmsOwnerBanner({ isOwner }: { isOwner: boolean }) {
  if (isOwner) return null;
  return (
    <p className="mb-4 text-sm bg-amber-50 text-amber-900 border border-amber-200 rounded-lg px-4 py-3">
      View only — only owners can save content changes.
    </p>
  );
}
