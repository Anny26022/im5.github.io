"use client"

import { useState, useEffect, Suspense } from "react"
import { Footer } from "@/components/footer"
import { Instructions } from "@/components/instructions"
import { StatsCard } from "@/components/stats-card"
import { SymbolInputForm } from "@/components/symbol-input-form"
import { ResultsDisplay } from "@/components/results-display"
import { AvailableIndustries } from "@/components/available-industries"
import { Watchlist } from "@/components/watchlist"
import { IndustryMapper, IndustryMapperStats, StockData } from "@/lib/data-processor"
import { toast } from "sonner"
import { useAppContext } from "@/context/app-context"
import { Button } from "@/components/ui/button"
import { HelpCircleIcon } from "lucide-react"

const LoadingIndicator = () => (
  <div className="flex items-center justify-center h-[80vh]">
    <div className="flex flex-col items-center">
      <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2 border-primary"></div>
      <p className="mt-4 text-muted-foreground">Loading data...</p>
    </div>
  </div>
)

export default function Home() {
  const [mapper, setMapper] = useState<IndustryMapper | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [stats, setStats] = useState<IndustryMapperStats | null>(null)
  const [industries, setIndustries] = useState<string[]>([])
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([])
  const [mappedSymbols, setMappedSymbols] = useState<StockData[]>([])
  const [invalidSymbols, setInvalidSymbols] = useState<string[]>([])
  const [tvFormattedOutput, setTvFormattedOutput] = useState("")
  const [flatOutput, setFlatOutput] = useState("")
  const [showFundamentals, setShowFundamentals] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  const { watchlist, addToWatchlist } = useAppContext()

  useEffect(() => {
    let isMounted = true
    let initTimeoutId: NodeJS.Timeout | null = null
    const initStartTime = Date.now()

    const safetyTimeout = setTimeout(() => {
      if (isMounted && isInitializing) {
        setIsInitializing(false)
        toast.error("Loading took too long. Please refresh the page.", { duration: 5000 })
      }
    }, 15000)

    const initializeMapper = async () => {
      try {
        const newMapper = new IndustryMapper()
        await newMapper.initialize()
        if (isMounted) {
          setMapper(newMapper)
          setStats(newMapper.getStats())
          try {
            const [industryList, symbolList] = await Promise.all([
              Promise.resolve(newMapper.getAvailableIndustries()),
              Promise.resolve(newMapper.getAvailableSymbols())
            ])
            if (isMounted) {
              setIndustries(industryList)
              setAvailableSymbols(symbolList)
              setIsInitializing(false)
            }
          } catch {
            if (isMounted) {
              setIsInitializing(false)
              toast.error("Some data could not be loaded completely", { duration: 3000 })
            }
          }
        }
      } catch {
        if (isMounted) {
          toast.error("Failed to load data. Please refresh the page.", { duration: 5000 })
          setIsInitializing(false)
        }
      } finally {
        if (safetyTimeout) clearTimeout(safetyTimeout)
      }
    }
    initTimeoutId = setTimeout(() => { initializeMapper() }, 100)
    return () => {
      isMounted = false
      if (initTimeoutId) clearTimeout(initTimeoutId)
      if (safetyTimeout) clearTimeout(safetyTimeout)
    }
  }, [isInitializing])

  const handleSubmit = async (symbols: string, showFundamentals: boolean) => {
    if (!mapper) return
    const symbolsArray = symbols.replace(/\n/g, ",").split(",").map(s => s.trim()).filter(Boolean)
    if (symbolsArray.length > 999) {
      toast.error("Too many symbols. Maximum limit is 999 symbols at once.", { position: "top-right", duration: 5000 })
      return
    }
    if (symbolsArray.length === 0) {
      toast.error("Please enter at least one valid symbol", { position: "top-right" })
      return
    }
    setIsLoading(true)
    setShowFundamentals(showFundamentals)
    setTimeout(async () => {
      try {
        const { mappedSymbols, invalidSymbols, tvFormattedOutput, flatOutput } = await mapper.processSymbols(symbolsArray, showFundamentals)
        setMappedSymbols(mappedSymbols)
        setInvalidSymbols(invalidSymbols)
        setTvFormattedOutput(tvFormattedOutput)
        setFlatOutput(flatOutput)
        toast.success(
          invalidSymbols.length > 0
            ? `Processed ${mappedSymbols.length} symbols (${invalidSymbols.length} invalid)`
            : `Successfully processed all ${mappedSymbols.length} symbols`,
          { position: "top-right", duration: 3000, className: "bg-success font-medium" }
        )
      } catch {
        toast.error("Error processing symbols. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }, 0)
  }

  return (
    <div className="flex-1 flex flex-col">
      <Suspense fallback={<LoadingIndicator />}>
        {isInitializing ? (
          <LoadingIndicator />
        ) : (
          <>
            <div className="p-6 pb-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <span className="font-medium text-foreground">Dashboard</span>
              </div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Stock Industry Mapper</h1>
                {stats && (
                  <div className="hidden md:flex space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <span className="font-medium mr-1.5 text-foreground">{stats.industries}</span> Industries
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-1.5 text-foreground">{stats.symbols}</span> Symbols
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="md:hidden flex flex-col gap-4 px-6">
              {showInstructions && (
                <Button variant="outline" size="sm" onClick={() => setShowInstructions(false)} className="mb-2 w-full flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Hide Instructions
                </Button>
              )}
              {!showInstructions && (
                <Button variant="outline" size="sm" onClick={() => setShowInstructions(true)} className="mb-0 w-full flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-200">
                  <HelpCircleIcon className="h-4 w-4" />
                  <span>Show Instructions</span>
                </Button>
              )}
              {showInstructions && (
                <Suspense fallback={<div className="h-[200px] flex items-center justify-center">Loading instructions...</div>}>
                  <div className="relative">
                    <Instructions />
                  </div>
                </Suspense>
              )}
              {stats && (
                <Suspense fallback={<div className="h-[100px] flex items-center justify-center">Loading stats...</div>}>
                  <StatsCard stats={stats} />
                </Suspense>
              )}
              <Suspense fallback={<div className="h-[200px] flex items-center justify-center">Loading form...</div>}>
                <SymbolInputForm
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  availableSymbols={availableSymbols}
                />
              </Suspense>
              {mappedSymbols.length > 0 && (
                <Suspense fallback={<div className="h-[200px] flex items-center justify-center">Loading results...</div>}>
                  <ResultsDisplay
                    mappedSymbols={mappedSymbols}
                    invalidSymbols={invalidSymbols}
                    tvFormattedOutput={tvFormattedOutput}
                    flatOutput={flatOutput}
                    showFundamentals={showFundamentals}
                    onAddToWatchlist={(symbols) => {
                      addToWatchlist(symbols)
                      toast.success(`Added ${symbols.length} symbols to watchlist`)
                    }}
                  />
                </Suspense>
              )}
              {industries.length > 0 && (
                <Suspense fallback={<div className="h-[300px] flex items-center justify-center">Loading industries...</div>}>
                  <AvailableIndustries industries={industries} mapper={mapper} />
                </Suspense>
              )}
              {watchlist.length > 0 && (
                <Suspense fallback={<div className="h-[200px] flex items-center justify-center">Loading watchlist...</div>}>
                  <Watchlist mapper={mapper} />
                </Suspense>
              )}
            </div>
            <div className="hidden md:grid md:grid-cols-3 md:gap-6 px-6 pb-6">
              <div className="md:col-span-2 space-y-4">
                {!showInstructions && (
                  <Button variant="outline" size="sm" onClick={() => setShowInstructions(true)} className="mb-2 flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-200">
                    <HelpCircleIcon className="h-4 w-4" />
                    <span>Show Instructions</span>
                  </Button>
                )}
                {showInstructions && (
                  <Suspense fallback={<div className="h-[200px] flex items-center justify-center">Loading instructions...</div>}>
                    <div className="relative">
                      <Button variant="outline" size="sm" onClick={() => setShowInstructions(false)} className="absolute top-2 right-2 z-10 transition-colors duration-200">
                        Hide Instructions
                      </Button>
                      <Instructions />
                    </div>
                  </Suspense>
                )}
                <Suspense fallback={<div className="h-[200px] flex items-center justify-center">Loading form...</div>}>
                  <SymbolInputForm
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    availableSymbols={availableSymbols}
                  />
                </Suspense>
                {mappedSymbols.length > 0 && (
                  <Suspense fallback={<div className="h-[200px] flex items-center justify-center">Loading results...</div>}>
                    <ResultsDisplay
                      mappedSymbols={mappedSymbols}
                      invalidSymbols={invalidSymbols}
                      tvFormattedOutput={tvFormattedOutput}
                      flatOutput={flatOutput}
                      showFundamentals={showFundamentals}
                      onAddToWatchlist={(symbols) => {
                        addToWatchlist(symbols)
                        toast.success(`Added ${symbols.length} symbols to watchlist`)
                      }}
                    />
                  </Suspense>
                )}
              </div>
              <div className="space-y-4">
                {stats && (
                  <Suspense fallback={<div className="h-[100px] flex items-center justify-center">Loading stats...</div>}>
                    <StatsCard stats={stats} />
                  </Suspense>
                )}
                {watchlist.length > 0 && (
                  <Suspense fallback={<div className="h-[200px] flex items-center justify-center">Loading watchlist...</div>}>
                    <Watchlist mapper={mapper} />
                  </Suspense>
                )}
                {industries.length > 0 && (
                  <Suspense fallback={<div className="h-[300px] flex items-center justify-center">Loading industries...</div>}>
                    <AvailableIndustries industries={industries} mapper={mapper} />
                  </Suspense>
                )}
              </div>
            </div>
          </>
        )}
      </Suspense>
      <Footer />
    </div>
  )
}
