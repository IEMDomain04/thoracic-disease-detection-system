import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ImageIcon } from 'lucide-react';

export function ClassificationOutput({ type }) {
  const isOriginal = type === 'original';
  
  return (
    <Card className="bg-gradient-to-b from-[#1E3A8A] via-[#1F2937] to-[#111827] text-[#F9FAFB] border-none shadow-lg w-full max-w-6xl mx-auto">

      <CardHeader>
        <CardTitle className="text-[#F9FAFB] text-xl">
          {isOriginal ? 'Original X-ray Image' : 'Grad-CAM Visualization'}
        </CardTitle>
        <CardDescription className="text-[#9CA3AF]">
          {isOriginal 
            ? 'Uploaded chest X-ray for analysis' 
            : 'Heatmap showing model focus areas'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center">
        
        {/* Image Display Area */}
        <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#111827] rounded-lg border border-[#374151] flex items-center justify-center mb-6">
          <div className="text-center">
            <ImageIcon className="mx-auto h-24 w-24 text-[#38BDF8] mb-3" />
            <p className="text-sm text-[#E5E7EB]">
              {isOriginal ? 'Original X-ray' : 'Grad-CAM Heatmap'}
            </p>
          </div>
          {!isOriginal && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40">
                Heatmap
              </Badge>
            </div>
          )}
        </div>

        {/* Classification Results */}
          <div className="w-full max-w-4xl space-y-4 pt-4 border-t border-[#374151]">
            <div>
              <p className="text-sm text-[#E5E7EB] mb-1">Prediction:</p>
              <Badge variant="outline" className="text-base px-4 py-1 text-[#38BDF8] border-[#38BDF8]/50">
                --
              </Badge>
            </div>
            
            <div>
              <p className="text-sm text-[#E5E7EB] mb-2">Confidence Score:</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[#374151] rounded-full h-3 overflow-hidden">
                  <div className="bg-[#38BDF8] h-full rounded-full transition-all" style={{ width: '0%' }} />
                </div>
                <span className="text-sm text-[#9CA3AF] min-w-12">--%</span>
              </div>
            </div>
          </div>

      </CardContent>
    </Card>
  );
}
