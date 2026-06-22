interface DayData {
  date: string;
  count: number;
}

interface Props {
  data: DayData[];
}

const WEEK_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

function colorClass(count: number): string {
  if (count === 0) return 'bg-gray-100';
  if (count <= 2) return 'bg-green-200';
  if (count <= 5) return 'bg-green-400';
  if (count <= 9) return 'bg-green-600';
  return 'bg-green-800';
}

export function CalendarHeatmap({ data }: Props) {
  const countByDate = new Map(data.map((d) => [d.date, d.count]));

  // Build a 52-week grid ending today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from the Monday 52 weeks ago
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);
  const dow = startDate.getDay();
  const daysToMonday = dow === 0 ? 6 : dow - 1;
  startDate.setDate(startDate.getDate() - daysToMonday);

  const weeks: Array<Array<{ dateStr: string; count: number; isPlaceholder: boolean }>> = [];
  const cursor = new Date(startDate);

  while (cursor <= today) {
    const week: typeof weeks[0] = [];
    for (let dow = 0; dow < 7; dow++) {
      const d = new Date(cursor);
      d.setDate(cursor.getDate() + dow);
      if (d > today) {
        week.push({ dateStr: '', count: 0, isPlaceholder: true });
      } else {
        const dateStr = d.toISOString().slice(0, 10);
        week.push({ dateStr, count: countByDate.get(dateStr) ?? 0, isPlaceholder: false });
      }
    }
    weeks.push(week);
    cursor.setDate(cursor.getDate() + 7);
  }

  const totalAnswered = data.reduce((s, d) => s + d.count, 0);
  const activeDays = data.filter((d) => d.count > 0).length;

  // Month labels: collect the month name at the first column of each new month
  const monthLabels: Array<{ label: string; colIndex: number }> = [];
  weeks.forEach((week, colIndex) => {
    const firstNonPlaceholder = week.find((d) => !d.isPlaceholder);
    if (!firstNonPlaceholder) return;
    const date = new Date(firstNonPlaceholder.dateStr);
    if (date.getDate() <= 7) {
      monthLabels.push({
        label: `${date.getMonth() + 1}月`,
        colIndex,
      });
    }
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-800">学習カレンダー</h2>
        <span className="text-xs text-gray-400">
          過去1年 {activeDays}日 / 計{totalAnswered}回答
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-0">
          {/* Day-of-week labels — pt-[20px] offsets the month-label row (h-4=16px + mb-1=4px) */}
          <div className="flex flex-col gap-[2px] pr-2 pt-[20px]">
            {WEEK_LABELS.map((label, i) => (
              <div key={i} className="h-[10px] flex items-center">
                <span className="text-[10px] text-gray-400 leading-none">
                  {i % 2 === 0 ? label : ''}
                </span>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div>
            {/* Month labels row: h-4 (16px) + mb-1 (4px) = 20px */}
            <div className="flex h-4 mb-1">
              {weeks.map((_, colIndex) => {
                const ml = monthLabels.find((m) => m.colIndex === colIndex);
                return (
                  <div key={colIndex} className="w-3 shrink-0 flex items-end">
                    {ml && (
                      <span className="text-[10px] text-gray-400 whitespace-nowrap leading-none">
                        {ml.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day cells */}
            <div className="flex gap-[2px]">
              {weeks.map((week, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-[2px]">
                  {week.map((day, rowIndex) => (
                    <div
                      key={rowIndex}
                      title={day.isPlaceholder ? '' : `${day.dateStr}: ${day.count}回`}
                      className={`w-[10px] h-[10px] rounded-sm ${
                        day.isPlaceholder ? 'bg-transparent' : colorClass(day.count)
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[10px] text-gray-400">少</span>
        {[0, 2, 5, 9, 10].map((n) => (
          <div key={n} className={`w-[10px] h-[10px] rounded-sm ${colorClass(n)}`} />
        ))}
        <span className="text-[10px] text-gray-400">多</span>
      </div>
    </div>
  );
}
