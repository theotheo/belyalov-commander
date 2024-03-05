import * as React from "react";
import { Icon } from "./Icon.tsx";
import './Toolbar.css'

interface ToolbarProps {
  isGrid: boolean;
  setGrid: Function;
}
export function Toolbar({ setGrid, isGrid }: ToolbarProps) {

  return (
    <div className="toolbar">
        <div
        onClick={() => {
            setGrid(!isGrid);
        }}
        className={`switch ${isGrid ? "is-enabled" : ""}`}
        >
        <Icon name={"layout-grid"} />
        </div>
    </div>
  );
}
