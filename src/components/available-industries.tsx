"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Copy, Check, CopyCheck, Search, X, Filter } from "lucide-react";
import { IndustryMapper } from "@/lib/data-processor";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

// Number of symbols to display per page
const symbolsPerPage = 20;

export function AvailableIndustries({
  industries,
  mapper,
}: {
  industries: string[];
  mapper: IndustryMapper | null;
}) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [industrySymbols, setIndustrySymbols] = useState<string[]>([]);
  const [visibleSymbols, setVisibleSymbols] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredIndustries, setFilteredIndustries] = useState<string[]>(industries);

  // Keep preloaded data in state
  const [preloadedIndustrySymbols, setPreloadedIndustrySymbols] = useState<Record<string, string[]>>({});
  const [isPreloading, setIsPreloading] = useState(false);

  // Update filtered industries when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredIndustries(industries);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = industries.filter(industry =>
        industry.toLowerCase().includes(query)
      );
      setFilteredIndustries(filtered);
    }
  }, [searchQuery, industries]);

  // Preload industry symbols for better performance
  useEffect(() => {
    if (!mapper || industries.length === 0) {
      console.log("No mapper or industries, skipping preload");
      return;
    }

    console.log("Starting preloading of industries...");
    setIsPreloading(true);

    // Use a timeout to not block the UI
    setTimeout(() => {
      try {
        const preloadedData: Record<string, string[]> = {};

        // We'll only preload a small batch initially to ensure responsiveness
        const initialBatchSize = 10;
        const initialBatch = industries.slice(0, initialBatchSize);

        initialBatch.forEach(industry => {
          try {
            preloadedData[industry] = mapper.getSymbolsByIndustry(industry);
          } catch (err) {
            console.error(`Error preloading industry ${industry}:`, err);
          }
        });

        setPreloadedIndustrySymbols(preloadedData);
        setIsPreloading(false);

        console.log(`Preloaded initial ${initialBatch.length} industries`);

        // Continue preloading the rest in the background
        if (industries.length > initialBatchSize) {
          setTimeout(() => {
            const remainingIndustries = industries.slice(initialBatchSize);
            console.log(`Background loading remaining ${remainingIndustries.length} industries...`);

            let processed = 0;
            const batchSize = 5;

            function processNextBatch() {
              const batch = remainingIndustries.slice(processed, processed + batchSize);
              if (batch.length === 0) {
                console.log("Finished background loading all industries");
                return;
              }

              batch.forEach(industry => {
                try {
                  preloadedData[industry] = mapper.getSymbolsByIndustry(industry);
                } catch (err) {
                  console.error(`Error preloading industry ${industry}:`, err);
                }
              });

              processed += batch.length;

              // Update state with new batch
              setPreloadedIndustrySymbols({...preloadedData});

              // Schedule next batch
              setTimeout(processNextBatch, 100);
            }

            processNextBatch();
          }, 500);
        }
      } catch (error) {
        console.error("Error in preloading process:", error);
        setIsPreloading(false);
      }
    }, 0);
  }, [mapper, industries]);

  // Handle click on an industry button
  const handleShowIndustry = useCallback((industry: string) => {
    if (!mapper) {
      console.error("No mapper available");
      toast.error("Industry data not available");
      return;
    }

    console.log(`Showing industry: ${industry}`);
    setLoading(true);

    // Use setTimeout to allow UI to update and show loading state
    setTimeout(() => {
      try {
        // Get symbols from preloaded data or fetch if not available
        let symbols: string[];

        if (preloadedIndustrySymbols[industry]) {
          console.log(`Using preloaded data for ${industry}`);
          symbols = preloadedIndustrySymbols[industry];
        } else {
          console.log(`Fetching data for ${industry}`);
          symbols = mapper.getSymbolsByIndustry(industry);
        }

        console.log(`Found ${symbols.length} symbols for ${industry}`);

        // Set all state at once
        setSelectedIndustry(industry);
        setIndustrySymbols(symbols);
        setVisibleSymbols(symbols.slice(0, Math.min(symbols.length, symbolsPerPage)));
        setCurrentPage(1);

        // Open modal first, then clear loading state
        setModalOpen(true);
        setLoading(false);
      } catch (error) {
        console.error("Error showing industry:", error);
        setLoading(false);
        toast.error("Failed to load industry symbols");
      }
    }, 0);
  }, [mapper, preloadedIndustrySymbols]);

  // Load more symbols (pagination)
  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    const startIdx = (nextPage - 1) * symbolsPerPage;
    const endIdx = startIdx + symbolsPerPage;

    setVisibleSymbols([
      ...visibleSymbols,
      ...industrySymbols.slice(startIdx, Math.min(endIdx, industrySymbols.length))
    ]);

    setCurrentPage(nextPage);
  };

  // Copy all industry symbols to clipboard
  const handleCopySymbols = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(industrySymbols.join(", "));
      toast.success(`Copied ${industrySymbols.length} symbols to clipboard`);

      // Show the success state for 1.5 seconds
      setTimeout(() => {
        setCopying(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard");
      setCopying(false);
    }
  };

  // Copy a single symbol to clipboard
  const handleCopySymbol = async (symbol: string) => {
    try {
      await navigator.clipboard.writeText(symbol);
      setCopiedSymbol(symbol);

      // Show a toast notification
      toast.success(`Copied ${symbol} to clipboard`, {
        duration: 1500,
        position: "bottom-center",
      });

      // Reset after 1.5 seconds
      setTimeout(() => {
        setCopiedSymbol(null);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy symbol:", error);
      toast.error("Failed to copy symbol");
    }
  };

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm p-4">
      <div className="space-y-4">
        {/* Header section with title and preloading indicator */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold tracking-tight">Available Industries</h2>
          {isPreloading && (
            <div className="flex items-center text-xs text-muted-foreground gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading data...</span>
            </div>
          )}
        </div>

        {/* Search box with enhanced styling */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Search industries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-9 bg-background/50 border-muted focus-visible:ring-1 focus-visible:ring-offset-0"
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            {searchQuery && (
              <button
                className="h-full px-3 text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Result counter with nicer styling */}
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <Filter className="h-3 w-3 mr-1.5 opacity-70" />
          <span>
            {filteredIndustries.length} {filteredIndustries.length === 1 ? 'industry' : 'industries'}
            {searchQuery && <span className="font-medium"> matching "<span className="text-foreground">{searchQuery}</span>"</span>}
          </span>
        </div>

        {/* Industries list with scrollable container and improved styling */}
        <div className="rounded-md border border-muted bg-background/50 p-1 relative">
          <div className="flex flex-wrap gap-1.5 max-h-[240px] overflow-y-auto p-1.5 scrollbar-thin symbol-grid-mobile">
            {filteredIndustries.length > 0 ? (
              filteredIndustries.map((industry) => (
                <Button
                  key={industry}
                  variant="outline"
                  size="sm"
                  onClick={() => handleShowIndustry(industry)}
                  className="text-xs h-7 px-2 py-1 bg-background hover:bg-secondary/50 transition-colors"
                >
                  {industry}
                </Button>
              ))
            ) : (
              <div className="w-full flex items-center justify-center py-8 text-sm text-muted-foreground">
                No industries found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[420px] p-0 overflow-hidden rounded-lg border shadow-md dialog-mobile-size">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-7 w-7 animate-spin mb-2 text-primary/70" />
              <p className="text-sm text-muted-foreground">Loading symbols...</p>
            </div>
          ) : (
            <>
              <DialogHeader className="p-4 pb-3 pr-12 border-b">
                <DialogTitle className="text-lg font-medium leading-none">
                  {selectedIndustry}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {industrySymbols.length} symbols found
                </p>
              </DialogHeader>

              <div className="p-4 pt-3">
                {visibleSymbols.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin symbol-grid-mobile">
                    {visibleSymbols.map((symbol) => (
                      <Badge
                        key={symbol}
                        variant="outline"
                        className={`h-7 flex items-center justify-center text-xs cursor-pointer transition-colors duration-150 symbol-badge-mobile ${
                          copiedSymbol === symbol ? "bg-primary/10 border-primary/20" : ""
                        }`}
                        onClick={() => handleCopySymbol(symbol)}
                      >
                        {symbol}
                        {copiedSymbol === symbol && (
                          <Check className="ml-1 h-3 w-3 text-primary" />
                        )}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="w-full text-center py-4 text-sm text-muted-foreground">
                    No symbols found for this industry.
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  {visibleSymbols.length < industrySymbols.length && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMore}
                      className="w-full h-8 text-xs"
                    >
                      Show more ({visibleSymbols.length} of {industrySymbols.length})
                    </Button>
                  )}

                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCopySymbols}
                    disabled={copying || industrySymbols.length === 0}
                    className="w-full h-8 text-xs flex items-center justify-center gap-1.5"
                  >
                    {copying ? (
                      <>
                        <CopyCheck className="h-3.5 w-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy All Symbols</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-muted/30 py-2 px-4 border-t">
                <p className="text-xs text-center text-muted-foreground">
                  Click on any symbol to copy it individually
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
