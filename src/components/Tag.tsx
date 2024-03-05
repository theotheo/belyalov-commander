import React from 'react';
import "./Tag.css";

type Props = {
  className: string,
  text: string
}

export const Tag = ({ className, text}: Props) => {
  return (
    <div className={`${className}`}>#{text}
    </div>
  );
};
