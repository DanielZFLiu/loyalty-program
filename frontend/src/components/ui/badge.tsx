import React, { ReactElement } from 'react';

interface BadgeProps {
  text: string;
  classes?: string;
  innerChild?: ReactElement
}

export const Badge: React.FC<BadgeProps> = ({ text, classes = "", innerChild = <div></div> }) => {
  return (
    <span className={`bg-blue-500 text-white px-2 py-1 rounded flex items-center gap-2 ${classes}`}>
      {text}
      {innerChild}
    </span>
  );
};
