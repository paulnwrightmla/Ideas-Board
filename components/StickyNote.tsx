
import React from 'react';
import { Idea } from '../types';

interface StickyNoteProps {
  idea: Idea;
  isSmall?: boolean;
}

const StickyNote: React.FC<StickyNoteProps> = ({ idea, isSmall = false }) => {
  return (
    <div 
      className={`
        ${idea.color} 
        ${isSmall ? 'w-36 min-h-[100px] text-xs' : 'w-full min-h-[120px] text-sm'}
        p-4 shadow-md transform rotate-[-1deg] hover:rotate-0 hover:scale-105 transition-all duration-200
        flex flex-col justify-center text-center sticky-font border-t border-l border-white/40
        cursor-grab active:cursor-grabbing select-none
      `}
    >
      <div className="text-gray-800 leading-tight">
        {idea.content}
      </div>
      
      {/* Decorative fold effect */}
      <div className="absolute bottom-0 right-0 w-4 h-4 bg-black/5 rounded-tl-lg pointer-events-none" />
    </div>
  );
};

export default StickyNote;
