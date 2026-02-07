
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Plus, FileSpreadsheet, Image as ImageIcon, Trash2, Upload, LayoutGrid, Check, Settings2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

import Sidebar from './components/Sidebar';
import Board from './components/Board';
import { BoardData, Column, Idea, STICKY_COLORS, COLUMN_BG_COLORS } from './types';

const App: React.FC = () => {
  const [isSetup, setIsSetup] = useState(true);
  const [numSubsections, setNumSubsections] = useState(4);
  const [data, setData] = useState<BoardData>({
    ideas: {},
    columns: {
      'unassigned': {
        id: 'unassigned',
        title: 'UNASSIGNED',
        ideaIds: [],
        bgColor: 'bg-gray-50'
      }
    },
    columnOrder: [],
  });
  const [newIdeaText, setNewIdeaText] = useState('');
  const boardRef = useRef<HTMLDivElement>(null);

  const startBoard = () => {
    const newColumns: { [key: string]: Column } = {
      'unassigned': {
        id: 'unassigned',
        title: 'UNASSIGNED',
        ideaIds: [],
        bgColor: 'bg-gray-50'
      }
    };
    const newColumnOrder: string[] = [];

    for (let i = 1; i <= numSubsections; i++) {
      const id = `q${i}`;
      newColumnOrder.push(id);
      newColumns[id] = {
        id,
        title: '',
        ideaIds: [],
        bgColor: COLUMN_BG_COLORS[(i - 1) % COLUMN_BG_COLORS.length] + '/50'
      };
    }

    setData({
      ideas: {},
      columns: newColumns,
      columnOrder: newColumnOrder
    });
    setIsSetup(false);
  };

  const addIdea = useCallback((content: string) => {
    if (!content.trim()) return;
    
    const id = `idea-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const color = STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)];
    
    const newIdea: Idea = { id, content, color };
    
    setData(prev => ({
      ...prev,
      ideas: { ...prev.ideas, [id]: newIdea },
      columns: {
        ...prev.columns,
        'unassigned': {
          ...prev.columns['unassigned'],
          ideaIds: [id, ...prev.columns['unassigned'].ideaIds]
        }
      }
    }));
    setNewIdeaText('');
  }, []);

  const addColumn = () => {
    const id = `col-${Date.now()}`;
    const bgColor = COLUMN_BG_COLORS[data.columnOrder.length % COLUMN_BG_COLORS.length] + '/50';
    
    const newColumn: Column = {
      id,
      title: '',
      ideaIds: [],
      bgColor
    };

    setData(prev => ({
      ...prev,
      columns: { ...prev.columns, [id]: newColumn },
      columnOrder: [...prev.columnOrder, id]
    }));
  };

  const removeColumn = (columnId: string) => {
    if (data.columnOrder.length <= 1) {
      alert("You must have at least one quadrant.");
      return;
    }

    const column = data.columns[columnId];
    if (column.ideaIds.length > 0 && !window.confirm(`This quadrant contains ${column.ideaIds.length} ideas. Remove it and move ideas to Unassigned?`)) {
      return;
    }

    setData(prev => {
      const newColumnOrder = prev.columnOrder.filter(id => id !== columnId);
      const newColumns = { ...prev.columns };
      
      const unassignedIdeaIds = [...prev.columns['unassigned'].ideaIds, ...column.ideaIds];
      newColumns['unassigned'] = {
        ...newColumns['unassigned'],
        ideaIds: unassignedIdeaIds
      };
      
      delete newColumns[columnId];
      
      return {
        ...prev,
        columns: newColumns,
        columnOrder: newColumnOrder
      };
    });
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

    if (start === finish) {
      const newIdeaIds = Array.from(start.ideaIds);
      newIdeaIds.splice(source.index, 1);
      newIdeaIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...start, ideaIds: newIdeaIds };
      setData(prev => ({
        ...prev,
        columns: { ...prev.columns, [newColumn.id]: newColumn }
      }));
      return;
    }

    const startIdeaIds = Array.from(start.ideaIds);
    startIdeaIds.splice(source.index, 1);
    const newStart = { ...start, ideaIds: startIdeaIds };

    const finishIdeaIds = Array.from(finish.ideaIds);
    finishIdeaIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finish, ideaIds: finishIdeaIds };

    setData(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish
      }
    }));
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const rows = results.data as string[][];
        rows.forEach(row => {
          if (row[0]) addIdea(row[0]);
        });
      },
      header: false
    });
  };

  const exportToExcel = () => {
    const exportData = data.columnOrder.flatMap(colId => {
      const col = data.columns[colId];
      return col.ideaIds.map(id => ({
        Quadrant: col.title || 'Unnamed Quadrant',
        Idea: data.ideas[id].content
      }));
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ideas");
    XLSX.writeFile(workbook, "IdeaBoard_Export.xlsx");
  };

  const exportToPng = async () => {
    if (boardRef.current === null) return;
    
    try {
      const dataUrl = await toPng(boardRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = 'IdeaBoard_Report.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('oops, something went wrong!', err);
    }
  };

  const resetToSetup = () => {
    if (window.confirm('Are you sure you want to start over? All ideas and quadrant labels will be lost.')) {
      setIsSetup(true);
    }
  };

  const updateColumnTitle = (id: string, newTitle: string) => {
    setData(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        [id]: { ...prev.columns[id], title: newTitle }
      }
    }));
  };

  if (isSetup) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <LayoutGrid className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 text-center mb-2">Idea Board Setup</h1>
          <p className="text-slate-500 text-center mb-8">Configure your workspace to get started.</p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Number of Board Subsections</label>
              <div className="flex items-center gap-4">
                {[2, 3, 4, 6, 8].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumSubsections(num)}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all font-bold ${
                      numSubsections === num 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startBoard}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group"
            >
              Start Brainstorming
              <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-xs">You can always add or remove quadrants later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header / Toolbar */}
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={resetToSetup} className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors">
            <LayoutGrid className="text-white w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 hidden sm:block">Idea Board Pro</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <input 
              type="text" 
              placeholder="Quick sticky note..." 
              className="bg-transparent border-none focus:ring-0 px-3 py-1 text-sm w-48 lg:w-64"
              value={newIdeaText}
              onChange={(e) => setNewIdeaText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIdea(newIdeaText)}
            />
            <button 
              onClick={() => addIdea(newIdeaText)}
              className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          <div className="flex items-center gap-2">
            <button 
              onClick={addColumn}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-100 shadow-sm transition-all"
              title="Add Quadrant"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xl:inline">Add Quadrant</span>
            </button>

            <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm transition-all">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span className="hidden lg:inline">Import</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
            </label>
            
            <button 
              onClick={exportToPng}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
            >
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span className="hidden lg:inline">PNG</span>
            </button>

            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span className="hidden lg:inline">Excel</span>
            </button>

            <button 
              onClick={resetToSetup}
              className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
              title="Setup Board"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <DragDropContext onDragEnd={onDragEnd}>
        <main className="flex flex-1 overflow-hidden bg-gray-50">
          {/* Sidebar */}
          <Sidebar column={data.columns['unassigned']} ideas={data.ideas} />
          
          {/* Board */}
          <div className="flex-1 p-6 overflow-hidden">
            <div ref={boardRef} className="h-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
              <Board 
                columns={data.columnOrder.map(id => data.columns[id])} 
                ideas={data.ideas} 
                onUpdateTitle={updateColumnTitle}
                onRemoveColumn={removeColumn}
              />
            </div>
          </div>
        </main>
      </DragDropContext>
    </div>
  );
};

export default App;
