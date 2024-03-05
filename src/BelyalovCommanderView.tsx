import { ItemView, TFile, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
import { Root, createRoot } from "react-dom/client";

import { ListView } from "./components/ListView.tsx";
import FileManager, { FileData } from "./FileManager.ts";

export const VIEW_TYPE = "file-management";

export default class FileManagementView extends ItemView {
  root: Root | null = null;
  private readonly fileManager;
  private currentDirectory: string = "";
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
    return "folder-open-dot";
  }

  override getViewType(): string {
    return VIEW_TYPE;
  }

  override getDisplayText(): string {
    return `/${this.currentDirectory}`;
  }

  override async setState(
    state: any,
    result: ViewStateResult = { history: true }
  ): Promise<void> {
    this.currentDirectory = state["currentDirectory"] ?? '';
    this.currentDirectory = this.fileManager.normalizePath(
      this.currentDirectory
    );
    console.log('setState', this.currentDirectory)
    const files = this.fileManager.listFiles(this.currentDirectory);
    const filesWithContent = await this.fileManager.getFilesWithContent(files);

    console.log(filesWithContent.length)
    this.render(filesWithContent);
      console.log(files.length)

    // @ts-ignore
    this.leaf.updateHeader();
    this.titleEl.setText(this.getDisplayText());

    await super.setState(state, result);
  }

  override getState() {
    const state = super.getState();
    state.currentDirectory = this.currentDirectory;

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
      return this.fileManager.getDirectory(file) === this.currentDirectory ? true : false;
    })

    if (match) {
      await this.setState({ currentDirectory: this.currentDirectory });
      return true
    }

    return false;
  }

  override async onOpen() {
    const container = this.contentEl;
    this.root = createRoot(container);
    await this.setState({ currentDirectory: "" });
  }
}
