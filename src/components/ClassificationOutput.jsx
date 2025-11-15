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
    <div className="w-full">
      {/* Classification Results Summary - Only show after classification */}
      {prediction && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-6 bg-gradient-to-b from-[#1E3A8A] via-[#1F2937] to-[#111827] rounded-xl border border-[#374151]">
          <div>
            <p className="text-sm text-[#E5E7EB] mb-2">Prediction:</p>
            <Badge 
              variant="outline" 
              className={`text-lg px-4 py-2 font-semibold ${badgeColor}`}
            >
              {predictedClass}
            </Badge>
          </div>
          
          <div>
            <p className="text-sm text-[#E5E7EB] mb-2">Confidence Score:</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#374151] rounded-full h-4 overflow-hidden">
                <div 
                  className={`${progressBarColor} h-full rounded-full transition-all duration-500`}
                  style={{ width: confPercent != null ? `${confPercent}%` : '0%' }} 
                />
              </div>
              <span className="text-base text-[#9CA3AF] min-w-16 font-medium">
                {confPercent != null ? `${confPercent}%` : '--%'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Preview Status Banner - Show when image selected but not classified */}
      {imageSrc && !prediction && !loading && (
        <div className="w-full mb-4 p-4 bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 rounded-lg">
          <p className="text-sm text-[#38BDF8] text-center">
            📷 <strong>Preview Mode:</strong> Image uploaded. Click "Classify" button to analyze for nodule detection.
          </p>
        </div>
      )}
      
      {/* Loading Banner - Show when processing */}
      {loading && (
        <div className="w-full mb-4 p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg">
          <p className="text-sm text-[#F59E0B] text-center">
            ⏳ <strong>Processing:</strong> {prediction ? 'Analyzing image...' : 'Loading preview...'}
          </p>
        </div>
      )}
      
      {/* Control Panel - Always visible */}
      <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 p-4 bg-[#1F2937] rounded-lg border border-[#374151]">
        {/* Left Side - Zoom and View Controls (only show when image is loaded) */}
        {displayImage && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleZoomIn}
              size="sm"
              variant="outline"
              className="bg-[#1F2937] border-[#374151] text-[#E5E7EB] hover:bg-[#374151] hover:text-white"
            >
              <ZoomIn className="h-4 w-4 mr-1" />
              Zoom In
            </Button>
            <Button
              onClick={handleZoomOut}
              size="sm"
              variant="outline"
              className="bg-[#1F2937] border-[#374151] text-[#E5E7EB] hover:bg-[#374151] hover:text-white"
            >
              <ZoomOut className="h-4 w-4 mr-1" />
              Zoom Out
            </Button>
            <Button
              onClick={handleReset}
              size="sm"
              variant="outline"
              className="bg-[#1F2937] border-[#374151] text-[#E5E7EB] hover:bg-[#374151] hover:text-white"
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              Reset
            </Button>
            {hasHeatmapData && (
              <>
                <div className="h-6 w-px bg-[#374151] mx-1"></div>
                <Button
                  onClick={toggleHeatmap}
                  size="sm"
                  variant="outline"
                  className={`${
                    showHeatmap 
                      ? 'bg-[#EF4444] border-[#EF4444] text-white hover:bg-[#DC2626]' 
                      : 'bg-[#10B981] border-[#10B981] text-white hover:bg-[#059669]'
                  }`}
                >
                  {showHeatmap ? (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Show Original
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Show Heatmap
                    </>
                  )}
                </Button>
              </>
            )}
            <div className="h-6 w-px bg-[#374151] mx-1"></div>
            <span className="text-sm text-[#9CA3AF] font-medium">
              Zoom: {Math.round(zoom * 100)}%
            </span>
          </div>
        )}
        
        {/* Right Side - Upload Controls (always visible) */}
        <div className="flex items-center gap-2 ml-auto">
          <input
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            type="file"
            accept=".jpg,.jpeg,.png,.mha"
            aria-label="Choose X-ray image"
          />
          
          {selectedFile && (
            <div className="text-right max-w-xs hidden lg:block">
              <p className="text-xs text-[#9CA3AF]">Selected:</p>
              <p className="text-xs text-[#E5E7EB] truncate font-medium">
                {selectedFile.name}
              </p>
            </div>
          )}
          
          <Button 
            className="bg-[#0EA5E9] text-white hover:bg-[#0d96d4] active:bg-[#0a74a3] cursor-pointer" 
            onClick={openFileDialog}
            size="sm"
          >
            <Upload className="h-4 w-4 mr-1" />
            Choose File
          </Button>
          
          <Button
            className="bg-[#14B8A6] hover:bg-[#10A39B] active:bg-[#0c7d77] text-white font-medium cursor-pointer"
            onClick={handleClassify}
            disabled={!selectedFile || loading}
            size="sm"
          >
            {loading ? "Analyzing..." : "Classify"}
          </Button>
        </div>
      </div>
      
      {/* Image Display Area - MAXIMIZED - Full available height */}
      <div 
        ref={imageContainerRef}
        className="relative w-full h-[82vh] bg-[#111827] rounded-lg border border-[#374151] flex items-center justify-center mb-4 overflow-hidden"
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
            <p className="text-sm text-[#E5E7EB]">
              No image uploaded yet
            </p>
            <p className="text-xs text-[#9CA3AF] mt-2">
              Use "Choose File" button above to upload a chest X-ray or MHA file
            </p>
          </div>
        )}
      </div>
      
      {/* Heatmap Status Indicator - Only show after classification */}
      {hasHeatmapData && displayImage && prediction && (
        <div className="w-full p-3 bg-[#374151]/30 border border-[#374151] rounded-lg">
          <p className="text-sm text-[#E5E7EB] text-center">
            {showHeatmap ? (
              <>
                🔴 <strong>Heatmap View:</strong> Red/yellow areas indicate high attention regions where nodules may be present.
              </>
            ) : (
              <>
                ⚪ <strong>Original View:</strong> Showing original X-ray image without heatmap overlay.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
