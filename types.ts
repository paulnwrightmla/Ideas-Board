
export interface Idea {
  id: string;
  content: string;
  color: string;
}

export interface Column {
  id: string;
  title: string;
  ideaIds: string[];
  bgColor: string;
}

export interface BoardData {
  ideas: { [key: string]: Idea };
  columns: { [key: string]: Column };
  columnOrder: string[];
}

export const STICKY_COLORS = [
  'bg-yellow-200',
  'bg-blue-200',
  'bg-pink-200',
  'bg-green-200',
  'bg-purple-200',
  'bg-orange-200'
];

export const COLUMN_BG_COLORS = [
  'bg-blue-50',
  'bg-green-50',
  'bg-orange-50',
  'bg-red-50'
];
