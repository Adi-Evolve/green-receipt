import React, { useState } from 'react';

interface ColumnManagerProps {
  columns: Record<string, boolean>;
  setColumns: (cols: Record<string, boolean>) => void;
}

export default function ColumnManager({ columns, setColumns }: ColumnManagerProps) {
  const [newCol, setNewCol] = useState('');
  const [order, setOrder] = useState(Object.keys(columns));

  // Add new column
  const handleAdd = () => {
    if (!newCol.trim() || columns[newCol.trim()]) return;
    setColumns({ ...columns, [newCol.trim()]: true });
    setOrder([...order, newCol.trim()]);
    setNewCol('');
  };

  // Remove column
  const handleRemove = (col: string) => {
    const updated = { ...columns };
    delete updated[col];
    setColumns(updated);
    setOrder(order.filter(c => c !== col));
  };

  // Toggle column
  const handleToggle = (col: string) => {
    setColumns({ ...columns, [col]: !columns[col] });
  };

  // Rename column
  const handleRename = (oldName: string, newName: string) => {
    if (!newName.trim() || columns[newName.trim()]) return;
    const updated: Record<string, boolean> = {};
    Object.entries(columns).forEach(([k, v]) => {
      updated[k === oldName ? newName.trim() : k] = v;
    });
    setColumns(updated);
    setOrder(order.map(c => (c === oldName ? newName.trim() : c)));
  };

  // Drag and drop reorder
  const handleDrag = (fromIdx: number, toIdx: number) => {
    const updated = [...order];
    const [removed] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, removed);
    setOrder(updated);
    // Reorder columns in setColumns as well
    const reordered: Record<string, boolean> = {};
    updated.forEach(k => { reordered[k] = columns[k]; });
    setColumns(reordered);
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          className="border rounded px-2 py-1"
          value={newCol}
          onChange={e => setNewCol(e.target.value)}
          placeholder="Add column"
        />
        <button className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-1 rounded shadow transition" onClick={handleAdd} type="button">Add</button>
      </div>
      <ul className="space-y-1">
        {order.map((col, idx) => (
          <li key={col} className="flex gap-2 items-center bg-gray-100 rounded px-2 py-1">
            <span
              draggable
              onDragStart={e => e.dataTransfer.setData('text/plain', idx.toString())}
              onDrop={e => { e.preventDefault(); handleDrag(Number(e.dataTransfer.getData('text/plain')), idx); }}
              onDragOver={e => e.preventDefault()}
              className="cursor-move text-gray-500"
              title="Drag to reorder"
            >↕</span>
            <input
              className="border rounded px-1 py-0.5 w-28"
              value={col}
              onChange={e => handleRename(col, e.target.value)}
            />
            <input
              type="checkbox"
              checked={columns[col]}
              onChange={() => handleToggle(col)}
            />
            <button className="text-red-500 ml-1" onClick={() => handleRemove(col)} title="Remove" type="button">✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
