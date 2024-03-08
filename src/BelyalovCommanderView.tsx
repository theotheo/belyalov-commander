import { ItemView, TFile, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
import { Root, createRoot } from "react-dom/client";

import { ListView } from "./components/ListView.tsx";
import FileManager, { FileData } from "./FileManager.ts";

export const VIEW_TYPE = "file-management";

export type State = {
  type: 'directory' | 'bookmarks' | 'recent',
  query: string
}

export default class FileManagementView extends ItemView {
  root: Root | null = null;
  private readonly fileManager;
  private state: State = {'query': '', 'type': 'directory'};
  focusFile: (tfile: TFile, event: MouseEvent) => void;

  constructor(
    leaf: WorkspaceLeaf,
    fileManager: FileManager,
    focusFile: (tfile: TFile, event: MouseEvent) => void
  ) {
    super(leaf);

    this.fileManager = fileManager;
    this.focusFile = focusFile;
  }

  override getIcon(): string {
    if (this.state.type === 'directory') {
      return "folder-open-dot";
    } else if (this.state.type === 'bookmarks') {
      return "bookmark";
    } else {
      return "zap";
    }
  }

  override getViewType(): string {
    return VIEW_TYPE;
  }

  override getDisplayText(): string {
    switch(this.state.type) {
      case 'directory':
        return `/${this.state.query}`;
      case 'bookmarks':
        return `${this.state.query}`;
      case 'recent': 
        return `recent`
    }
  }

  override async setState(
    state: any,
    result: ViewStateResult = { history: true }
  ): Promise<void> {
    console.debug('setState', state)

    let filepaths;

    if (state['type'] === 'directory') {
      state.query = this.fileManager.normalizePath(
        state.query
      );
      filepaths = this.fileManager.listFiles(state.query);
    } else if (state['type'] === 'directory') {
      filepaths = this.fileManager.getBookmarkFiles(state.query)
    } else {
      filepaths = this.fileManager.recentFiles(state.query)
    }
    console.debug(`get ${filepaths.length} files`)

    const filesWithContent = await this.fileManager.getFilesWithContent(filepaths);
    this.render(filesWithContent);

    this.state = state
    await super.setState(state, result);

    // @ts-ignore
    this.leaf.updateHeader();
    this.titleEl.setText(this.getDisplayText());
  }

  override getState() {
    // TODO: is it necessary?
    const state = {...super.getState(), ...this.state}

    return state;
  }

  dragoverHandler = (ev: DragEvent) => {
    ev.preventDefault();
    console.log("over");
    // ev?.dataTransfer?.dropEffect = "move";
  };
  handleDrop = (ev: DragEvent) => {
    ev.preventDefault();
    console.log("drop");
    // const data = ev.dataTransfer.getData("text/plain");
  };

  render(filesWithContent: FileData[]) {
    if (this.root) {
      this.root.render(
        <ListView
          // onDrop={this.handleDrop}
          // onDragEnd={() => console.log("end")}
          // onDragOver={this.dragoverHandler}
          filesWithContent={filesWithContent}
          handleDragFile={this.handleDrag}
          openFile={this.focusFile}
          handleDragFiles={this.handleDragFiles}
        />
      );
    }
  }

  handleDrag = (event: DragEvent, filepath: string) => {
    this.fileManager.dragFile(event, filepath, VIEW_TYPE);
  };

  handleDragFiles = (event: DragEvent, filepaths: string[]) => {
    this.fileManager.dragFiles(event, filepaths, VIEW_TYPE);
  };

  async updateViewIfNeeded(files: TFile[]): Promise<boolean> {
    const match = files.find((file) => {
      return this.fileManager.getDirectory(file) === this.state.query ? true : false;
    })

    if (match) {
      await this.setState({'query': this.state.query, 'type': 'directory' });
      return true
    }

    return false;
  }

  override async onOpen() {
    const container = this.contentEl;
    this.root = createRoot(container);
    await this.setState({'query': '', 'type': 'directory'});
  }
}
