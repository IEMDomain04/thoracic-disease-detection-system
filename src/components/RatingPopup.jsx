import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export function RatingPopup({ isOpen, onClose, onSubmit }) {
  const [ratings, setRatings] = useState({
    classificationAccuracy: 0,
    localizationAccuracy: 0,
    easeOfUse: 0,
    feedback: ''
  });
  
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const popupRef = useRef(null);

  // Center popup on mount
  useEffect(() => {
    if (isOpen && popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      setPosition({
        x: (window.innerWidth - rect.width) / 2,
        y: (window.innerHeight - rect.height) / 2
      });
    }
  }, [isOpen]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleRatingClick = (category, value) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  const handleFeedbackChange = (e) => {
    setRatings(prev => ({ ...prev, feedback: e.target.value }));
  };

  const handleSubmit = () => {
    onSubmit(ratings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={popupRef}
      className="fixed rounded-lg border border-gray-700 z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '384px',
        cursor: isDragging ? 'grabbing' : 'default',
        backgroundColor: 'rgba(31, 41, 55, 0.85)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div 
        className="drag-handle cursor-grab active:cursor-grabbing px-6 py-4 border-b border-gray-700 relative"
        onMouseDown={handleMouseDown}
      >
        <h2 className="text-xl font-semibold text-white text-center">Post-Evaluation Review</h2>
        <button 
          onClick={onClose} 
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-4">
        {/* Classification Accuracy */}
        <div className="text-center">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Classification Accuracy
          </label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => handleRatingClick('classificationAccuracy', value)}
                className={`w-10 h-10 rounded-md border-2 transition-colors ${
                  ratings.classificationAccuracy >= value
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-gray-600 text-gray-400 hover:border-blue-400'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Localization Accuracy */}
        <div className="text-center">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Localization Accuracy
          </label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => handleRatingClick('localizationAccuracy', value)}
                className={`w-10 h-10 rounded-md border-2 transition-colors ${
                  ratings.localizationAccuracy >= value
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-gray-600 text-gray-400 hover:border-blue-400'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Ease of Use */}
        <div className="text-center">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ease of Use
          </label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => handleRatingClick('easeOfUse', value)}
                className={`w-10 h-10 rounded-md border-2 transition-colors ${
                  ratings.easeOfUse >= value
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-gray-600 text-gray-400 hover:border-blue-400'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Suggestions/Feedback */}
        <div className="text-center">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Suggestions/Feedback
          </label>
          <textarea
            value={ratings.feedback}
            onChange={handleFeedbackChange}
            placeholder="Share your thoughts..."
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      <div className="px-6 pb-6">
        <button
          onClick={handleSubmit}
          disabled={!ratings.classificationAccuracy || !ratings.localizationAccuracy || !ratings.easeOfUse}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
    </div>
  );
}