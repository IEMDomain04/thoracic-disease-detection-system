import { Card } from './ui/card';
import { Activity } from 'lucide-react';

export function Header() {
  return (
    <div className="border-b px-4 py-2 bg-gradient-to-b from-[#1E3A8A] via-[#1F2937] to-[#111827] text-[#F9FAFB] flex-shrink-0">
      <div className="max-w-[1800px] mx-auto flex items-center justify-center">
        
        {/* Title - Compact */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#0EA5E9]/10 rounded-lg">
            <Activity className="h-5 w-5 text-[#38BDF8]" />
          </div>
          <div>
            <h1 className="text-[#F9FAFB] font-semibold text-base">
              Lung Nodule Detection System
            </h1>
            <p className="text-xs text-[#9CA3AF]">
              AI-powered chest X-ray analysis with attention visualization
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
