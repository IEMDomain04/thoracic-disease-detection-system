import { Card } from './ui/card';
import { Activity } from 'lucide-react';

export function Header() {
  return (
    <div className="border-b px-6 py-4 bg-gradient-to-b from-[#1E3A8A] via-[#1F2937] to-[#111827] text-[#F9FAFB]">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0EA5E9]/10 rounded-lg">
            <Activity className="h-6 w-6 text-[#38BDF8]" />
          </div>
          <div>
            <h1 className="text-[#F9FAFB] font-semibold text-xl">
              Lung Nodule Detection System
            </h1>
            <p className="text-sm text-[#9CA3AF]">
              AI-powered chest X-ray analysis with attention visualization
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
