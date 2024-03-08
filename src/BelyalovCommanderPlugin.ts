import { WorkspaceLeaf, TFile, Plugin, TFolder } from "obsidian";
import { around } from "monkey-around";
import BelyalovCommanderView, { VIEW_TYPE, State} from "./BelyalovCommanderView.tsx";
import FileManager from "./FileManager.ts";
import { BelyalovCommanderSettingTab } from "./Settings.ts";

interface BelyalovCommanderSetting {
  unfinishedChars: string;
  maxRecentFiles: number;
}

const DEFAULT_SETTINGS: Partial<BelyalovCommanderSetting> = {
  unfinishedChars: " /",
  maxRecentFiles: 50
};

export default class BelyalovCommanderPlugin extends Plugin  {
  settings!: BelyalovCommanderSetting;
  private removePatch!: Function; // TODO: rename
  fileManager!: FileManager;
  removeBMPatch!: Function; // TODO: rename

  public override async onload(): Promise<void> {
    this.app.workspace.onLayoutReady(() => {
      this.onLayoutReady.bind(this);
      this.doPatch(); // TODO: how to test it?
      this.registerEvents();
    });

    await this.loadSettings();
    this.addSettingTab(new BelyalovCommanderSettingTab(this.app, this));

    this.fileManager = new FileManager(this.app, VIEW_TYPE, this.settings.unfinishedChars);

    this.registerView(
      VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new BelyalovCommanderView(leaf, this.fileManager, this.openFile)
    );

    this.registerCommands();
  }

  override onunload(): void {
    this.removePatch();
  }
  onLayoutReady(): void {} 

  private registerEvents() {
    // this.registerEvent(this.app.vault.on('modify', async (ev) => { await this.onFileModified(ev)}));
    this.registerEvent(
      this.app.vault.on("rename", async (targetTFile, sourcePath) => {
        await this.onVauldUpdated(targetTFile as TFile, {
          ...targetTFile,
          path: sourcePath,
        } as TFile);
      })
    );
    this.registerEvent(
      this.app.vault.on("create", async (sourceTFile) => {
        await this.onVauldUpdated(sourceTFile as TFile);
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", async (sourceTFile) => {
        await this.onVauldUpdated(sourceTFile as TFile);
      })
    );

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        menu.addItem((item) => {
          item
            .setTitle("Show in Belyalov Commander")
            .setIcon("folder-open-dot")
            .onClick(async () => {
              let path;

              // is it a folder?
              if (file instanceof TFolder) {
                path = file.path
              } else if (file instanceof TFile) {
                path = file.parent?.path
              }
              console.debug('file-menu', path)
              
              await this.openPlugin({'query': path ?? '', 'type': 'directory'});
            });
        });
      })
    )
  }

  private registerCommands() {
    this.addCommand({
      id: "root",
      name: "Show vault root",
      callback: async () => {
        await this.openPlugin({'query': '', 'type': 'directory'});
      },
    });

    this.addCommand({
      id: "recent",
      name: "Show recent notes",
      callback: async () => {
        await this.openPlugin({'query': String(this.settings.maxRecentFiles), 'type': 'recent'});
      },
    });
  }

  public patchFolderNote(folderItem: any): void {
    const that = this;
    this.removePatch = around(folderItem.__proto__, {
      onTitleElClick: (next: Function) =>
        // @ts-ignore
        async function (this: FolderItem, event: MouseEvent) {
          if (event.ctrlKey || event.metaKey) {
            await that.openPlugin({'query': this.file.path, 'type': 'directory'});
          }
          next.call(this, event);
        },
      onSelfClick: (next: Function) =>
        // @ts-ignore
        async function (this: FolderItem, event: MouseEvent) {
          if (event.ctrlKey || event.metaKey) {
            await that.openPlugin({'query': this.file.path, 'type': 'directory'});
          } else {
            next.call(this, event);
          }
        },
    });
  }

  public patchBookmarksGroup(bm: any): void {
    const that = this;
    this.removeBMPatch = around(bm.__proto__, {
      onSelfClick: (next: Function) =>
        // @ts-ignore
        async function (this: any, event: MouseEvent) {
          if (event.ctrlKey || event.metaKey) {
            const query = this.el.dataset['path']
            console.debug('bookmarks-click', query)
            await that.openPlugin({'query': query, 'type': 'bookmarks'});
          } else {
            next.call(this, event);
          }
        },
        
    });
    
  }

  async openPlugin(state: State) {
    const view = await this.getView();
    await view.setState(state);
    this.app.workspace.revealLeaf(view.leaf);
  }

  async onVauldUpdated(...files: TFile[]) {
    const view = await this.getView();
    view.updateViewIfNeeded(files);
  }

  openFile = (tfile: TFile, event: any) => {
    let newLeaf: 'split' | 'tab' | undefined;
    if (event.ctrlKey || event.metaKey) {
      newLeaf = 'split'
    } else if (event.altKey) {
      newLeaf = 'tab'
    }
    
    const leaf = this.app.workspace.getLeaf(newLeaf);

    if (leaf) {
      leaf.openFile(tfile);
    } 
  }


  // const hoverLink = (event: MouseEvent) => props.app?.workspace.trigger('hover-link', {
  //   event,
  //   source: VIEW_TYPE,
  //   targetEl: ref.current,
  //   hoverParent: props.parentRef.current,
  //   linktext: entryText,
  // })

  // const contextMenu = (event: MouseEvent) => {
  //   const menu = new Menu();
  //   const file = props.app.vault.getAbstractFileByPath(props.link.path);
  //   props.app.workspace.trigger(
  //     'file-menu',
  //     menu,
  //     file,
  //     'link-context-menu',
  //   );
  //   menu.showAtPosition({ x: event.clientX, y: event.clientY });
  // }

  // TODO: refactor function
  private doPatch() {
    // const fe = this.app.workspace.getLeavesOfType("file-explorer")[0];
    const leaf = this.app.workspace.getLeaf(true);
    // @ts-ignore
    const fileExplorer = this.app.viewRegistry.viewByType["file-explorer"](leaf) as FileExplorerView;
    // let tmpFolder = new TFolder(Vault, "");
    const root = this.app.vault.getRoot();
    const folderItem = fileExplorer.createFolderDom(root);
    // const folderItem = fe.view.createFolderDom(root);
    this.patchFolderNote(folderItem);

    const viewInvoke = this.app.viewRegistry.viewByType["bookmarks"]
    if (viewInvoke) {
      // @ts-ignore
      const view = viewInvoke(leaf) as FileExplorerView; // TODO: set appropriate view type
      const groupItem = view.getItemDom({'type': 'group'})
      this.patchBookmarksGroup(groupItem)
    }
  }

  async openView(): Promise<void> {
    const view = await this.getView();
    console.log('openView')

    this.app.workspace.revealLeaf(view.leaf);
  }

  async getView(): Promise<BelyalovCommanderView> {
    console.log('getView')
    const leaves: WorkspaceLeaf[] =
      this.app.workspace.getLeavesOfType(VIEW_TYPE);

    if (leaves[0]) {
      console.log('old leaf')
      return leaves[0].view as BelyalovCommanderView;
    }
    console.log('new leaf')

    const leaf = this.app.workspace.getLeaf();
    await leaf.setViewState({ type: VIEW_TYPE });
    return leaf.view as BelyalovCommanderView;
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

}
