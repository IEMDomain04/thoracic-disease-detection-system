import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ImageIcon, ZoomIn, ZoomOut, Maximize2, Eye, EyeOff, Upload } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';

export function ClassificationOutput({ 
  imageSrc, 
  prediction, 
  loading,
  selectedFile,
  fileInputRef,
  handleFileChange,
  handleClassify 
}) {
  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);

  // Heatmap toggle state
  const [showHeatmap, setShowHeatmap] = useState(true);
  
  const openFileDialog = () => fileInputRef.current?.click();

  // Extract prediction values with defaults
  const predictedClass = prediction?.prediction || prediction?.class || '--';
  const confidence = prediction?.confidence != null ? Number(prediction.confidence) : null;

  // Use backend preview image if available, otherwise fall back to imageSrc
  // Toggle between heatmap and original based on showHeatmap state
  const hasHeatmapData = prediction?.has_heatmap && prediction?.preview_image && prediction?.original_image;
  const displayImage = hasHeatmapData 
    ? (showHeatmap ? prediction.preview_image : prediction.original_image)
    : (prediction?.preview_image || imageSrc);

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

  // Add wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    const wheelHandler = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(Math.max(0.5, prev + delta), 5));
    };

    container.addEventListener('wheel', wheelHandler, { passive: false });

    return () => {
      container.removeEventListener('wheel', wheelHandler);
    };
  }, []);

  // Zoom and pan handlers
  const handleMouseDown = (e) => {
    if (!displayImage) return;
    
    // Start panning
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      // Pan the image
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const toggleHeatmap = () => {
    setShowHeatmap(!showHeatmap);
  };
  
  return (
    <div className="w-full h-full flex gap-4">
      {/* Left Sidebar - Controls and Info - Scrollable */}
      <div className="w-72 flex-shrink-0 overflow-y-auto overflow-x-hidden space-y-3 pr-2" style={{ maxHeight: '100%' }}>
        
        {/* Classification Results - Only show after classification */}
        {prediction && (
          <div className="p-3 bg-gradient-to-b from-[#1E3A8A] via-[#1F2937] to-[#111827] rounded-lg border border-[#374151]">
            <div className="space-y-3">
              {/* Prediction */}
              <div>
                <p className="text-xs text-[#9CA3AF] mb-1.5">Prediction:</p>
                <Badge 
                  variant="outline" 
                  className={`text-xs px-2 py-1 font-semibold ${badgeColor} w-full justify-center`}
                >
                  {predictedClass}
                </Badge>
              </div>
              
              {/* Confidence Score */}
              <div>
                <p className="text-xs text-[#9CA3AF] mb-1.5">Confidence:</p>
                <div className="flex items-center gap-2">
                  <span className="text-base text-[#E5E7EB] font-bold min-w-14">
                    {confPercent != null ? `${confPercent}%` : '--%'}
                  </span>
                  <div className="flex-1 bg-[#374151] rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`${progressBarColor} h-full rounded-full transition-all duration-500`}
                      style={{ width: confPercent != null ? `${confPercent}%` : '0%' }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Status Banners */}
        {imageSrc && !prediction && !loading && (
          <div className="p-2 bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 rounded-lg">
            <p className="text-xs text-[#38BDF8] text-center leading-relaxed">
              📷 <strong>Preview Mode</strong><br/>Click Classify to analyze
            </p>
          </div>
        )}
        
        {loading && (
          <div className="p-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg">
            <p className="text-xs text-[#F59E0B] text-center leading-relaxed">
              ⏳ <strong>Processing...</strong><br/>{prediction ? 'Analyzing' : 'Loading preview'}
            </p>
          </div>
        )}
        
        {/* Upload Controls */}
        <div className="p-3 bg-[#1F2937] rounded-lg border border-[#374151] space-y-2">
          <h3 className="text-xs font-semibold text-[#E5E7EB] mb-2">Upload Image</h3>
          
          <input
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            type="file"
            accept=".jpg,.jpeg,.png,.mha"
            aria-label="Choose X-ray image"
          />
          
          {selectedFile && (
            <div className="p-1.5 bg-[#111827] rounded border border-[#374151]">
              <p className="text-[10px] text-[#9CA3AF]">Selected:</p>
              <p className="text-xs text-[#E5E7EB] truncate font-medium">
                {selectedFile.name}
              </p>
            </div>
          )}
          
          <Button 
            className="w-full bg-[#0EA5E9] text-white hover:bg-[#0d96d4] active:scale-90 cursor-pointer h-8 text-xs" 
            onClick={openFileDialog}
          >
            <Upload className="h-3 w-3 mr-1.5" />
            Choose File
          </Button>
          
          <Button
            className="w-full bg-[#14B8A6] hover:bg-[#10A39B] active:scale-90 text-white font-medium cursor-pointer h-8 text-xs"
            onClick={handleClassify}
            disabled={!selectedFile || loading}
          >
            {loading ? "Analyzing..." : "Classify"}
          </Button>
        </div>
        
        {/* Zoom Controls - Only show when image loaded */}
        {displayImage && (
          <div className="p-3 bg-[#1F2937] rounded-lg border border-[#374151] space-y-1.5">
            <h3 className="text-xs font-semibold text-[#E5E7EB] mb-2">View Controls</h3>
            
            <Button
              onClick={handleZoomIn}
              size="sm"
              variant="outline"
              className="w-full bg-[#1F2937] border-[#374151] text-[#E5E7EB] hover:bg-[#374151] hover:text-white active:scale-90 justify-start h-8 text-xs cursor-pointer"
            >
              <ZoomIn className="h-3 w-3 mr-1.5" />
              Zoom In
            </Button>
            
            <Button
              onClick={handleZoomOut}
              size="sm"
              variant="outline"
              className="w-full bg-[#1F2937] border-[#374151] text-[#E5E7EB] hover:bg-[#374151] hover:text-white active:scale-90 justify-start h-8 text-xs cursor-pointer"
            >
              <ZoomOut className="h-3 w-3 mr-1.5" />
              Zoom Out
            </Button>
            
            <Button
              onClick={handleReset}
              size="sm"
              variant="outline"
              className="w-full bg-[#1F2937] border-[#374151] text-[#E5E7EB] hover:bg-[#374151] hover:text-white active:scale-90 justify-start h-8 text-xs cursor-pointer"
            >
              <Maximize2 className="h-3 w-3 mr-1.5" />
              Reset View
            </Button>
            
            {hasHeatmapData && (
              <>
                <div className="h-px bg-[#374151] my-2"></div>
                <Button
                  onClick={toggleHeatmap}
                  size="sm"
                  variant="outline"
                  className={`w-full justify-start h-8 text-xs cursor-pointer active:scale-90 ${
                    showHeatmap 
                      ? 'bg-[#EF4444] border-[#EF4444] text-white hover:bg-[#DC2626]' 
                      : 'bg-[#10B981] border-[#10B981] text-white hover:bg-[#059669]'
                  }`}
                >
                  {showHeatmap ? (
                    <>
                      <Eye className="h-3 w-3 mr-1.5" />
                      Show Original
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3 mr-1.5" />
                      Show Heatmap
                    </>
                  )}
                </Button>
              </>
            )}
            
            <div className="pt-1.5 text-center">
              <span className="text-[10px] text-[#9CA3AF]">
                Zoom: <span className="font-semibold text-[#E5E7EB]">{Math.round(zoom * 100)}%</span>
              </span>
            </div>
          </div>
        )}
        
        {/* Heatmap Status - Only show after classification */}
        {hasHeatmapData && displayImage && prediction && (
          <div className="p-2 bg-[#374151]/30 border border-[#374151] rounded-lg">
            <p className="text-[10px] text-[#E5E7EB] text-center leading-relaxed">
              {showHeatmap ? (
                <>
                  🔴 <strong>Heatmap View</strong><br/>
                  <span className="text-[#9CA3AF]">Red/yellow areas show attention</span>
                </>
              ) : (
                <>
                  ⚪ <strong>Original View</strong><br/>
                  <span className="text-[#9CA3AF]">Unmodified X-ray</span>
                </>
              )}
            </p>
          </div>
        )}
      </div>
      
      {/* Right Side - Image Display (Takes remaining space) */}
      <div className="flex-1 flex flex-col min-w-0">
        <div 
          ref={imageContainerRef}
          className="relative w-full h-full bg-[#111827] rounded-lg border border-[#374151] flex items-center justify-center overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ 
            cursor: isDragging ? 'grabbing' : displayImage ? 'grab' : 'default'
          }}
        >
          {displayImage ? (
            <img 
              src={displayImage} 
              alt="X-ray preview" 
              className="w-full h-full object-contain select-none"
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
              draggable={false}
            />
          ) : (
            <div className="text-center">
              <ImageIcon className="mx-auto h-24 w-24 text-[#38BDF8] mb-3" />
              <p className="text-base text-[#E5E7EB] font-medium">
                No image uploaded yet
              </p>
              <p className="text-sm text-[#9CA3AF] mt-2">
                Use "Choose File" button to upload a chest X-ray or MHA file
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
