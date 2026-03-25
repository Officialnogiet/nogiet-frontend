import React, { useState } from 'react';
import { X, Download, FileText, Image, Table, Presentation } from 'lucide-react';
import { exportToCsv, exportToPdf, exportToExcel, exportToPptx, exportToImage } from '../src/utils/export';

interface ExportModalProps {
  darkMode: boolean;
  onClose: () => void;
  data: Record<string, any>[];
  title: string;
  captureElementId?: string;
  metadata?: { date?: string; facility?: string; source?: string };
}

type Format = 'csv' | 'pdf' | 'excel' | 'pptx' | 'png' | 'jpg';

const FORMATS: { id: Format; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'csv', label: 'CSV', icon: <Table size={18} />, desc: 'Spreadsheet data' },
  { id: 'excel', label: 'Excel', icon: <Table size={18} />, desc: 'Formatted workbook' },
  { id: 'pdf', label: 'PDF', icon: <FileText size={18} />, desc: 'Document with tables' },
  { id: 'pptx', label: 'PowerPoint', icon: <Presentation size={18} />, desc: 'Presentation slides' },
  { id: 'png', label: 'PNG Image', icon: <Image size={18} />, desc: 'Screenshot capture' },
  { id: 'jpg', label: 'JPG Image', icon: <Image size={18} />, desc: 'Compressed image' },
];

const ExportModal: React.FC<ExportModalProps> = ({ darkMode, onClose, data, title, captureElementId, metadata }) => {
  const [selected, setSelected] = useState<Format>('csv');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const filename = title.toLowerCase().replace(/\s+/g, '-');
    try {
      switch (selected) {
        case 'csv': await exportToCsv(data, filename); break;
        case 'pdf': await exportToPdf(data, filename, title, metadata); break;
        case 'excel': await exportToExcel(data, filename); break;
        case 'pptx': await exportToPptx(data, filename, title); break;
        case 'png':
          if (captureElementId) await exportToImage(captureElementId, filename, 'png');
          break;
        case 'jpg':
          if (captureElementId) await exportToImage(captureElementId, filename, 'jpg');
          break;
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
    setExporting(false);
    onClose();
  };

  const bg = darkMode ? 'bg-[#12161f]' : 'bg-white';
  const border = darkMode ? 'border-[#1e2430]' : 'border-gray-200';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const subText = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${bg} rounded-2xl shadow-2xl w-full max-w-md p-6 ${border} border`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-bold ${text}`}>Export Report</h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <X size={18} className={subText} />
          </button>
        </div>

        <p className={`text-sm ${subText} mb-4`}>Select export format for "{title}"</p>
        <p className={`text-xs ${subText} mb-4`}>{data.length} records</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {FORMATS.map(f => {
            const isImage = f.id === 'png' || f.id === 'jpg';
            const disabled = isImage && !captureElementId;
            return (
              <button
                key={f.id}
                onClick={() => !disabled && setSelected(f.id)}
                disabled={disabled}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selected === f.id
                    ? 'border-teal-500 bg-teal-500/10'
                    : disabled
                    ? `${border} opacity-40 cursor-not-allowed`
                    : `${border} ${darkMode ? 'hover:bg-[#1a1f2b]' : 'hover:bg-gray-50'}`
                }`}
              >
                <div className={`flex items-center gap-2 mb-1 ${selected === f.id ? 'text-teal-500' : subText}`}>
                  {f.icon}
                  <span className={`text-sm font-semibold ${selected === f.id ? 'text-teal-500' : text}`}>{f.label}</span>
                </div>
                <p className={`text-xs ${subText}`}>{f.desc}</p>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <Download size={16} />
          {exporting ? 'Exporting...' : 'Export'}
        </button>
      </div>
    </div>
  );
};

export default ExportModal;
