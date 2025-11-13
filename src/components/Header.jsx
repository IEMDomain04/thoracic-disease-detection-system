import { Card } from './ui/card';
import { Activity } from 'lucide-react';

// Parang maganda rin itong color na to. bg-gradient-to-b from-[#374151] to-[#1F2937]

export function Header() {
  return (
      <div className="border px-20 py-10 bg-gradient-to-b from-[#0EA5E9] via-[#1F2937] to-[#111827]">
        <div className="flex items-center gap-3">

          {/* Icon */}
          <div className="p-2 bg-[#0EA5E9]/10 rounded-lg">
            <Activity className="h-6 w-6 text-[#38BDF8]" />
          </div>

          {/* Header: Title and Subtitle */}
          <div>
            <h1 className="text-[#F9FAFB] font-semibold">
              X-ray Classification System
            </h1>
            <p className="text-sm text-[#9CA3AF] mt-1">
              Upload, classify, and visualize medical images with Grad-CAM
            </p>
          </div>
        </div>
      </div>
  );
}
