import { Star, Navigation, Shield, Users, Award, Heart, HelpCircle, Activity } from 'lucide-react';

interface HospitalCardProps {
  hospital: any;
  isSelected: boolean;
  onSelect: () => void;
}

const SPECIALTY_ICONS: Record<string, any> = {
  Cardiology: Heart,
  Neurology: Activity,
  Orthopedic: Award,
  Pediatrics: Users,
  Emergency: Shield,
  'General Hospital': Shield,
};

export function HospitalCard({ hospital, isSelected, onSelect }: HospitalCardProps) {
  const ai = hospital.ai_classification || {
    specialty: 'General Hospital',
    emergency_support: false,
    crowd_level: 'Medium',
    recommendation_score: 70,
  };

  const SpecialtyIcon = SPECIALTY_ICONS[ai.specialty] || Shield;

  // Color mappings
  const crowdColors: Record<string, string> = {
    Low: 'bg-green-100 text-green-700 border-green-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    High: 'bg-red-100 text-red-700 border-red-200',
  };

  const crowdLevelColor = crowdColors[ai.crowd_level] || crowdColors.Medium;

  return (
    <div
      onClick={onSelect}
      className={`bg-surface-container-lowest p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row gap-4 relative overflow-hidden ${
        isSelected
          ? 'border-primary shadow-lg bg-primary-fixed/5 ring-1 ring-primary'
          : 'border-surface-variant/20 hover:border-outline/40 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Cluster Indicator Tag */}
      {hospital.cluster_id !== undefined && (
        <div 
          className="absolute top-0 right-0 px-3 py-1 text-[9px] font-bold text-white rounded-bl-xl uppercase tracking-wider"
          style={{
            backgroundColor: [
              '#ef4444', // Red
              '#3b82f6', // Blue
              '#10b981', // Green
              '#8b5cf6', // Purple
              '#f59e0b', // Amber
            ][hospital.cluster_id % 5]
          }}
        >
          Zone {hospital.cluster_id + 1}
        </div>
      )}

      {/* Main Details Section */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-4">
            <h4 className="text-base font-bold text-on-surface leading-snug line-clamp-1 pr-12">
              {hospital.name}
            </h4>
          </div>
          
          <p className="text-xs text-on-surface-variant mt-1.5 leading-normal">
            {hospital.address}
          </p>

          {/* AI Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {/* Specialty Badge */}
            <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-200/50 rounded-xl">
              <SpecialtyIcon size={14} className="text-primary shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold text-outline uppercase tracking-wider leading-none">Specialty</span>
                <span className="text-[10px] font-bold text-on-surface truncate mt-0.5">{ai.specialty}</span>
              </div>
            </div>

            {/* Emergency Support Status */}
            <div className={`flex items-center gap-1.5 p-2 border rounded-xl ${
              ai.emergency_support 
                ? 'bg-red-50/50 border-red-200/50 text-red-700' 
                : 'bg-slate-50 border-slate-200/50 text-slate-500'
            }`}>
              <Shield size={14} className="shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold text-outline uppercase tracking-wider leading-none">24/7 ER</span>
                <span className="text-[10px] font-bold truncate mt-0.5">
                  {ai.emergency_support ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>

            {/* Crowd Level */}
            <div className={`flex items-center gap-1.5 p-2 border rounded-xl ${crowdLevelColor}`}>
              <Users size={14} className="shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider leading-none opacity-85">Crowd Level</span>
                <span className="text-[10px] font-bold truncate mt-0.5">{ai.crowd_level}</span>
              </div>
            </div>

            {/* AI Recommendation Score */}
            <div className="flex items-center gap-1.5 p-2 bg-blue-50/50 border border-blue-200/50 rounded-xl text-[#0052cc]">
              <Star size={14} className="fill-current shrink-0 text-amber-500" />
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold text-outline uppercase tracking-wider leading-none">AI Score</span>
                <span className="text-[10px] font-extrabold truncate mt-0.5">{ai.recommendation_score}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4 text-xs">
            {hospital.distance && (
              <span className="font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">
                {hospital.distance} away
              </span>
            )}
            <span className="text-outline font-medium text-[11px]">
              Rating: <strong className="text-on-surface font-semibold">{hospital.rating || 'N/A'}</strong>
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const dest = encodeURIComponent(`${hospital.name}, ${hospital.address}`);
              window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${dest}&destination_place_id=${hospital.id}`,
                '_blank'
              );
            }}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 px-3 py-1.5 bg-primary/5 rounded-xl border border-primary/10 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Directions</span>
          </button>
        </div>
      </div>
    </div>
  );
}
