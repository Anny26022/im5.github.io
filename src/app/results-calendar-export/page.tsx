"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Papa from "papaparse";
import { CalendarIcon, Copy, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { CustomCalendar } from "@/components/ui/custom-calendar";

function formatDateNew(input: string) {
  if (!input) return "";
  const [day, month, year] = input.split(" ");
  const d = day.padStart(2, "0");
  const monthNames = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
  ];
  const m = monthNames[["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"].indexOf(month.toUpperCase())] || month.slice(0,3).toUpperCase();
  return `${d}-${m}-${year}`;
}

function parseFormattedDate(input: string) {
  const [day, month, year] = input.split("-");
  const monthNames = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
  ];
  const monthIndex = monthNames.indexOf(month);
  if (monthIndex === -1) return new Date();

  return new Date(parseInt(year), monthIndex, parseInt(day));
}

const fetchResultsCalendar = async () => {
  const resp = await fetch("/data/Results_Calendar.csv");
  const csv = await resp.text();
  const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });
  return data;
};

interface DateOption {
  value: string;
  label: string;
  date: Date;
  symbols: string[];
}

export default function ResultsCalendarExportPage() {
  const [tradingViewText, setTradingViewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateMap, setDateMap] = useState<Record<string, Set<string>>>({});
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterSymbol, setFilterSymbol] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateFilterType, setDateFilterType] = useState<"all" | "range" | "select">("all");
  const [allDates, setAllDates] = useState<string[]>([]);

  useEffect(() => {
    const runFetch = () => {
      fetchResultsCalendar().then((rows) => {
        const newDateMap: Record<string, Set<string>> = {};
        const dates: string[] = [];
        rows.forEach((row: any) => {
          const rawDate = row["Result Date"];
          const symbol = row["Security Name"]?.trim().toUpperCase();
          // Optionally, grab company name: row["Company name"]
          if (!rawDate || !symbol) return;
          // Parse date string '16 Apr 2025' to the formatDateNew expectation:
          const [d, m, y] = rawDate.split(" ");
          const formattedDate = `${d}-${m.toUpperCase()}-${y}`;
          if (!newDateMap[formattedDate]) {
            newDateMap[formattedDate] = new Set();
            dates.push(formattedDate);
          }
          newDateMap[formattedDate].add(symbol);
        });
        dates.sort((a, b) => {
          const dateA = parseFormattedDate(a);
          const dateB = parseFormattedDate(b);
          return dateA.getTime() - dateB.getTime();
        });
        setAllDates(dates);
        const options: DateOption[] = dates.map(date => {
          const symbols = Array.from(newDateMap[date]);
          return {
            value: date,
            label: `${date} (${symbols.length} symbols)`,
            date: parseFormattedDate(date),
            symbols
          };
        });
        setDateOptions(options);
        setDateMap(newDateMap);
        if (dates.length > 0) {
          setStartDate(dates[0]);
          setEndDate(dates[dates.length - 1]);
          setSelectedDates(dates);
        }
        updateTradingViewFormat(newDateMap, dates, {
          sortOrder: sortOrder,
          filterSymbol: ""
        });
        setLoading(false);
      });
    };
    if (typeof window !== 'undefined' && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(runFetch);
    } else {
      setTimeout(runFetch, 0);
    }
  }, []);

  useEffect(() => {
    if (Object.keys(dateMap).length === 0) return;

    let filteredDates: string[] = [];

    if (dateFilterType === "all") {
      filteredDates = allDates;
    } else if (dateFilterType === "range") {
      const start = parseFormattedDate(startDate);
      const end = parseFormattedDate(endDate);

      filteredDates = allDates.filter(date => {
        const dateObj = parseFormattedDate(date);
        return dateObj >= start && dateObj <= end;
      });
    } else if (dateFilterType === "select") {
      filteredDates = selectedDates;
    }

    updateTradingViewFormat(dateMap, filteredDates, {
      sortOrder,
      filterSymbol
    });
  }, [
    dateMap,
    selectedDates,
    sortOrder,
    filterSymbol,
    dateFilterType,
    startDate,
    endDate
  ]);

  const updateTradingViewFormat = (
    dateMap: Record<string, Set<string>>,
    dates: string[],
    options: {
      sortOrder: "asc" | "desc",
      filterSymbol: string
    }
  ) => {
    let sortedDates = [...dates];
    if (options.sortOrder === "asc") {
      sortedDates.sort((a, b) => {
        const dateA = parseFormattedDate(a);
        const dateB = parseFormattedDate(b);
        return dateA.getTime() - dateB.getTime();
      });
    } else {
      sortedDates.sort((a, b) => {
        const dateA = parseFormattedDate(a);
        const dateB = parseFormattedDate(b);
        return dateB.getTime() - dateA.getTime();
      });
    }

    const sections: string[] = [];
    sortedDates.forEach(date => {
      let syms = Array.from(dateMap[date] || []);

      if (options.filterSymbol) {
        syms = syms.filter(s =>
          s.toLowerCase().includes(options.filterSymbol.toLowerCase())
        );
      }

      if (syms.length === 0) return;

      const symbolsFormatted = syms.map(s =>
        `NSE:${s}`
      ).join(",");

      let section = `### ${date},${symbolsFormatted}`;
      sections.push(section);
    });

    setTradingViewText(sections.join(", "));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tradingViewText);
    setCopied(true);
    toast.success("Copied to clipboard!");

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([tradingViewText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "results_calendar_tradingview_format.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Download started!");
  };

  const handleSelectAll = () => {
    setSelectedDates(allDates);
  };

  const handleDeselectAll = () => {
    setSelectedDates([]);
  };

  const handleDateFilterTypeChange = (tab: 'all' | 'range' | 'select') => {
    setDateFilterType(tab);
    if (tab === 'range') {
      const today = new Date();
      function toDMY(dt) {
        const d = String(dt.getDate()).padStart(2, '0');
        const mArr = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const m = mArr[dt.getMonth()];
        const y = dt.getFullYear();
        return `${d}-${m}-${y}`;
      }
      const todayStr = toDMY(today);
      let pickStart = "";
      if (allDates.includes(todayStr)) pickStart = todayStr;
      else {
        const sorted = allDates.slice().sort((a,b)=>parseFormattedDate(a)-parseFormattedDate(b));
        const future = sorted.find(d => parseFormattedDate(d)>=today);
        pickStart = future || sorted[sorted.length-1] || "";
      }
      setStartDate(pickStart);
      setEndDate("");
    } else if (tab === 'select') {
      setSelectedDates([]);
    }
  };

  return (
    <div className="flex-1 px-1.5 sm:px-2 py-4 sm:py-6 md:p-8 max-w-5xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-3 px-1">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <span className="font-medium text-foreground">Results Calendar Export</span>
      </nav>
      <Card className="shadow-xl w-full mb-6">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">TradingView Export</CardTitle>
          <CardDescription>
            Copy the text and paste to TradingView screener or download for analysis. Live preview below updates as you adjust options.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2 w-full">
          {loading ? (
            <div className="flex items-center justify-center h-32"><span className="animate-spin">🔄</span> Loading...</div>
          ) : (
            <>
              <div className="flex gap-2 flex-wrap mb-2 w-full">
                <Button variant="outline" size="sm" onClick={handleCopy} className={copied ? "border-primary bg-primary/10 animate-pulse" : ""}>
                  <Copy className="w-4 h-4 mr-2" /> {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              </div>
              <div className="rounded-lg border bg-muted font-mono text-xs sm:text-xs md:text-sm p-3 max-h-80 overflow-y-auto animate-fade-in whitespace-pre-wrap select-all w-full" style={{fontSize:'0.93rem',lineHeight:'1.55',wordBreak:'break-word'}}>
                {tradingViewText || <span className="text-muted-foreground">Nothing to export</span>}
              </div>
              <div className="w-full">
                <div className="mt-2">
                  <div className="font-semibold text-base mb-1 mt-6 md:mt-3">Date Filter</div>
                  <Tabs defaultValue={dateFilterType} onValueChange={handleDateFilterTypeChange} className="w-full">
                    <TabsList className="bg-muted rounded-xl p-1 gap-1 w-full flex">
                      <TabsTrigger value="all" className="flex-1 rounded-lg px-3 py-1.5 text-xs md:text-sm">All</TabsTrigger>
                      <TabsTrigger value="range" className="flex-1 rounded-lg px-3 py-1.5 text-xs md:text-sm">Range</TabsTrigger>
                      <TabsTrigger value="select" className="flex-1 rounded-lg px-3 py-1.5 text-xs md:text-sm">Pick</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="py-3 text-muted-foreground text-sm">All dates included.</TabsContent>
                    <TabsContent value="range" className="py-3 flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                      <CustomCalendar
                        label="Start Date"
                        selectedDate={startDate}
                        onDateSelect={setStartDate}
                        enabledDates={allDates}
                      />
                      <CustomCalendar
                        label="End Date"
                        selectedDate={endDate}
                        onDateSelect={setEndDate}
                        enabledDates={allDates}
                      />
                    </TabsContent>
                    <TabsContent value="select" className="py-3 flex flex-wrap gap-2 w-full">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={selectedDates.length === allDates.length ? "border border-primary bg-primary/10" : ""}
                        onClick={handleSelectAll}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={selectedDates.length === 0 ? "border border-primary bg-primary/10" : ""}
                        onClick={handleDeselectAll}
                      >
                        Deselect All
                      </Button>
                      <div className="w-full h-2" />
                      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto w-full">
                        {dateOptions.map((opt) => (
                          <button
                            key={opt.value}
                            className={`rounded-full px-3 py-1.5 text-xs border transition-colors
                              ${selectedDates.includes(opt.value) ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground hover:border-primary hover:bg-primary/5"}`}
                            onClick={() => setSelectedDates(sel => sel.includes(opt.value)
                              ? sel.filter(v => v !== opt.value)
                              : [...sel, opt.value])}
                            type="button"
                            style={{ minWidth: 'min-content' }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 md:gap-8 items-start w-full">
        <div className="space-y-4 md:space-y-6">
          <Card className="shadow-md w-full mb-4 md:mb-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-2 w-full">
              <Input
                type="text"
                placeholder="Filter by symbol (e.g. RELIANCE)"
                value={filterSymbol}
                onChange={e => setFilterSymbol(e.target.value)}
                className="text-xs md:text-sm w-full"
              />
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center gap-3 w-full">
                  <Label className="text-xs">Order:</Label>
                  <Button size="sm" variant={sortOrder === "asc" ? "secondary" : "ghost"} onClick={() => setSortOrder("asc")}>Ascending</Button>
                  <Button size="sm" variant={sortOrder === "desc" ? "secondary" : "ghost"} onClick={() => setSortOrder("desc")}>Descending</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mb-6">
        <CardFooter className="px-6 py-3 border-t bg-muted/20">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>
              {dateFilterType === "all" && `Showing all dates (${allDates.length})`}
              {dateFilterType === "range" && `Showing date range from ${startDate || "..."} to ${endDate || "..."}`}
              {dateFilterType === "select" && `Showing ${selectedDates.length} selected dates`}
            </span>
          </div>
        </CardFooter>
      </Card>

      <div className="text-muted-foreground text-sm">
        <h3 className="font-medium mb-2">Instructions:</h3>
        <ul className="list-disc ml-5 space-y-1">
          <li>Select dates using the options above</li>
          <li>The format matches TradingView's watchlist import format</li>
          <li>Each date is a separate group prefixed with ###</li>
          <li>Copy the output directly or download as a text file</li>
          <li>Paste into TradingView's watchlist import tool</li>
        </ul>
      </div>
    </div>
  );
}
