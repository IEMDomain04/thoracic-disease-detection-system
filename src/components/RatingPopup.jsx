import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export function RatingPopup({ isOpen, onClose, onSubmit }) {
  const [ratings, setRatings] = useState({
    clinicalAlignment: '', // yes/no/partially
    heatmapAccuracy: 0, // 1-5 Likert scale
    diagnosisReconsideration: '', // changed/confirmed/disagreed
    easeOfUse: 0,
    feedback: ''
  });
  
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const popupRef = useRef(null);

  useEffect(() => {
    if (isOpen && popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      setPosition({
        x: window.innerWidth - rect.width - 100,
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

  const handleChoiceClick = (category, value) => {
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
        width: '450px',
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
        {/* Clinical Alignment */}
        <div className="text-center">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Did the AI's prediction align with your initial clinical assessment?
          </label>
          <div className="flex gap-2 justify-center">
            {[
              { value: 'yes', label: 'Yes' },
              { value: 'partially', label: 'Partially' },
              { value: 'no', label: 'No' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleChoiceClick('clinicalAlignment', option.value)}
                className={`px-4 py-2 rounded-md border-2 transition-colors ${
                  ratings.clinicalAlignment === option.value
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-gray-600 text-gray-400 hover:border-blue-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Heatmap Accuracy (Likert Scale) */}
        <div className="text-center">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Did the heatmap correctly highlight suspicious regions?
          </label>
          <div className="flex gap-2 justify-center items-center">
            <span className="text-xs text-gray-400">Strongly<br/>Disagree</span>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => handleRatingClick('heatmapAccuracy', value)}
                className={`w-10 h-10 rounded-md border-2 transition-colors ${
                  ratings.heatmapAccuracy >= value
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-gray-600 text-gray-400 hover:border-blue-400'
                }`}
              >
                {value}
              </button>
            ))}
            <span className="text-xs text-gray-400">Strongly<br/>Agree</span>
          </div>
        </div>

        {/* Diagnosis Reconsideration */}
        <div className="text-center">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Did the AI output cause you to reconsider your diagnosis?
          </label>
          <div className="flex flex-col gap-2">
            {[
              { value: 'changed', label: 'Yes, it changed my mind' },
              { value: 'confirmed', label: 'No, it confirmed my thought' },
              { value: 'disagreed', label: 'No, I disagreed with it' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleChoiceClick('diagnosisReconsideration', option.value)}
                className={`px-4 py-2 rounded-md border-2 transition-colors text-sm ${
                  ratings.diagnosisReconsideration === option.value
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-gray-600 text-gray-400 hover:border-blue-400'
                }`}
              >
                {option.label}
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
          <div className="flex justify-center">
            <textarea
              value={ratings.feedback}
              onChange={handleFeedbackChange}
              placeholder="Share your thoughts..."
              rows={4}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={!ratings.clinicalAlignment || !ratings.heatmapAccuracy || !ratings.diagnosisReconsideration || !ratings.easeOfUse}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          style={{ width: '100%' }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}