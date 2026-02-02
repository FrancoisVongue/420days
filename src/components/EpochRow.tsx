import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Epoch, DailyEntry } from '../types';

interface EpochRowProps {
  epoch: Epoch;
  days: Array<{
    date: string;
    entry: DailyEntry | null;
    percentage: number;
    epoch: Epoch;
  }>;
  selectedDate: string;
  selectedMetricId: string;
  onDateSelect: (date: string) => void;
  isCurrentEpoch: boolean;
}

export const EpochRow: React.FC<EpochRowProps> = ({
  epoch,
  days,
  selectedDate,
  selectedMetricId,
  onDateSelect,
  isCurrentEpoch
}) => {
  const [tooltip, setTooltip] = useState<{ visible: boolean; content: string; x: number; y: number }>({
    visible: false,
    content: '',
    x: 0,
    y: 0
  });

  const todayDateString = dayjs().format('YYYY-MM-DD');

  const getColor = (percentage: number) => {
    if (percentage === 0) return '#ebedf0';
    if (percentage === 100) return '#474747'; // Dark gray for 100%
    
    const grayColors = ['#ebedf0', '#c6c6c6', '#959595', '#6e6e6e', '#474747'];
    const index = Math.min(Math.floor(percentage / 20), grayColors.length - 1);
    return grayColors[index];
  };

  const getBorderColor = (date: string) => {
    if (date === selectedDate) return '#3B82F6';
    if (date === todayDateString) return '#FF6B00';
    return '#e1e4e8';
  };

  const getBorderWidth = (date: string) => {
    if (date === selectedDate) return '2px';
    if (date === todayDateString) return '3px';
    return '1px';
  };

  const handleMouseEnter = (day: any, event: React.MouseEvent) => {
    const content = `
      <div><strong>${dayjs(day.date).format('MMMM D, YYYY')}</strong></div>
      <div>${epoch.name}</div>
      ${selectedMetricId ? `<div>Progress: ${day.percentage.toFixed(0)}%</div>` : ''}
    `;
    setTooltip({
      visible: true,
      content,
      x: event.clientX + 10,
      y: event.clientY - 40
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, content: '', x: 0, y: 0 });
  };

  return (
    <div className="epoch-row flex flex-col min-h-0">
      {isCurrentEpoch && (
        <div className="text-sm font-bold text-gray-800 mb-1 flex-shrink-0">
          📍 {epoch.name} ({epoch.startDate} → {epoch.endDate})
        </div>
      )}
      <div className="grid gap-1" style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(10px, 1fr))`,
        gridAutoRows: '1fr'
      }}>
        {days.map((day) => (
          <div
            key={day.date}
            className="cell cursor-pointer rounded transition-all hover:scale-110"
            style={{
              aspectRatio: '1',
              backgroundColor: getColor(day.percentage),
              border: `${getBorderWidth(day.date)} solid ${getBorderColor(day.date)}`
            }}
            onClick={() => onDateSelect(day.date)}
            onMouseEnter={(e) => handleMouseEnter(day, e)}
            onMouseLeave={handleMouseLeave}
          />
        ))}
      </div>

      {tooltip.visible && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  );
};
