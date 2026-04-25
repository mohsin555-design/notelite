"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import type {
  BinaryFiles,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";

import type { CanvasData } from "@/lib/notion-types";

const Excalidraw = dynamic(
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    return mod.Excalidraw;
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading canvas...
      </div>
    ),
  },
);

type CanvasPanelProps = {
  canvas: CanvasData;
  onChange: (canvas: CanvasData) => void;
};

export function CanvasPanel({ canvas, onChange }: CanvasPanelProps) {
  const initialDataRef = useRef<ExcalidrawInitialDataState | null>(null);
  const lastSceneRef = useRef(JSON.stringify(canvas));

  if (!initialDataRef.current) {
    initialDataRef.current = {
      elements: canvas.elements as ExcalidrawInitialDataState["elements"],
      appState: {
        ...canvas.appState,
        viewBackgroundColor: "#ffffff",
      },
      files: canvas.files as BinaryFiles,
    };
  }

  return (
    <div className="h-[640px] min-h-[60vh] overflow-hidden rounded-lg border bg-background">
      <Excalidraw
        initialData={initialDataRef.current}
        onChange={(elements, appState, files) => {
          const nextCanvas = {
            elements: [...elements],
            appState: {
              viewBackgroundColor: appState.viewBackgroundColor,
              scrollX: appState.scrollX,
              scrollY: appState.scrollY,
              zoom: appState.zoom,
            },
            files,
          };
          const nextScene = JSON.stringify(nextCanvas);

          if (nextScene === lastSceneRef.current) {
            return;
          }

          lastSceneRef.current = nextScene;
          onChange(nextCanvas);
        }}
      />
    </div>
  );
}
