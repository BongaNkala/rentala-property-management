import React from 'react';

interface LoadingSkeletonProps {
  cards?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ cards = 6, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${className}`}>
      {Array.from({ length: cards }).map((_, idx) => (
        <div key={idx} className="glass-panel p-6 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
          <div className="flex justify-between items-start mb-4">
            <div className="skeleton h-6 w-20"></div>
            <div className="skeleton h-6 w-24"></div>
          </div>
          <div className="skeleton h-8 w-3/4 mb-2"></div>
          <div className="skeleton h-4 w-full mb-4"></div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-full"></div>
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-10 flex-1"></div>
            <div className="skeleton h-10 flex-1"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const TableLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
          <div className="skeleton h-12 flex-1"></div>
          <div className="skeleton h-12 w-32"></div>
          <div className="skeleton h-12 w-24"></div>
          <div className="skeleton h-12 w-20"></div>
          <div className="skeleton h-12 w-32"></div>
        </div>
      ))}
    </div>
  );
};

export const StatsLoadingSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="glass-panel p-6 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
          <div className="flex justify-between items-start mb-6">
            <div className="skeleton h-14 w-14 rounded-2xl"></div>
            <div className="skeleton h-6 w-16 rounded-full"></div>
          </div>
          <div className="skeleton h-10 w-32 mb-2"></div>
          <div className="skeleton h-5 w-40 mb-3"></div>
          <div className="skeleton h-4 w-full"></div>
        </div>
      ))}
    </div>
  );
};
