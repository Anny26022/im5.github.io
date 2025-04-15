"use client"

import { useState, useRef, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { StockData } from "@/lib/data-processor"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Download, Star as StarIcon, Copy as CopyIcon, Eye, ChevronDown } from "lucide-react"
import { useAppContext } from "@/context/app-context"
import { IndustryChart, IndustryChartRef } from "@/components/industry-chart"
import { Input } from "@/components/ui/input"

interface ResultsDisplayProps {
  mappedSymbols: StockData[]
  invalidSymbols: string[]
  tvFormattedOutput: string
  flatOutput: string
  showFundamentals: boolean
  onAddToWatchlist?: (symbols: string[]) => void
}

export function ResultsDisplay({
  mappedSymbols,
  invalidSymbols,
  tvFormattedOutput,
  flatOutput,
  showFundamentals,
  onAddToWatchlist
}: ResultsDisplayProps) {
  const [currentTab, setCurrentTab] = useState("tradingview")
  const { isInWatchlist } = useAppContext()
  const industryChartRef = useRef<IndustryChartRef>(null);

  // State for download dropdown visibility
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const downloadBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        downloadBtnRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !downloadBtnRef.current.contains(event.target as Node)
      ) {
        setShowDownloadOptions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search state for filtering
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Filter visibility state
  const [showFilterOptions, setShowFilterOptions] = useState<boolean>(false)

  // Get filtered symbols
  const filteredSymbols = mappedSymbols.filter(stock => {
    if (searchQuery) {
      return (
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.industry.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return true
  })

  const handleCopyToClipboard = () => {
    const textToCopy = tvFormattedOutput
    navigator.clipboard.writeText(textToCopy)
    toast.success("Copied to clipboard!")
  }

  // Function to handle fundamentals download
  const handleDownloadFundamentals = () => {
    // Create CSV content with fundamentals
    let csvContent = "Symbol,Industry,RS Rating,EPS Latest Quarter,QoQ % EPS,YoY % EPS,Sales Latest Quarter,QoQ % Sales,YoY % Sales,Results Date\n"

    filteredSymbols.forEach((stock) => {
      const fundamentals = stock.fundamentals || {}
      csvContent += `${stock.symbol},${stock.industry},${fundamentals.rsRating || ""},${fundamentals.epsLatestQuarter || ""},${fundamentals.qoqEpsLatest || ""},${fundamentals.yoyEpsLatest || ""},${fundamentals.salesLatestQuarter || ""},${fundamentals.qoqSalesLatest || ""},${fundamentals.yoySalesLatest || ""},${stock.resultsDate || ""}\n`
    })

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "stock_fundamentals.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Function to handle CSV download
  const handleDownloadCSV = () => {
    // Create CSV content
    let csvContent = "Symbol,Industry\n"
    filteredSymbols.forEach((stock) => {
      csvContent += `${stock.symbol},${stock.industry}\n`
    })

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "symbol_industry_mapping.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Close dropdown
    setShowDownloadOptions(false);
  }

  // Function to handle chart download - simple version (just the chart)
  const handleDownloadChart = () => {
    if (industryChartRef.current) {
      industryChartRef.current.downloadChart();
      setShowDownloadOptions(false);
    }
  }

  // Function to handle chart download with data
  const handleDownloadChartWithData = () => {
    if (industryChartRef.current) {
      industryChartRef.current.downloadChartWithData();
      setShowDownloadOptions(false);
    }
  }

  const handleAddToWatchlist = (symbol: string) => {
    if (onAddToWatchlist) {
      onAddToWatchlist([symbol])
    }
  }

  const handleAddAllToWatchlist = () => {
    if (onAddToWatchlist) {
      const symbols = filteredSymbols.map(stock => stock.symbol)
      onAddToWatchlist(symbols)
    }
  }

  if (filteredSymbols.length === 0) {
    return null
  }

  // Toggle download dropdown
  const toggleDownloadDropdown = () => {
    setShowDownloadOptions(prev => !prev);
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-end gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilterOptions(!showFilterOptions)}
          className="text-muted-foreground hover:text-foreground transition-colors h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="tradingview" className="w-full" onValueChange={setCurrentTab}>
        <TabsList className="w-full flex flex-wrap justify-center gap-1 mb-2">
          <TabsTrigger
            value="tradingview"
            className={`text-xs sm:text-sm flex-1 min-w-[30%] sm:min-w-[23%] py-1.5 transition-all duration-150 ${
              currentTab === "tradingview" ? "scale-[1.02] opacity-100" : "scale-[0.98] opacity-90"
            }`}
          >
            TradingView
          </TabsTrigger>

          {showFundamentals &&
            <TabsTrigger
              value="fundamentals"
              className={`text-xs sm:text-sm flex-1 min-w-[30%] sm:min-w-[23%] py-1.5 transition-all duration-150 ${
                currentTab === "fundamentals" ? "scale-[1.02] opacity-100" : "scale-[0.98] opacity-90"
              }`}
            >
              Fundamentals
            </TabsTrigger>
          }

          <TabsTrigger
            value="distribution"
            className={`text-xs sm:text-sm flex-1 min-w-[30%] sm:min-w-[23%] py-1.5 transition-all duration-150 ${
              currentTab === "distribution" ? "scale-[1.02] opacity-100" : "scale-[0.98] opacity-90"
            }`}
          >
            Distribution
          </TabsTrigger>

          <TabsTrigger
            value="mapping"
            className={`text-xs sm:text-sm flex-1 min-w-[30%] sm:min-w-[23%] py-1.5 transition-all duration-150 ${
              currentTab === "mapping" ? "scale-[1.02] opacity-100" : "scale-[0.98] opacity-90"
            }`}
          >
            Mapping
          </TabsTrigger>
        </TabsList>

        {/* TradingView Format Tab */}
        <TabsContent value="tradingview" className="transition-all duration-150">
          <Card className="transition-all duration-150">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-xl">TradingView Format</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Copy and paste this format into TradingView's symbol search
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="relative">
                <pre className="max-h-[200px] sm:max-h-[300px] overflow-auto rounded-md bg-muted p-2 sm:p-4 text-xs sm:text-sm font-mono border border-border">
                  {tvFormattedOutput}
                </pre>
                <Button
                  className="absolute top-2 right-2 text-xs p-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-input/30"
                  onClick={handleCopyToClipboard}
                  title="Copy to clipboard"
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
            <CardFooter className="p-3 sm:p-6 flex flex-col items-center">
              <Button
                className="flex items-center justify-center mt-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md p-2"
                onClick={handleDownloadCSV}
              >
                <Download className="h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Fundamentals Tab */}
        {showFundamentals && (
          <TabsContent value="fundamentals" className="transition-all duration-150">
            <Card className="transition-all duration-150">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-base sm:text-xl">Fundamentals & Results Dates</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Quarterly results and fundamental data for matched symbols
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Filter by symbol or industry..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="rounded-md border overflow-x-auto -mx-3 sm:mx-0">
                  <div className="min-w-[800px] px-3 sm:px-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px] sm:w-[100px] py-2 px-2 sm:px-4">Symbol</TableHead>
                          <TableHead className="py-2 px-2 sm:px-4">Industry</TableHead>
                          <TableHead className="py-2 px-2 sm:px-4">RS Rating</TableHead>
                          <TableHead className="py-2 px-2 sm:px-4">Results Date</TableHead>
                          <TableHead className="py-2 px-2 sm:px-4">EPS</TableHead>
                          <TableHead className="py-2 px-2 sm:px-4">QoQ % EPS</TableHead>
                          <TableHead className="py-2 px-2 sm:px-4">YoY % EPS</TableHead>
                          <TableHead className="py-2 px-2 sm:px-4">Sales (Cr)</TableHead>
                          <TableHead className="py-2 px-2 sm:px-4">QoQ % Sales</TableHead>
                          <TableHead className="py-2 px-2 sm:px-4">YoY % Sales</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSymbols.map((stock) => (
                          <TableRow key={stock.symbol}>
                            <TableCell className="font-medium py-2 px-2 sm:px-4">
                              <div className="flex items-center">
                                {stock.symbol}
                                <Button
                                  className={`h-6 w-6 ml-1 p-0 rounded-full flex items-center justify-center transition-all duration-200 ${
                                    isInWatchlist(stock.symbol)
                                      ? 'text-yellow-500 bg-yellow-500/10'
                                      : 'text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10'
                                  }`}
                                  onClick={() => handleAddToWatchlist(stock.symbol)}
                                  disabled={isInWatchlist(stock.symbol)}
                                >
                                  <StarIcon
                                    className={`h-3.5 w-3.5 ${isInWatchlist(stock.symbol) ? "fill-yellow-500" : ""}`}
                                  />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-2 sm:px-4">{stock.industry}</TableCell>
                            <TableCell className="py-2 px-2 sm:px-4">{stock.fundamentals?.rsRating}</TableCell>
                            <TableCell className="py-2 px-2 sm:px-4">{stock.resultsDate}</TableCell>
                            <TableCell className="py-2 px-2 sm:px-4">{stock.fundamentals?.epsLatestQuarter}</TableCell>
                            <TableCell className="py-2 px-2 sm:px-4">{stock.fundamentals?.qoqEpsLatest}</TableCell>
                            <TableCell className="py-2 px-2 sm:px-4">{stock.fundamentals?.yoyEpsLatest}</TableCell>
                            <TableCell className="py-2 px-2 sm:px-4">{stock.fundamentals?.salesLatestQuarter}</TableCell>
                            <TableCell className="py-2 px-2 sm:px-4">{stock.fundamentals?.qoqSalesLatest}</TableCell>
                            <TableCell className="py-2 px-2 sm:px-4">{stock.fundamentals?.yoySalesLatest}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2 italic flex items-center justify-center sm:hidden">
                  <span>← Swipe horizontally to see all columns →</span>
                </div>
              </CardContent>
              <CardFooter className="p-3 sm:p-6 flex flex-col items-center">
                <Button
                  className="flex items-center justify-center mt-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md p-2"
                  onClick={handleDownloadFundamentals}
                >
                  <Download className="h-5 w-5" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}

        {/* Industry Distribution Tab */}
        <TabsContent value="distribution" className="transition-all duration-150">
          <Card className="transition-all duration-150">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-xl">Industry Distribution</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Analysis of symbol distribution across industries
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <IndustryChart ref={industryChartRef} mappedSymbols={filteredSymbols} />
            </CardContent>
            <CardFooter className="p-3 sm:p-6 flex flex-col items-center">
              <div className="relative">
                <Button
                  ref={downloadBtnRef}
                  className="flex items-center justify-center mt-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md p-2 px-3 gap-1"
                  onClick={toggleDownloadDropdown}
                >
                  <Download className="h-5 w-5" />
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </Button>

                {showDownloadOptions && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-56 bg-popover text-popover-foreground rounded-md border shadow-md z-50"
                  >
                    <div className="p-1 flex flex-col">
                      <button
                        className="flex w-full items-center text-left px-2 py-1.5 text-sm hover:bg-muted rounded-sm"
                        onClick={handleDownloadChart}
                      >
                        Download Chart Image
                      </button>
                      <button
                        className="flex w-full items-center text-left px-2 py-1.5 text-sm hover:bg-muted rounded-sm"
                        onClick={handleDownloadChartWithData}
                      >
                        Download Chart with Data
                      </button>
                      <button
                        className="flex w-full items-center text-left px-2 py-1.5 text-sm hover:bg-muted rounded-sm"
                        onClick={handleDownloadCSV}
                      >
                        Download CSV Data
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Mapping Results Tab */}
        <TabsContent value="mapping" className="transition-all duration-150">
          <Card className="transition-all duration-150">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-xl">Industry Mapping Results</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Found {filteredSymbols.length} valid symbols across {new Set(filteredSymbols.map(s => s.industry)).size} industries
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {/* Removed search input from this tab */}
              <div className="rounded-md border overflow-x-auto -mx-3 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px] sm:w-[100px]">Symbol</TableHead>
                      <TableHead>Industry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_tr:last-child]:border-0">
                    {filteredSymbols.map((stock) => (
                      <TableRow key={stock.symbol} className="border-b hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium py-2 px-2 sm:px-4">
                          <div className="flex items-center">
                            {stock.symbol}
                            <Button
                              className={`h-6 w-6 ml-1 p-0 rounded-full flex items-center justify-center transition-all duration-200 ${
                                isInWatchlist(stock.symbol)
                                  ? 'text-yellow-500 bg-yellow-500/10'
                                  : 'text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10'
                              }`}
                              onClick={() => handleAddToWatchlist(stock.symbol)}
                              disabled={isInWatchlist(stock.symbol)}
                            >
                              <StarIcon
                                className={`h-3.5 w-3.5 ${isInWatchlist(stock.symbol) ? "fill-yellow-500" : ""}`}
                              />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-2 sm:px-4">{stock.industry}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {invalidSymbols.length > 0 && (
                <div className="mt-4 p-2 fade-in">
                  <h3 className="text-xs sm:text-sm font-medium text-destructive">
                    Invalid Symbols ({invalidSymbols.length})
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                    {invalidSymbols.join(", ")}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-3 sm:p-6 flex flex-col items-center">
              <Button
                className="flex items-center justify-center mt-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md p-2"
                onClick={handleDownloadCSV}
              >
                <Download className="h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="flex justify-between items-center pt-4 border-t mt-4">
        <div className="text-sm text-muted-foreground">
          {filteredSymbols.length} symbols mapped successfully
          {invalidSymbols.length > 0 && `, ${invalidSymbols.length} invalid symbols`}
        </div>
        <div className="flex space-x-2">
          {onAddToWatchlist && (
            <Button
              className="flex items-center text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 gap-1.5 font-medium shadow-md"
              onClick={handleAddAllToWatchlist}
            >
              <StarIcon className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
