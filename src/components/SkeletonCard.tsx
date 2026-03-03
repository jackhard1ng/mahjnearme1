export default function SkeletonCard() {
  return (
    <div className="mahj-tile overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-hotpink-300 via-skyblue-300 to-hotpink-300 animate-shimmer" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="w-20 h-5 rounded-full animate-shimmer" />
          <div className="w-24 h-5 rounded-full animate-shimmer" />
        </div>
        <div className="w-3/4 h-6 rounded animate-shimmer" />
        <div className="w-1/3 h-4 rounded animate-shimmer" />
        <div className="space-y-2 pt-2">
          <div className="w-full h-4 rounded animate-shimmer" />
          <div className="w-2/3 h-4 rounded animate-shimmer" />
          <div className="w-1/4 h-4 rounded animate-shimmer" />
        </div>
      </div>
      <div className="px-4 py-3 border-t border-slate-200">
        <div className="w-32 h-4 rounded animate-shimmer" />
      </div>
    </div>
  );
}
