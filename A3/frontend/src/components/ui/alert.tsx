import React from 'react';

interface AlertProps {
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'default', children }) => {
  return (
    <div className={`alert ${variant}`}>
      {children}
    </div>
  );
};

export const AlertTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="alert-title">{children}</h2>
);

export const AlertDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="alert-description">{children}</p>
); 

