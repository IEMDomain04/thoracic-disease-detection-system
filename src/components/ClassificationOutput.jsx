import { ImageIcon } from "lucide-react";
import { useRef, useEffect, useState } from "react";

export function ClassificationOutput({
  imageSrc,
  prediction,
  loading,
  zoom,
  setZoom,
  position,
  setPosition,
  showHeatmap
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);

  // --- FIXED DISPLAY LOGIC ---
  let displayImage = imageSrc; // Default to the uploaded preview

  if (prediction) {
      if (showHeatmap && prediction.preview_image) {
          // Case 1: User wants heatmap -> Show heatmap
          displayImage = prediction.preview_image;
      } else if (prediction.original_image) {
          // Case 2: User wants original & backend sent it -> Show processed original
          displayImage = prediction.original_image;
      } else {
          // Case 3: User wants original but backend didn't send distinct one -> Show upload preview
          displayImage = imageSrc;
      }
  }

  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;
    const wheelHandler = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(Math.max(0.5, prev + delta), 5));
    };
    container.addEventListener("wheel", wheelHandler, { passive: false });
    return () => container.removeEventListener("wheel", wheelHandler);
  }, [setZoom]);

  const handleMouseDown = (e) => {
    if (!displayImage) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div
        ref={imageContainerRef}
        className="relative w-full h-full bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? "grabbing" : displayImage ? "grab" : "default" }}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt="Preview"
            className="w-full h-full object-contain select-none"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
            draggable={false}
          />
        ) : (
          <div className="text-center text-gray-400">
            <ImageIcon size={80} className="mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium text-gray-500">No image uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}