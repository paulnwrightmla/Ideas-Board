
import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { X } from 'lucide-react';
import { Column, Idea } from '../types';
import StickyNote from './StickyNote';

interface BoardProps {
  columns: Column[];
  ideas: { [key: string]: Idea };
  onUpdateTitle: (id: string, newTitle: string) => void;
  onRemoveColumn: (id: string) => void;
}

const Board: React.FC<BoardProps> = ({ columns, ideas, onUpdateTitle, onRemoveColumn }) => {
  // Determine grid layout based on number of columns
  const getGridCols = () => {
    const count = columns.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    if (count === 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className={`grid ${getGridCols()} h-full w-full gap-0 border-collapse`}>
      {columns.map((column) => (
        <div 
          key={column.id} 
          className={`flex flex-col border-r border-b group relative ${column.bgColor} min-h-0`}
        >
          {/* Editable Header */}
          <div className="p-4 pr-10 shrink-0 flex items-center justify-between">
            <input 
              className="w-full bg-transparent font-bold text-gray-700 text-lg border-b border-transparent hover:border-gray-300 focus:outline-none focus:border-indigo-400 rounded-none px-1 transition-all"
              value={column.title}
              onChange={(e) => onUpdateTitle(column.id, e.target.value)}
              placeholder="Name this quadrant..."
            />
            
            <button 
              onClick={() => onRemoveColumn(column.id)}
              className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
              title="Remove Quadrant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sticky Notes Container - Scrollable */}
          <Droppable droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 overflow-y-auto custom-scrollbar p-4 transition-colors relative ${
                  snapshot.isDraggingOver ? 'bg-black/5' : ''
                }`}
              >
                <div className="flex flex-wrap gap-4 items-start content-start">
                  {column.ideaIds.map((id, index) => (
                    <Draggable key={id} draggableId={id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                          }}
                          className={`${snapshot.isDragging ? 'z-50' : ''}`}
                        >
                          <StickyNote idea={ideas[id]} isSmall />
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      ))}
    </div>
  );
};

export default Board;
