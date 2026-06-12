import { useTreeStore } from "../store/useTreeStore";
import { useMemo } from "react";

export function TextInput() {
  const { text, setText, nodes } = useTreeStore();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const lineCount = useMemo(() => text.split("\n").length, [text]);
  const nodeCount = nodes.size;

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-sm border-r border-slate-700/50">
      <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/30">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          缩进文本
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          支持空格缩进、Tab、Markdown 列表格式
        </p>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-10 bg-slate-800/50 border-r border-slate-700/30 flex flex-col items-end pr-2 pt-3 text-xs text-slate-600 font-mono select-none overflow-hidden">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="leading-6 h-6">
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          value={text}
          onChange={handleChange}
          className="w-full h-full bg-transparent text-slate-300 font-mono text-sm pl-12 pr-4 py-3 resize-none focus:outline-none leading-6 placeholder-slate-600"
          placeholder="在这里粘贴带缩进的文本..."
          spellCheck={false}
        />
      </div>
      <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/30 text-xs text-slate-500">
        {lineCount} 行 · {nodeCount} 个节点
      </div>
    </div>
  );
}
