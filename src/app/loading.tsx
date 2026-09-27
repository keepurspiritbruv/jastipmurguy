export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-stone-100">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      <p className="text-sm font-medium text-stone-500">Memuat...</p>
    </div>
  );
}
