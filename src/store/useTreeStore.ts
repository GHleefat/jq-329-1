import { create } from "zustand";
import type { TreeState, TreeNodeData, NodePosition } from "../types/tree";
import { parseIndentedText } from "../utils/textParser";
import { calculateLayout } from "../utils/layout";

const DEFAULT_TEXT = `项目启动
  需求分析
    用户调研
    竞品分析
    需求文档
  设计阶段
    UI 设计
    技术方案
    原型评审
  开发阶段
    前端开发
    后端开发
    接口联调
  测试上线
    功能测试
    性能优化
    正式发布`;

const initialParsed = parseIndentedText(DEFAULT_TEXT);
const initialPositions = calculateLayout(
  initialParsed.nodes,
  initialParsed.rootId,
);

interface TreeStore extends TreeState {
  setText: (text: string) => void;
  setScale: (scale: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
  updateNodePosition: (nodeId: string, position: NodePosition) => void;
  resetLayout: () => void;
  setSelectedNode: (nodeId: string | null) => void;
  fitToView: () => void;
}

export const useTreeStore = create<TreeStore>((set, get) => ({
  nodes: initialParsed.nodes,
  positions: initialPositions,
  rootId: initialParsed.rootId,
  scale: 1,
  offset: { x: 0, y: 0 },
  text: DEFAULT_TEXT,
  selectedNodeId: null,

  setText: (text: string) => {
    const { nodes, rootId } = parseIndentedText(text);
    const positions = calculateLayout(nodes, rootId);
    set({ text, nodes, positions, rootId, selectedNodeId: null });
  },

  setScale: (scale: number) => {
    set({ scale: Math.max(0.1, Math.min(3, scale)) });
  },

  setOffset: (offset: { x: number; y: number }) => {
    set({ offset });
  },

  updateNodePosition: (nodeId: string, position: NodePosition) => {
    set((state) => {
      const newPositions = new Map(state.positions);
      newPositions.set(nodeId, position);
      return { positions: newPositions };
    });
  },

  resetLayout: () => {
    const { nodes, rootId } = get();
    const positions = calculateLayout(nodes, rootId);
    set({ positions, scale: 1, offset: { x: 0, y: 0 } });
  },

  setSelectedNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId });
  },

  fitToView: () => {
    const { positions } = get();
    if (positions.size === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const pos of positions.values()) {
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + pos.width);
      maxY = Math.max(maxY, pos.y + pos.height);
    }

    const padding = 80;
    const treeWidth = maxX - minX + padding * 2;
    const treeHeight = maxY - minY + padding * 2;

    set((state) => {
      const canvasWidth =
        typeof window !== "undefined" ? window.innerWidth - 400 : 800;
      const canvasHeight =
        typeof window !== "undefined" ? window.innerHeight - 80 : 600;

      const scaleX = canvasWidth / treeWidth;
      const scaleY = canvasHeight / treeHeight;
      const scale = Math.min(scaleX, scaleY, 1.5);

      const offsetX =
        -(minX - padding) * scale + (canvasWidth - treeWidth * scale) / 2;
      const offsetY =
        -(minY - padding) * scale + (canvasHeight - treeHeight * scale) / 2;

      return {
        scale,
        offset: { x: offsetX, y: offsetY },
      };
    });
  },
}));
