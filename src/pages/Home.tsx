import { Toolbar } from "../components/Toolbar";
import { TextInput } from "../components/TextInput";
import { TreeCanvas } from "../components/TreeCanvas";
import { useState } from "react";

export default function Home() {
  const [panelWidth, setPanelWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.max(240, Math.min(600, e.clientX));
      setPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  return (
    <div
      className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <div style={{ width: panelWidth }} className="flex-shrink-0">
          <TextInput />
        </div>

        <div
          className={`w-1 flex-shrink-0 bg-transparent hover:bg-emerald-500/30 cursor-col-resize transition-colors ${isResizing ? "bg-emerald-500/50" : ""}`}
          onMouseDown={handleMouseDown}
        />

        <div className="flex-1 min-w-0">
          <TreeCanvas />
        </div>
      </div>
    </div>
  );
}
