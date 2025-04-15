"use client"

import { useState, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowRightIcon, Loader2Icon, XCircleIcon } from "lucide-react";
import { SymbolAutocomplete } from "@/components/symbol-autocomplete";
import { toast } from "sonner";
import { AnimatedContainer, AnimatedButton } from "@/components/ui/animated-container";

interface SymbolInputFormProps {
  onSubmit: (symbols: string, showFundamentals: boolean) => void;
  isLoading: boolean;
  availableSymbols: string[];
}

export function SymbolInputForm({ onSubmit, isLoading, availableSymbols }: SymbolInputFormProps) {
  const [symbols, setSymbols] = useState("");
  const [showFundamentals, setShowFundamentals] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Process symbols when submitted
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbols.trim()) {
      toast.error("Please enter at least one symbol");
      return;
    }
    onSubmit(symbols, showFundamentals);
  };

  // Handle auto-complete selection
  const handleSelect = useCallback((value: string) => {
    // Update the textarea with the new symbol
    const trimmedValue = symbols.trim();
    const newValue = trimmedValue ? `${trimmedValue}, ${value}` : value;
    setSymbols(newValue);

    // Focus the textarea after selection
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [symbols]);

  // Clear input
  const handleClear = () => {
    setSymbols("");
  };

  // Handle fundamentals toggle with a dedicated handler
  const handleFundamentalsToggle = useCallback((checked: boolean) => {
    setShowFundamentals(checked);
  }, []);

  // Calculate the unique symbol count from the input text
  const symbolCount = useMemo(() => {
    // Process the input to get clean symbols
    const rawSymbols = symbols
      .replace(/\n/g, ",")
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Remove duplicates
    const uniqueSymbols = new Set(rawSymbols.map(s => s.toUpperCase()));
    return uniqueSymbols.size;
  }, [symbols]);

  return (
    <Card className="relative overflow-hidden">
      <AnimatedContainer type="fade" className="absolute inset-0 pointer-events-none opacity-0 bg-gradient-to-r from-primary/10 to-transparent" />
      <CardHeader className="p-3 sm:p-6 pb-2">
        <div className="flex justify-between items-center">
          <AnimatedContainer type="fadeUp">
            <div>
              <CardTitle className="text-base sm:text-xl">Symbol Input</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Enter stock symbols separated by commas or new lines
              </CardDescription>
            </div>
          </AnimatedContainer>
          <AnimatedContainer type="fadeUp" delay={0.1}>
            <div className="text-xs text-muted-foreground hidden sm:block">
              {symbolCount} {symbolCount === 1 ? "symbol" : "symbols"} detected
            </div>
          </AnimatedContainer>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <AnimatedContainer type="fadeUp" delay={0.15}>
              <div className="relative sm:mt-2">
                <SymbolAutocomplete
                  symbols={availableSymbols}
                  onSelect={handleSelect}
                  selectedSymbols={[]}
                />
              </div>
            </AnimatedContainer>

            <AnimatedContainer type="fadeUp" delay={0.2}>
              <div className="relative mt-2">
                <Textarea
                  ref={textareaRef}
                  placeholder="Enter symbols here... (e.g., AAPL, MSFT, GOOGL)"
                  value={symbols}
                  onChange={(e) => setSymbols(e.target.value)}
                  onFocus={(e) => e.target.select()} // Select all text on focus
                  rows={3}
                  className="font-mono text-sm resize-none bg-background text-foreground border-border pr-8 transition-all duration-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                />
                {symbols.trim() && (
                  <AnimatedButton
                    type="button"
                    className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-foreground bg-transparent border-none flex items-center justify-center p-0"
                    onClick={handleClear}
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </AnimatedButton>
                )}
              </div>
            </AnimatedContainer>

            <AnimatedContainer type="fadeUp" delay={0.25} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mt-3">
              <div className="flex items-center space-x-2 group">
                <Switch
                  id="show-fundamentals"
                  checked={showFundamentals}
                  onCheckedChange={handleFundamentalsToggle}
                  className="transition-all duration-200"
                />
                <Label
                  htmlFor="show-fundamentals"
                  className="text-xs sm:text-sm font-normal cursor-pointer text-foreground group-hover:text-primary transition-colors duration-200"
                >
                  Show fundamentals data
                </Label>
              </div>
              <div className="flex justify-between sm:justify-end items-center w-full sm:w-auto">
                <div className="text-xs text-muted-foreground sm:hidden">
                  {symbolCount} {symbolCount === 1 ? "symbol" : "symbols"}
                </div>
                <AnimatedButton
                  type="submit"
                  className={`min-w-[120px] rounded-md px-4 py-2 text-sm font-medium transition-all
                    ${isLoading || !symbols.trim()
                      ? 'bg-primary/70 text-primary-foreground opacity-70 cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95'}`}
                  disabled={isLoading || !symbols.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    <>
                      Process
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </>
                  )}
                </AnimatedButton>
              </div>
            </AnimatedContainer>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
