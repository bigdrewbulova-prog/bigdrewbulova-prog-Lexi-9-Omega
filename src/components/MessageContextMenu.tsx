import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Trash2, Trash } from 'lucide-react';

export default function MessageContextMenu({ onDelete, onClear, darkMode }: { onDelete: () => void; onClear: () => void; darkMode: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1 rounded hover:bg-gray-200 ${darkMode ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-700' : 'text-gray-600'}`}
      >
        <MoreVertical size={16} />
      </button>
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border'}`}>
          <button
            onClick={() => { onDelete(); setIsOpen(false); }}
            className={`flex items-center w-full px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <Trash2 size={16} className="mr-2" /> Delete Message
          </button>
          <button
            onClick={() => { onClear(); setIsOpen(false); }}
            className={`flex items-center w-full px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <Trash size={16} className="mr-2" /> Clear All Chats
          </button>
        </div>
      )}
    </div>
  );
}
