import React from 'react';

interface BadgeProps {
  text: string;
}

export const Badge: React.FC<BadgeProps> = ({ text }) => {
  return (
    <span className="bg-blue-500 text-white px-2 py-1 rounded">
      {text}
    </span>
  );
};
