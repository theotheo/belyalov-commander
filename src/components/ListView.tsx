
import * as React from "react";
import Markdown from 'markdown-to-jsx'
import { FileCard as FileCard } from "./FileCard.tsx";
import { useState, useEffect, SyntheticEvent, useMemo } from "react";
import "./ListView.css";

import { FileData } from "src/FileManager.ts";
import { Toolbar } from "./Toolbar.tsx";

type Props = {
  filesWithContent: FileData[];
  handleDragFile: Function;
  // onDragEnd: Function;
  // onDragOver: Function;
  handleDragFiles: Function;
  openFile: Function;
  renderMarkdown: boolean;
};

export function ListView({
  // onDragEnd,
  // onDragOver,
  filesWithContent,
  handleDragFile,
  handleDragFiles,
  openFile,
  renderMarkdown,
}: Props) {
  if (filesWithContent.length === 0) {
    return <h1>No files here</h1>;
  }

  const [targets, setTargets] = useState<Set<string>>(new Set());
  const [isGrid, setGrid] = useState<boolean>(false);
  const [sort, setSort] = useState<string>('name-asc');

  const onClick = (event: MouseEvent, file: FileData): void => {
    if (event.shiftKey) {
      setTargets((targets) => new Set(targets).add(file.filepath));
    } else {
      openFile({ extension: "md", path: file.filepath }, event);
    }
    event.stopPropagation();
  };

  const onDrag = (event: SyntheticEvent, file: FileData) => {
    // drag the selected files
    if (targets.has(file.filepath)) {
      handleDragFiles(event.nativeEvent, Array(...targets));

      // drag an other file
    } else {
      handleDragFile(event.nativeEvent, file.filepath);
    }
  };

  useEffect(() => {
    const filepaths = filesWithContent.map((f) => f.filepath);

    if (targets.size) {
      console.log(targets)
      setTargets(
        new Set(
          Array(...targets).filter((selected) => filepaths.contains(selected))
        )
      );  
    }

  }, [filesWithContent]);

  // TODO: need refactor
  useMemo(() => {    
    switch(sort) {
      case 'name-desc': 
        filesWithContent = filesWithContent.sort((a, b) => {
          if (a.name > b.name) return -1
          if (a.name < b.name) return 1;
          return 0; 
        })
        break;
      case 'name-asc': 
        filesWithContent = filesWithContent.sort((a, b) => {
          if (a.name < b.name) return -1
          if (a.name > b.name) return 1;
          return 0; 
        })
        break;
      case 'created-desc': 
        filesWithContent = filesWithContent.sort((a, b) => {
          return a.createdDate.diff(b.createdDate)
        })
        break;
      case 'created-asc': 
        filesWithContent = filesWithContent.sort((a, b) => {
          return b.createdDate.diff(a.createdDate)
        })
        break;
      case 'updated-desc': 
        filesWithContent = filesWithContent.sort((a, b) => {
          return a.updatedDate.diff(b.updatedDate) 
        })
        break;
      case 'updated-asc': 
        filesWithContent = filesWithContent.sort((a, b) => { 
          return b.updatedDate.diff(a.updatedDate)
        })
        break;
    }

  }, [sort])

  return (
    <>
      <Toolbar setGrid={setGrid} isGrid={isGrid} sort={sort} setSort={setSort} />
      <div
        className={`list-cards ${isGrid ? "grid" : ""}`}
        onClick={() => setTargets(new Set())}
      >
        {filesWithContent.map((file, idx) => (
          <FileCard
              key={idx}
              className={"list-card-instance"}
              selected={targets.has(file.filepath) ? true : false}
              file={file}
              handleDrag={(event: SyntheticEvent) => onDrag(event, file)}
              handleClick={(event: any): void => onClick(event, file)}
            preview={(file: FileData) => {
              const content = file.content.trim().substring(0, 300)

              if (renderMarkdown) {
                return (
                  <div className="content">
                    <Markdown>{content}</Markdown>
                  </div>
                );
              } else {
                return (
                  <pre
                    className="content"
                    dangerouslySetInnerHTML={{
                      __html: content,
                    }}
                  ></pre>
                );
              }
            }}
          />
        ))}
      </div>
    </>
  );
}