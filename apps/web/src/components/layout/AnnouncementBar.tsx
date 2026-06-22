export function AnnouncementBar({ message }: { message: string }) {
  return (
    <div className="bg-gold text-charcoal text-center text-xs tracking-[0.2em] uppercase py-2.5 px-4">
      {message}
    </div>
  );
}
