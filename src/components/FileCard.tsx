import "./FileCard.css";
import "../other.css";

import React, { MouseEventHandler } from "react";
import { Icon } from "./Icon.tsx";
import { Tag } from "./Tag.tsx";
import { FileData } from '../FileManager.ts'

type Props = {
  file: FileData;
  handleDrag: MouseEventHandler;
  handleClick: MouseEventHandler;
  selected: boolean;
  className: string;
};

// const ToC = ({ headings }) => {
//   // console.log(headings);

//   if (headings === undefined) return "";

//   return headings.map((heading) => (
//     <p>
//       {"#".repeat(heading.level)} {heading.heading}
//     </p>
//   ));
// };

// const ToolTip = ({ headings, children }) => {
//   return (
//     <div className="my-tooltip">
//       {children}
//       <span className="tooltip-text">
//         <ToC headings={headings} />
//       </span>
//     </div>
//   );
// };

export const FileCard = (props: Props) => {
  const { handleClick, handleDrag, file, selected, className } = props;

  return (
    <div
      draggable
      onClick={handleClick}
      onDragStart={handleDrag}
      className={`list-card ${className} default ${selected ? "selected" : ""}`}
    >
      {selected}
      <div className="header">
        <div className="title">{file.name}</div>
        <div className="created-date">{file.createdDate.fromNow()}</div>
      </div>
      <div className="body">
        <pre
          className="content"
          dangerouslySetInnerHTML={{ __html: file.content.trim().substring(0, 300) }}
        ></pre>
        {file.imgSrc && <img className="image" alt="Image" src={file.imgSrc} />}
      </div>
      <div className="footer">
        <div className="tags">
          {file.tags &&
            file.tags.map((tag: string, idx) => <Tag className="tag" key={idx} text={tag} />)}
        </div>
        {file.tasksStat && 
          <div className="tasks">
            <Icon name={"check-square"} />
            <div>
              <span>{file.tasksStat.closed}</span>/
              <span>{file.tasksStat.total}</span>
            </div>
          </div>
        }
      </div>
    </div>
  );
};
