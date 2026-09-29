export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-10 w-56 rounded-xl bg-ink/[0.07]" />
      <div className="mt-3 h-5 w-72 rounded-lg bg-ink/[0.05]" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] rounded-2xl bg-ink/[0.06]" />
        ))}
      </div>
    </div>
  );
}
