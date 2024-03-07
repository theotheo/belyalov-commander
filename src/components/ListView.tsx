
import * as React from "react";
import { ListCard } from "./ListCard.tsx";
import { useState, useEffect, SyntheticEvent } from "react";
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
};

export function ListView({
  // onDragEnd,
  // onDragOver,
  filesWithContent,
  handleDragFile,
  handleDragFiles,
  openFile,
}: Props) {
  if (filesWithContent.length === 0) {
    return <h1>No files here</h1>;
  }

  const [targets, setTargets] = useState<Set<string>>(new Set());
  const [isGrid, setGrid] = useState<boolean>(false);
  const [sort, setSort] = useState<string>('name-desc');

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
  useEffect(() => {
    switch(sort) {
      case 'name-desc': 
        filesWithContent = filesWithContent.sort((a, b) => {
          if (a.name > b.name) return 1
          if (a.name < b.name) return -1;
          return 0; 
        })
        break;
      case 'name-asc': 
        filesWithContent = filesWithContent.sort((a, b) => {
          if (a.name < b.name) return 1
          if (a.name > b.name) return -1;
          return 0; 
        })
        break;
      case 'created-desc': 
        filesWithContent = filesWithContent.sort((a, b) => {
          if (a.createdDate > b.createdDate) return 1
          if (a.createdDate < b.createdDate) return -1;
          return 0; 
        })
      break;
      case 'created-asc': 
        filesWithContent = filesWithContent.sort((a, b) => {
          if (a.createdDate < b.createdDate) return 1
          if (a.createdDate > b.createdDate) return -1;
          return 0; 
        })
      break;
      case 'updated-desc': 
      filesWithContent = filesWithContent.sort((a, b) => {
        if (a.updatedDate > b.updatedDate) return 1
        if (a.updatedDate < b.updatedDate) return -1;
        return 0; 
      })
      break;
      case 'updated-asc': 
        filesWithContent = filesWithContent.sort((a, b) => {
          if (a.updatedDate < b.updatedDate) return 1
          if (a.updatedDate > b.updatedDate) return -1;
          return 0; 
        })
    break;
    }

  }, [sort, filesWithContent])

  return (
    <>
      <Toolbar setGrid={setGrid} isGrid={isGrid} sort={sort} setSort={setSort} />
      <div
        className={`list-cards ${isGrid ? "grid" : ""}`}
        onClick={() => setTargets(new Set())}
      >
        {filesWithContent.map((file, idx) => (
          <ListCard
              key={idx}
              className={"list-card-instance"}
              selected={targets.has(file.filepath) ? true : false}
              file={file}
              handleDrag={(event: SyntheticEvent) => onDrag(event, file)}
              handleClick={(event: any): void => onClick(event, file)}
          />
        ))}
      </div>
    </>
  );
}