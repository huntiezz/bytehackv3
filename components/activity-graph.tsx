"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface ActivityData {
  date: string;
  count: number;
  posts: number;
  comments: number;
}

interface ActivityGraphProps {
  userId: string;
}

export function ActivityGraph({ userId }: ActivityGraphProps) {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalContributions, setTotalContributions] = useState(0);

  useEffect(() => {
    fetchActivity();
  }, [userId]);

  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/user/${userId}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivityData(data.activity);
        setTotalContributions(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Generate last 365 days
  const generateDays = () => {
    const days: ActivityData[] = [];
    const today = new Date();
    
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existing = activityData.find(d => d.date === dateStr);
      days.push(existing || { date: dateStr, count: 0, posts: 0, comments: 0 });
    }
    
    return days;
  };

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-zinc-900/50 border border-zinc-800/50';
    if (count <= 2) return 'bg-green-900/40 border border-green-800/50';
    if (count <= 5) return 'bg-green-700/50 border border-green-600/50';
    if (count <= 10) return 'bg-green-600/60 border border-green-500/50';
    return 'bg-green-500/70 border border-green-400/50';
  };

  // Group days by week
  const groupByWeeks = () => {
    const days = generateDays();
    const weeks: ActivityData[][] = [];
    let currentWeek: ActivityData[] = [];

    // Find the first Monday or start of data
    const firstDate = new Date(days[0].date);
    const dayOfWeek = firstDate.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Add empty cells for days before first Monday
    for (let i = 0; i < daysUntilMonday; i++) {
      currentWeek.push({ date: '', count: -1, posts: 0, comments: 0 });
    }

    days.forEach((day, index) => {
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', count: -1, posts: 0, comments: 0 });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekDays = ['Mon', 'Wed', 'Fri'];

  if (loading) {
    return (
      <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-zinc-800 rounded w-48"></div>
          <div className="h-24 bg-zinc-800 rounded"></div>
        </div>
      </div>
    );
  }

  const weeks = groupByWeeks();
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">
            {totalContributions} contributions in the last year
          </h3>
        </div>
        <div className="text-xs text-zinc-500">{currentYear}</div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex gap-[3px] mb-2 ml-[30px]">
            {Array.from({ length: 53 }).map((_, weekIndex) => {
              const weekDate = new Date();
              weekDate.setDate(weekDate.getDate() - (364 - weekIndex * 7));
              const month = weekDate.getMonth();
              const isFirstWeekOfMonth = weekDate.getDate() <= 7;

              return (
                <div key={weekIndex} className="w-[11px]">
                  {isFirstWeekOfMonth && (
                    <span className="text-[10px] text-zinc-500">
                      {months[month]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-[3px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] pr-2">
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className="h-[11px] flex items-center"
                  style={{ marginTop: index === 0 ? '0' : index === 1 ? '11px' : '11px' }}
                >
                  <span className="text-[10px] text-zinc-500 w-[22px]">{day}</span>
                </div>
              ))}
            </div>

            {/* Activity grid */}
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIndex) => {
                    if (day.count === -1) {
                      return <div key={`${weekIndex}-${dayIndex}`} className="w-[11px] h-[11px]" />;
                    }

                    const date = new Date(day.date);
                    const dayNum = date.getDate();
                    const monthName = date.toLocaleDateString('en-US', { month: 'long' });
                    const ordinal = getOrdinalSuffix(dayNum);
                    
                    const tooltip = day.count > 0
                      ? `${day.count} contribution${day.count !== 1 ? 's' : ''} on ${monthName} ${dayNum}${ordinal}.`
                      : `No contributions on ${monthName} ${dayNum}${ordinal}.`;

                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`w-[11px] h-[11px] rounded-sm transition-all hover:ring-2 hover:ring-green-500/50 cursor-pointer ${getColorClass(day.count)}`}
                        title={tooltip}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 ml-[30px]">
            <span className="text-[10px] text-zinc-500">Less</span>
            <div className="flex gap-[3px]">
              <div className="w-[11px] h-[11px] rounded-sm bg-zinc-900/50 border border-zinc-800/50" />
              <div className="w-[11px] h-[11px] rounded-sm bg-green-900/40 border border-green-800/50" />
              <div className="w-[11px] h-[11px] rounded-sm bg-green-700/50 border border-green-600/50" />
              <div className="w-[11px] h-[11px] rounded-sm bg-green-600/60 border border-green-500/50" />
              <div className="w-[11px] h-[11px] rounded-sm bg-green-500/70 border border-green-400/50" />
            </div>
            <span className="text-[10px] text-zinc-500">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

