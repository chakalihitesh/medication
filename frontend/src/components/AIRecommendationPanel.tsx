import { Sparkles, MapPin, CheckCircle, Navigation } from 'lucide-react';

interface AIRecommendationPanelProps {
  recommendations: any[];
  onSelectHospital: (hosp: any) => void;
}

export function AIRecommendationPanel({ recommendations, onSelectHospital }: AIRecommendationPanelProps) {
  if (!recommendations || recommendations.length === 0) return null;

  // Display only top 3 recommendations
  const topRecs = recommendations.slice(0, 3);

  return (
    <div className="bg-gradient-to-r from-blue-50/80 to-[#e3f2f5]/80 p-5 rounded-3xl border border-blue-100 shadow-sm flex flex-col gap-4 animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="w-5 h-5 text-amber-500 fill-current animate-pulse" />
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider leading-none">
          AI Smart Recommendations
        </h3>
      </div>

      <div className="flex flex-col gap-3">
        {topRecs.map((rec, index) => {
          const score = rec.recommendation_score || 70;
          let rankLabel = 'Best Match';
          if (index === 1) rankLabel = 'Alternative Match';
          if (index === 2) rankLabel = 'Nearby Choice';

          return (
            <div
              key={rec.id}
              onClick={() => onSelectHospital(rec)}
              className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-4 items-start hover:border-primary/40 group relative overflow-hidden"
            >
              {/* Top corner match rank badge */}
              <div className="absolute top-2 right-2 bg-primary/5 text-primary text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {rankLabel}
              </div>

              {/* AI Score Circular Gauge */}
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex flex-col items-center justify-center shrink-0 border border-blue-100/50">
                <span className="text-[14px] font-black text-primary leading-none">{score}</span>
                <span className="text-[8px] font-bold text-[#00687a] uppercase tracking-wide mt-0.5">Match</span>
              </div>

              {/* Text justification */}
              <div className="flex-1 flex flex-col gap-1 min-w-0 pr-16">
                <h4 className="text-xs font-extrabold text-[#0f172a] group-hover:text-primary transition-colors line-clamp-1">
                  {rec.name}
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-600 line-clamp-2">
                  {rec.recommendation_reason || `${rec.name} is recommended for your healthcare needs.`}
                </p>
                
                <div className="flex items-center gap-3 mt-1 text-[10px] text-outline font-semibold">
                  <span className="flex items-center gap-1">
                    <MapPin size={10} className="text-primary" /> {rec.distance}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle size={10} className="text-secondary" /> {rec.ai_classification?.specialty}
                  </span>
                </div>
              </div>

              {/* Quick Navigation action */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectHospital(rec);
                }}
                className="self-center p-2 bg-slate-50 border border-slate-200 rounded-full hover:bg-primary hover:text-white hover:border-primary active:scale-95 transition-all text-slate-500 shrink-0"
                title="View on Map"
              >
                <Navigation size={14} className="fill-current rotate-45" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
