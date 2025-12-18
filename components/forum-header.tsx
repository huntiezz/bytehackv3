export function ForumHeader() {
  return (
    <div className="relative w-full bg-gradient-to-r from-black via-black/95 to-black/90 border-b border-white/10">
      {/* Diagonal stripe pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,.03) 40px, rgba(255,255,255,.03) 80px)'
        }} />
      </div>

      {/* Content - Left aligned */}
      <div className="relative px-8 md:px-12 py-8 md:py-10">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
          FORUM
        </h1>
        <p className="text-white/60 text-xs md:text-sm font-medium max-w-2xl">
          Community discussions and technical knowledge
        </p>
      </div>
    </div>
  );
}
