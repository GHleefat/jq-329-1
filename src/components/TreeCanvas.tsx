import { useRef, useEffect, useCallback, useState } from "react";
import { useTreeStore } from "../store/useTreeStore";
import { getNodeCenter } from "../utils/layout";
import type { NodePosition } from "../types/tree";

const levelColors = [
  {
    bg: "from-blue-500 to-blue-600",
    border: "border-blue-400",
    shadow: "shadow-blue-500/30",
  },
  {
    bg: "from-emerald-500 to-emerald-600",
    border: "border-emerald-400",
    shadow: "shadow-emerald-500/30",
  },
  {
    bg: "from-amber-500 to-amber-600",
    border: "border-amber-400",
    shadow: "shadow-amber-500/30",
  },
  {
    bg: "from-rose-500 to-rose-600",
    border: "border-rose-400",
    shadow: "shadow-rose-500/30",
  },
  {
    bg: "from-violet-500 to-violet-600",
    border: "border-violet-400",
    shadow: "shadow-violet-500/30",
  },
  {
    bg: "from-pink-500 to-pink-600",
    border: "border-pink-400",
    shadow: "shadow-pink-500/30",
  },
];

function TreeNode({
  id,
  label,
  level,
  position,
  isSelected,
  onMouseDown,
  onClick,
}: {
  id: string;
  label: string;
  level: number;
  position: NodePosition;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onClick: (nodeId: string) => void;
}) {
  const colorSet = levelColors[level % levelColors.length];

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      onMouseDown={(e) => onMouseDown(e, id)}
      onClick={() => onClick(id)}
      style={{ cursor: "grab" }}
    >
      {isSelected && (
        <rect
          x={-4}
          y={-4}
          width={position.width + 8}
          height={position.height + 8}
          rx={14}
          ry={14}
          fill="white"
          fillOpacity={0.1}
          className="animate-pulse"
        />
      )}

      <defs>
        <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect
        x={0}
        y={0}
        width={position.width}
        height={position.height}
        rx={12}
        ry={12}
        fill={`hsl(${level * 60 + 200}, 70%, 50%)`}
        fillOpacity={0.9}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={1}
        filter={`url(#glow-${id})`}
        className="transition-all duration-200 hover:fill-opacity-100"
      />

      <text
        x={position.width / 2}
        y={position.height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize={14}
        fontWeight={500}
        style={{
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {label.length > 18 ? label.substring(0, 17) + "…" : label}
      </text>
    </g>
  );
}

function TreeLink({
  parentPos,
  childPos,
}: {
  parentPos: NodePosition;
  childPos: NodePosition;
}) {
  const parentCenter = getNodeCenter(parentPos);
  const childCenter = getNodeCenter(childPos);

  const startX = parentCenter.x;
  const startY = parentPos.y + parentPos.height;
  const endX = childCenter.x;
  const endY = childPos.y;
  const midY = (startY + endY) / 2;

  const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

  return (
    <path
      d={path}
      fill="none"
      stroke="rgba(148, 163, 184, 0.4)"
      strokeWidth={2}
      strokeLinecap="round"
      style={{ transition: "stroke 0.2s" }}
    />
  );
}

export function TreeCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    nodes,
    positions,
    rootId,
    scale,
    offset,
    setScale,
    setOffset,
    selectedNodeId,
    setSelectedNode,
    updateNodePosition,
  } = useTreeStore();

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.1, Math.min(3, scale + delta));

      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scaleRatio = newScale / scale;
        const newOffsetX = mouseX - (mouseX - offset.x) * scaleRatio;
        const newOffsetY = mouseY - (mouseY - offset.y) * scaleRatio;

        setScale(newScale);
        setOffset({ x: newOffsetX, y: newOffsetY });
      }
    },
    [scale, offset, setScale, setOffset],
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (
        e.target === svgRef.current ||
        ((e.target as SVGElement).tagName === "rect" &&
          (e.target as SVGElement).getAttribute("class")?.includes("canvas-bg"))
      ) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        setSelectedNode(null);
      }
    },
    [offset, setSelectedNode],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      } else if (isDraggingNode && dragNodeId) {
        const nodePos = positions.get(dragNodeId);
        if (nodePos) {
          const newX = (e.clientX - offset.x - dragOffset.x) / scale;
          const newY = (e.clientY - offset.y - dragOffset.y) / scale;

          updateNodePosition(dragNodeId, {
            ...nodePos,
            x: newX - nodePos.width / 2,
            y: newY - nodePos.height / 2,
          });
        }
      }
    },
    [
      isPanning,
      isDraggingNode,
      panStart,
      dragNodeId,
      dragOffset,
      positions,
      scale,
      offset,
      setOffset,
      updateNodePosition,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDraggingNode(false);
    setDragNodeId(null);
  }, []);

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();

      const nodePos = positions.get(nodeId);
      if (!nodePos || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const nodeCenterX = (nodePos.x + nodePos.width / 2) * scale + offset.x;
      const nodeCenterY = (nodePos.y + nodePos.height / 2) * scale + offset.y;

      setDragOffset({
        x: mouseX - nodeCenterX,
        y: mouseY - nodeCenterY,
      });

      setIsDraggingNode(true);
      setDragNodeId(nodeId);
      setSelectedNode(nodeId);
    },
    [positions, scale, offset, setSelectedNode],
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNode(nodeId);
    },
    [setSelectedNode],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      useTreeStore.getState().fitToView();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const nodeArray = Array.from(nodes.entries());

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950"
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.1),transparent_70%)]" />

      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown}
      >
        <defs>
          <pattern
            id="smallGrid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(148, 163, 184, 0.05)"
              strokeWidth="1"
            />
          </pattern>
          <pattern
            id="grid"
            width="200"
            height="200"
            patternUnits="userSpaceOnUse"
          >
            <rect width="200" height="200" fill="url(#smallGrid)" />
            <path
              d="M 200 0 L 0 0 0 200"
              fill="none"
              stroke="rgba(148, 163, 184, 0.08)"
              strokeWidth="1.5"
            />
          </pattern>
        </defs>

        <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
          <rect
            x={-10000}
            y={-10000}
            width={20000}
            height={20000}
            fill="url(#grid)"
            className="canvas-bg"
          />

          {nodeArray.map(([id, node]) => {
            if (!node.parentId) return null;
            const parentPos = positions.get(node.parentId);
            const childPos = positions.get(id);
            if (!parentPos || !childPos) return null;

            return (
              <TreeLink
                key={`link-${node.parentId}-${id}`}
                parentPos={parentPos}
                childPos={childPos}
              />
            );
          })}

          {nodeArray.map(([id, node]) => {
            const pos = positions.get(id);
            if (!pos) return null;

            return (
              <TreeNode
                key={id}
                id={id}
                label={node.label}
                level={node.level}
                position={pos}
                isSelected={selectedNodeId === id}
                onMouseDown={handleNodeMouseDown}
                onClick={handleNodeClick}
              />
            );
          })}
        </g>
      </svg>

      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-400 border border-slate-700/50">
        <span>滚轮缩放</span>
        <span className="text-slate-600">·</span>
        <span>拖拽平移</span>
        <span className="text-slate-600">·</span>
        <span>拖动节点</span>
      </div>

      {nodeArray.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">在左侧输入带缩进的文本</p>
            <p className="text-slate-600 text-xs mt-1">自动生成树形流程图</p>
          </div>
        </div>
      )}
    </div>
  );
}
