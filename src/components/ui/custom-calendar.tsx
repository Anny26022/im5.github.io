import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CustomCalendarProps {
  selectedDate: string | null; // date string 'DD-MMM-YYYY'
  onDateSelect: (date: string) => void;
  enabledDates: string[]; // valid 'DD-MMM-YYYY' dates
  label?: string;
}

function parse(dateStr: string) {
  // '08-APR-2025' => Date
  const [d, m, y] = dateStr.split('-');
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return new Date(Number(y), months.indexOf(m.toUpperCase()), Number(d));
}

function format(date: Date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][date.getMonth()];
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

export const CustomCalendar: React.FC<CustomCalendarProps> = ({
  selectedDate,
  onDateSelect,
  enabledDates,
  label,
}) => {
  // Calendar state: current month and year
  const [month, setMonth] = React.useState(() => selectedDate ? parse(selectedDate).getMonth() : new Date().getMonth());
  const [year, setYear] = React.useState(() => selectedDate ? parse(selectedDate).getFullYear() : new Date().getFullYear());

  // Compute enabled dates for this month
  const enabledSet = useMemo(() => new Set(enabledDates), [enabledDates]);
  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const firstDay = useMemo(() => new Date(year, month, 1).getDay(), [year, month]);

  // Dates for this month's grid
  const calendarGrid = useMemo(() => {
    const days: { date: Date; enabled: boolean; formatted: string }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const formatted = format(date);
      days.push({ date, enabled: enabledSet.has(formatted), formatted });
    }
    return days;
  }, [year, month, daysInMonth, enabledSet]);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  }

  return (
    <div className="w-full max-w-xs rounded-lg border bg-background p-3 flex flex-col items-center">
      {label && <div className="text-xs mb-2 font-semibold text-primary/90">{label}</div>}
      <div className="flex items-center justify-between w-full mb-2">
        <button
          title="Prev Month"
          className="rounded p-1 hover:bg-muted focus-visible:ring focus-visible:outline-none transition-colors"
          onClick={prevMonth}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="font-medium text-sm">{
          `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month]} ${year}`
        }</div>
        <button
          title="Next Month"
          className="rounded p-1 hover:bg-muted focus-visible:ring focus-visible:outline-none transition-colors"
          onClick={nextMonth}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 w-full mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
          <div key={d} className="text-[11px] text-center font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 w-full">
        {/* Empty cells before first day */}
        {Array(firstDay).fill(0).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {/* Day cells */}
        {calendarGrid.map(({ date, enabled, formatted }) => {
          const isSelected = formatted === selectedDate;
          return (
            <button
              key={formatted}
              className={`rounded-md aspect-square h-8 w-8 md:h-9 md:w-9 text-sm flex items-center justify-center
                ${!enabled ? "text-muted-foreground bg-muted cursor-not-allowed opacity-50" :
                  isSelected ? "bg-primary text-primary-foreground font-semibold shadow-md" :
                    "hover:bg-primary/10 focus-visible:ring-1 focus-visible:ring-primary"}
                transition-colors`}
              style={{ transitionDuration: '120ms' }}
              disabled={!enabled}
              tabIndex={enabled ? 0 : -1}
              onClick={() => enabled && onDateSelect(formatted)}
              aria-pressed={isSelected}
              aria-label={formatted}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};
