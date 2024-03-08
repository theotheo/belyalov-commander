import {
  App,
  Vault,
  CachedMetadata,
  MetadataCache,
  FrontMatterCache,
  TFile,
  TFolder,
} from "obsidian";
import moment from "moment";

export interface FileData {
  filepath: string;
  name: string;
  content: string;
  createdDate: moment.Moment;
  updatedDate: moment.Moment;
  tags?: Tag[] | null;
  headings?: any; // TODO
  imgSrc?: string | null;
  tasksStat?: TaskStat | null;
}

interface TaskStat {
  total: number;
  closed: number;
}

type Tag = string;

function getGroupItemsByPath(items: Array<any>, path: string): Array<any> {
  const parts = path.split('/')

  parts.forEach((part: string) => {
    const item = items.find((item) => item['type'] === 'group' && item['title'] === part)

    if (!item) {
      console.error('not found', items, path)
      items = []
    } else {
      items = item['items']
    }
  })

  return items
}

export default class FileManager {
  app: App;
  viewType: string;
  vault: Vault;
  metadataCache: MetadataCache;
  dragManager: any;
  unfinishedChars: string;

  constructor(app: App, viewType: string, unfinishedChars: string) {
    this.app = app;
    this.viewType = viewType;
    // TODO: need refactor
    this.vault = app.vault;
    this.dragManager = (this.app as any).dragManager;
    this.metadataCache = app.metadataCache;
    this.unfinishedChars = unfinishedChars;
  }

  //   async listFiles(path: string) {
  //     console.log(path)
  //     const all = await this.vault.adapter.list(path);
  //     return all["files"];
  //   }

  listFiles(path: string) {
    const allFiles = this.vault.getAllLoadedFiles() as Array<TFile | TFolder>;
    const dir = allFiles.find((f) => this.normalizePath(f.path) === path);
    const tFiles = (dir as TFolder).children.filter((tFile) => {
      if (tFile instanceof TFolder) return false;
      else return true; 
    });
    console.log(tFiles.length)

    const names = (tFiles as TFile[]).filter((f) => f.extension === 'md').map((f) => f.path);

    return names;
  }

  recentFiles(maxFiles: string) {
    const allFiles = this.vault.getAllLoadedFiles() as Array<TFile | TFolder>;

    const tFiles = allFiles.filter((tFile) => {
      if (tFile instanceof TFolder) return false;
      else if (tFile.extension !== 'md') return false
      else return true
    }) as TFile[];
    const names = tFiles.sort((a, b) => b.stat.mtime - a.stat.mtime).slice(0, Number(maxFiles)).map((f) => f.path);

    return names;
  }

  getBookmarkFiles(path: string) {
    const plugin = this.app.internalPlugins.plugins['bookmarks'] 
    // @ts-ignore
    const bookmarksTree = plugin.instance.items
    const items = getGroupItemsByPath(bookmarksTree, path)
    const files = items.filter((i) => i.type === 'file').map(i => i.path)
    return files

  }

  getTFile(filename: string): TFile | null {
    console.log(filename);

    return this.app.metadataCache.getFirstLinkpathDest(filename, "");
  }

  normalizePath(path: string): string {
    if (path[0] === "/") return path.substring(1);

    return path;
  }

  getDirectory(file: TFile): string {
    const filepath = file.path;
    const filename = file.name;
    const directory = filepath.substring(
      0,
      filepath.length - filename.length - 1
    );
    return directory;
  }

  removeFrontmatter(text: string): string {
    const regex = /^---.*?--- *\n/s;
    return text.replace(regex, "");
  }

  async getFilesWithContent(filepaths: string[]): Promise<FileData[]> {
    return await Promise.all(
      filepaths.map(async (f) => this.getFileWithContent(f))
    );
  }

  getImageSrc(metadata: CachedMetadata, filepath: string): string | null {
    const imageUrl = /(jpe?g|png)/;
    const imgs = metadata.embeds?.filter((e) => e.link.match(imageUrl));

    if (!imgs?.length || !imgs[0]) {
      // redundant, but useful for ts
      return null;
    }

    const firstImage = imgs[0];
    const imageLink = firstImage.link;
    let imageFullPath = this.metadataCache.getFirstLinkpathDest(
      imageLink,
      filepath
    );

    if (!imageFullPath) return null;

    return this.vault.getResourcePath(imageFullPath);
  }

  getTags(frontmatter: FrontMatterCache | undefined): Tag[] | null {
    if (!frontmatter || !frontmatter["tags"]) return null;

    let tags = frontmatter["tags"];
    if (tags && !(tags instanceof Array)) {
      tags = [tags];
    }
    return tags;
  }

  getTasksStat(
    metadata: CachedMetadata
  ): TaskStat | null {
    if (!metadata.listItems) return null;

    let total = 0;
    let unfinished = 0;

    metadata.listItems.forEach((item) => {
      if (item.task) {
        total += 1;

        if (this.unfinishedChars.includes(item.task)) {
          unfinished += 1;
        }
      }
    });

    if (total === 0) return null;

    return { total, closed: total - unfinished };
  }

  async getFileWithContent(filepath: string): Promise<FileData> {
    const tfile = this.vault.getAbstractFileByPath(filepath) as TFile;
    const name = tfile.basename;
    const text = await this.vault.cachedRead(tfile);
    const content = this.removeFrontmatter(text);

    const createdDate = moment(tfile.stat.ctime);
    const updatedDate = moment(tfile.stat.mtime);
    // const fileSize = tfile.stat.size

    const metadata = this.metadataCache.getFileCache(tfile);
    let metadataProp;
    if (metadata) {
      const frontmatter = metadata?.frontmatter;

      metadataProp = {
        headings: metadata.headings,
        tasksStat: this.getTasksStat(metadata),
        imgSrc: this.getImageSrc(metadata, filepath),
        tags: this.getTags(frontmatter),
      };
      // const title = frontmatter?.['title'] ?? null
    }

    return {
      filepath,
      name,
      content,
      createdDate,
      updatedDate,
      ...metadataProp,
    };
  }

  dragFile = (event: DragEvent, filename: string, viewType: string): void => {
    const tFile = this.getTFile(filename);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dragData = this.dragManager.dragFile(event, tFile, viewType);
    this.dragManager.onDragStart(event, dragData);
  };

  dragFiles = (
    event: DragEvent,
    filenames: string[],
    viewType: string
  ): void => {
    const tFiles = filenames.map((f) => this.getTFile(f));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dragData = this.dragManager.dragFiles(event, tFiles, viewType);
    this.dragManager.onDragStart(event, dragData);
  };

  // handleDrop = (event: DragEvent, f: string) => {

  //   const draggable = this.dragManager.draggable;
  //   console.log(draggable);

  //   this.dragManager.handleDrop(event, f)
  // };
}
