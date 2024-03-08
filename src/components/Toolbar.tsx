import * as React from "react";
import { Icon } from "./Icon.tsx";
import "./Toolbar.css";
import { Menu } from "obsidian";

const sortMap = new Map<string, string>([
  ["name-asc", "File name (A to Z)"],
  ["name-desc", "File name (Z to A)"],
  ["updated-asc", "Modified time (new to old)"],
  ["updated-desc", "Modified time (old to new)"],
  ["created-asc", "Created time (new to old)"],
  ["created-desc", "Created time (old to new)"],
]);

const createMenu = (sort: string, setSort: Function) => {
  const menu = new Menu();

  sortMap.forEach((desc, key) => {
    menu.addItem((item) => {
      item
        .onClick(() => {
          setSort(key);
        })
        .setTitle(desc);

      if (key === sort) {
        item.setChecked(true);
      }
      return item;
    });
  });

  return menu;
};

interface ToolbarProps {
  isGrid: boolean;
  setGrid: Function;
  sort: string;
  setSort: Function;
}

export function Toolbar({ setGrid, isGrid, setSort, sort }: ToolbarProps) {
  const menu = createMenu(sort, setSort);

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
      <div
        onClick={(event: React.MouseEvent) =>
          menu.showAtMouseEvent(event.nativeEvent)
        }
      >
        <Icon name={"arrow-up-narrow-wide"} />
      </div>
    </div>
  );
}
