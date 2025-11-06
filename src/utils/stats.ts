import { DailyEntry, WritingStats } from '../types';

export const calculateStats = (entries: DailyEntry[]): WritingStats => {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      averageSatisfaction: 0,
      currentStreak: 0,
      longestStreak: 0,
      satisfiedDays: 0,
    };
  }

  const totalEntries = entries.length;
  const totalSatisfaction = entries.reduce((sum, entry) => sum + entry.satisfaction, 0);
  const averageSatisfaction = Math.round(totalSatisfaction / totalEntries);
  const satisfiedDays = entries.filter(entry => entry.satisfaction >= 70).length;

  // Calculate streaks
  const sortedEntries = entries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  let currentDate = new Date(today);

  // Calculate current streak
  for (let i = 0; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i].date);
    const expectedDate = new Date(currentDate);
    expectedDate.setHours(0, 0, 0, 0);
    entryDate.setHours(0, 0, 0, 0);

    if (entryDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak
  for (let i = 0; i < sortedEntries.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const currentEntryDate = new Date(sortedEntries[i].date);
      const prevEntryDate = new Date(sortedEntries[i - 1].date);
      const dayDiff = Math.abs(
        (prevEntryDate.getTime() - currentEntryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    totalEntries,
    averageSatisfaction,
    currentStreak,
    longestStreak,
    satisfiedDays,
  };
};


export const getWritingDaysInMonth = (entries: DailyEntry[], year: number, month: number): Set<number> => {
  const writingDays = new Set<number>();
  
  entries.forEach(entry => {
    const entryDate = new Date(entry.date);
    if (entryDate.getFullYear() === year && entryDate.getMonth() === month) {
      writingDays.add(entryDate.getDate());
    }
  });
  
  return writingDays;
};