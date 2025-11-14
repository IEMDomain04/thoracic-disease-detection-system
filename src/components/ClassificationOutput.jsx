import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ImageIcon } from 'lucide-react';

export function ClassificationOutput({ imageSrc, prediction }) {
  // Extract prediction values with defaults
  const predictedClass = prediction?.prediction || prediction?.class || '--';
  const confidence = prediction?.confidence != null ? Number(prediction.confidence) : null;

  // Use backend preview image if available, otherwise fall back to imageSrc
  const displayImage = prediction?.preview_image || imageSrc;

  // Normalize confidence to percentage (handle both 0-1 and 0-100 formats)
  // Keep a numeric value for clamping and a formatted string with 2 decimals
  const confPercentNumber = confidence != null
    ? (confidence > 1 ? confidence : confidence * 100)
    : null;
  const confPercentClamped = confPercentNumber != null ? Math.max(0, Math.min(100, confPercentNumber)) : null;
  const confPercent = confPercentClamped != null ? confPercentClamped.toFixed(2) : null;
  
  // Determine if nodule is detected (case-insensitive check)
  const hasNodule = predictedClass.toLowerCase().includes('nodule') && 
                    !predictedClass.toLowerCase().includes('no nodule');
  
  // Set color based on prediction
  const badgeColor = predictedClass === '--' 
    ? 'text-[#9CA3AF] border-[#9CA3AF]/50' 
    : hasNodule 
      ? 'text-red-400 bg-red-400/10 border-red-400/50' 
      : 'text-green-400 bg-green-400/10 border-green-400/50';
  
  const progressBarColor = hasNodule ? 'bg-red-400' : 'bg-green-400';
  
  return (
    <Card className="bg-gradient-to-b from-[#1E3A8A] via-[#1F2937] to-[#111827] text-[#F9FAFB] border-none shadow-lg w-full max-w-6xl mx-auto">

      <CardHeader>
        <CardTitle className="text-[#F9FAFB] text-xl">
          Classification Results
        </CardTitle>
        <CardDescription className="text-[#9CA3AF]">
          X-ray analysis and prediction output
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center">

        {/* Classification Results */}
        <div className="w-full max-w-4xl space-y-4 pt-4 border-t border-[#374151]">
          <div>
            <p className="text-sm text-[#E5E7EB] mb-1">Prediction:</p>
            <Badge 
              variant="outline" 
              className={`text-base px-4 py-1 font-semibold ${badgeColor}`}
            >
              {predictedClass}
            </Badge>
          </div>
          
          
          <div>
            <p className="text-sm text-[#E5E7EB] mb-2">Confidence Score:</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#374151] rounded-full h-3 overflow-hidden">
                <div 
                  className={`${progressBarColor} h-full rounded-full transition-all duration-500`}
                  style={{ width: confPercent != null ? `${confPercent}%` : '0%' }} 
                />
              </div>
              <span className="text-sm text-[#9CA3AF] min-w-12 font-medium">
                {confPercent != null ? `${confPercent}%` : '--%'}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-4xl space-y-10 my-5 border-t border-[#FFFFFF]"></div>
        
        {/* Image Display Area */}
        <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#111827] rounded-lg border border-[#374151] flex items-center justify-center mb-6 overflow-hidden">
          {displayImage ? (
            <img 
              src={displayImage} 
              alt="X-ray preview" 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center">
              <ImageIcon className="mx-auto h-24 w-24 text-[#38BDF8] mb-3" />
              <p className="text-sm text-[#E5E7EB]">
                No image uploaded yet
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
