export default function AdminCustomersLoading() {
  return (
    <div className="space-y-6" aria-label="Loading customers" role="status">
      <div className="space-y-2">
        <div className="h-3 w-40 animate-pulse bg-ivory-300" />
        <div className="h-9 w-56 animate-pulse bg-ivory-300" />
        <div className="h-4 w-72 animate-pulse bg-ivory-200" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-20 animate-pulse border border-ivory-300 bg-ivory-100" />
        <div className="h-20 animate-pulse border border-ivory-300 bg-ivory-100" />
      </div>
      <div className="h-72 animate-pulse border border-ivory-300 bg-ivory-100" />
    </div>
  );
}
