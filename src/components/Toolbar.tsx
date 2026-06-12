import { useTreeStore } from "../store/useTreeStore";
import { exportSvg, exportPng } from "../utils/export";
import {
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Download,
  Image,
  FileCode,
  Maximize2,
} from "lucide-react";

export function Toolbar() {
  const { scale, setScale, resetLayout, fitToView, nodes, positions, rootId } =
    useTreeStore();

  const handleZoomIn = () => {
    setScale(scale + 0.1);
  };

  const handleZoomOut = () => {
    setScale(scale - 0.1);
  };

  const handleExportSvg = () => {
    exportSvg(nodes, positions, rootId);
  };

  const handleExportPng = async () => {
    try {
      await exportPng(nodes, positions, rootId, 2);
    } catch (error) {
      console.error("Export PNG failed:", error);
    }
  };

  return (
    <div className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-slate-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Tree Flow
          </h1>
        </div>

        <div className="h-6 w-px bg-slate-700 mx-2" />

        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          title="缩小"
        >
          <ZoomOut size={18} />
        </button>
        <div className="w-16 text-center text-sm text-slate-300 font-mono">
          {Math.round(scale * 100)}%
        </div>
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          title="放大"
        >
          <ZoomIn size={18} />
        </button>

        <button
          onClick={fitToView}
          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors ml-1"
          title="适应画布"
        >
          <Maximize2 size={18} />
        </button>

        <button
          onClick={resetLayout}
          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          title="重置布局"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-6 w-px bg-slate-700 mx-2" />

        <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
          <button
            onClick={handleExportSvg}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
            title="导出 SVG"
          >
            <FileCode size={16} />
            SVG
          </button>
          <button
            onClick={handleExportPng}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
            title="导出 PNG"
          >
            <Image size={16} />
            PNG
          </button>
        </div>

        <button
          onClick={handleExportPng}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 font-medium rounded-lg text-sm transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
        >
          <Download size={16} />
          导出
        </button>
      </div>
    </div>
  );
}
