import { Card } from "./ui/card";
import { Activity } from "lucide-react";

export function Header() {
  return (
    <div className="border-b px-4 py-2 bg-linear-to-b from-[#1E3A8A] via-[#1F2937] to-[#111827] text-[#F9FAFB] shrink-0">
      <div className="max-w-[1800px] mx-auto flex items-center">
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
          {/* <a
            href="https://drive.google.com/drive/folders/11uO51vWaSYIAp_i9ECxfg6f3l6z-oRJt?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="btn border border-e-blue-300 rounded cursor-pointer bg-blue-900 px-3 py-1 ml-10 inline-block"
          >
            Select image [.mha]
          </a> */}
        </div>
      </div>
    </div>
  );
}
