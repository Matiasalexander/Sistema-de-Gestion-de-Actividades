import React from 'react';

interface StatusBadgeProps {
  label: string;
  colorHex?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  colorHex = '#2563EB',
  size = 'sm',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{
        backgroundColor: `${colorHex}18`,
        color: colorHex,
        borderColor: `${colorHex}40`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: colorHex }}
      />
      {label}
    </span>
  );
};
