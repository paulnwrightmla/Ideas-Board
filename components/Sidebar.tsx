
import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Column, Idea } from '../types';
import StickyNote from './StickyNote';

interface SidebarProps {
  column: Column;
  ideas: { [key: string]: Idea };
}

const Sidebar: React.FC<SidebarProps> = ({ column, ideas }) => {
  return (
    <aside className="w-72 bg-white border-r flex flex-col shadow-inner">
      <div className="p-4 border-b bg-gray-50/80">
        <h2 className="text-xs font-bold text-gray-500 tracking-widest uppercase flex items-center justify-between">
          {column.title} ({column.ideaIds.length})
        </h2>
      </div>
      
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-4 overflow-y-auto custom-scrollbar transition-colors ${
              snapshot.isDraggingOver ? 'bg-indigo-50' : ''
            }`}
          >
            <div className="flex flex-col gap-3">
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
                      <StickyNote idea={ideas[id]} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
            {column.ideaIds.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 opacity-50">
                <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg" />
                <p className="text-xs text-center">Drop ideas here to unassign them</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </aside>
  );
};

export default Sidebar;
