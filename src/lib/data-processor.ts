import Papa from 'papaparse';

export interface StockData {
  symbol: string;
  industry: string;
  fundamentals?: {
    rsRating?: string;
    epsLatestQuarter?: string;
    qoqEpsLatest?: string;
    yoyEpsLatest?: string;
    salesLatestQuarter?: string;
    qoqSalesLatest?: string;
    yoySalesLatest?: string;
  };
  resultsDate?: string;
}

export interface IndustryMapperStats {
  totalSymbols: number;
  mappedIndustries: number;
  totalIndustries: number;
}

export class IndustryMapper {
  private industryData: Map<string, string> = new Map();
  private fundamentalsData: Map<string, any> = new Map();
  private resultsCalendar: Map<string, string> = new Map();
  private availableIndustries: Set<string> = new Set();
  private availableSymbols: Set<string> = new Set();
  private initialized: boolean = false;

  // Add cached map for industry to symbols
  private industryToSymbolsMap: Map<string, string[]> = new Map();

  // Additional properties for caching
  private stockData: Map<string, any> = new Map();
  private industryMap: Map<string, Set<string>> = new Map();
  private _industrySymbolsCache: Map<string, string[]> = new Map();

  constructor() {
    this.initialized = false;
  }

  // Initialize with timeout mechanism
  async initialize(maxTimeout = 10000): Promise<void> {
    console.time('mapper-initialization');

    // Create a promise that resolves after maxTimeout milliseconds
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Initialization timed out after ${maxTimeout}ms`));
      }, maxTimeout);
    });

    try {
      // Race between the actual initialization and the timeout
      await Promise.race([
        this.actualInitialize(),
        timeoutPromise
      ]);

      // Set initialized flag to true (duplicated here to ensure it's set)
      this.initialized = true;

      console.timeEnd('mapper-initialization');
    } catch (error) {
      console.error('Mapper initialization failed or timed out:', error);
      // Even if we fail, try to load at least some basic data
      this.initializeBasicDataOnly();

      // Still mark as initialized so the app can function with fallback data
      this.initialized = true;

      // Don't rethrow to allow app to continue with fallback data
      console.warn('Initialization failed but fallback data is available');
    }
  }

  // Separate the actual initialization logic
  private async actualInitialize(): Promise<void> {
    try {
      // Fetch and load all three datasets in parallel
      const [basicRSData, industryAnalyticsData, resultsCalendarData] = await Promise.all([
        this.fetchCSV('/data/Basic_RS_Setup.csv'),
        this.fetchCSV('/data/Industry_Analytics.csv'),
        this.fetchCSV('/data/Results_Calendar.csv')
      ]);

      // Process each dataset
      this.processBasicRSData(basicRSData);
      this.processIndustryAnalyticsData(industryAnalyticsData);
      this.processResultsCalendarData(resultsCalendarData);

      // Precompute industry maps
      this.precomputeIndustryMaps();

      // Cache common queries
      this.cacheCommonQueries();

      // Set initialized flag to true
      this.initialized = true;

      console.log(`Loaded ${this.stockData.size} stocks with industry data`);
    } catch (error) {
      console.error('Error in actualInitialize:', error);
      throw error;
    }
  }

  // Fallback method to initialize with minimal data if full init fails
  private initializeBasicDataOnly(): void {
    console.log('Attempting to initialize with basic data only');
    try {
      // Create a minimal dataset to allow the UI to function
      this.stockData = new Map();
      this.industryMap = new Map();
      this.industryData = new Map();
      this.industryToSymbolsMap = new Map();

      // Add a few dummy entries to prevent UI from breaking
      const dummySymbol = 'EXAMPLE';
      const dummyIndustry = 'Example Industry';

      this.stockData.set(dummySymbol, {
        symbol: dummySymbol,
        industry: dummyIndustry,
        name: 'Example Stock',
        price: 0,
        relativeStrength: 0,
        volume: 0
      });

      this.industryData.set(dummySymbol, dummyIndustry);

      // Create a single industry
      if (!this.industryMap.has(dummyIndustry)) {
        this.industryMap.set(dummyIndustry, new Set([dummySymbol]));
      }

      // Add to precomputed maps
      this.industryToSymbolsMap.set(dummyIndustry, [dummySymbol]);

      // Add to available collections
      this.availableIndustries.add(dummyIndustry);
      this.availableSymbols.add(dummySymbol);

      console.log('Basic initialization completed with fallback data');
    } catch (error) {
      console.error('Even basic initialization failed:', error);
    }
  }

  // Helper method to fetch CSV data
  private async fetchCSV(path: string): Promise<string> {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`Error fetching ${path}:`, error);
      throw error;
    }
  }

  // Process Basic RS Setup data
  private processBasicRSData(csvText: string): void {
    const { data } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });

    data.forEach((row: any) => {
      if (row['Stock Name']) {
        const symbol = row['Stock Name'].trim().toUpperCase();
        const industry = row['Basic Industry'] || 'Unknown';

        // Store in stockData map
        this.stockData.set(symbol, {
          symbol: symbol,
          industry: industry,
          name: row['Name'] || symbol,
          price: parseFloat(row['Price']) || 0,
          relativeStrength: parseFloat(row['RS Rating']) || 0,
          volume: parseFloat(row['Volume']) || 0,
          fundamentals: {
            rsRating: row['RS Rating'],
            epsLatestQuarter: row['EPS Latest Quarter'],
            qoqEpsLatest: row['QoQ % EPS Latest'],
            yoyEpsLatest: row['YoY% EPS Latest'],
            salesLatestQuarter: row['Sales Latest Quarter'],
            qoqSalesLatest: row['QoQ % Sales Latest'],
            yoySalesLatest: row['YoY % Sales Latest']
          }
        });

        // Store in industryData for backward compatibility
        this.industryData.set(symbol, industry);

        // Store fundamentals data for backward compatibility
        this.fundamentalsData.set(symbol, {
          rsRating: row['RS Rating'],
          epsLatestQuarter: row['EPS Latest Quarter'],
          qoqEpsLatest: row['QoQ % EPS Latest'],
          yoyEpsLatest: row['YoY% EPS Latest'],
          salesLatestQuarter: row['Sales Latest Quarter'],
          qoqSalesLatest: row['QoQ % Sales Latest'],
          yoySalesLatest: row['YoY % Sales Latest']
        });

        // Build industry map
        if (!this.industryMap.has(industry)) {
          this.industryMap.set(industry, new Set([symbol]));
        } else {
          this.industryMap.get(industry)?.add(symbol);
        }

        // Add to available symbols
        this.availableSymbols.add(symbol);
      }
    });
  }

  // Process Industry Analytics data
  private processIndustryAnalyticsData(csvText: string): void {
    const { data } = Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true
    });

    data.forEach((row: any) => {
      if (row[0]) {
        this.availableIndustries.add(row[0]);
      }
    });
  }

  // Process Results Calendar data
  private processResultsCalendarData(csvText: string): void {
    const { data } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });

    data.forEach((row: any) => {
      if (row['Stock Name']) {
        const stockName = row['Stock Name'].trim().toUpperCase();
        this.resultsCalendar.set(stockName, row['Quarterly Results Date'] || '');
      }
    });
  }

  // Precompute mappings for faster lookups
  private precomputeIndustryMaps(): void {
    // Clear any existing mapping
    this.industryToSymbolsMap.clear();

    // Group symbols by industry
    for (const [symbol, industry] of this.industryData.entries()) {
      if (!this.industryToSymbolsMap.has(industry)) {
        this.industryToSymbolsMap.set(industry, []);
      }

      this.industryToSymbolsMap.get(industry)?.push(symbol);
    }

    // Sort each industry's symbols array for consistent display
    for (const [industry, symbols] of this.industryToSymbolsMap.entries()) {
      this.industryToSymbolsMap.set(industry, symbols.sort());
    }
  }

  // Add a method to preload common industry symbols for fast access
  private cacheCommonQueries(): void {
    // Create a cache for the most common industries
    this._industrySymbolsCache = new Map<string, string[]>();

    // Get the top 10 industries by number of symbols
    const topIndustries = this.getTopIndustriesBySymbolCount(10);

    // Preload symbols for these industries
    for (const industry of topIndustries) {
      const symbols = Array.from(this.industryMap.get(industry) || []);
      this._industrySymbolsCache.set(industry, symbols);
    }

    console.log(`Cached symbols for ${this._industrySymbolsCache.size} top industries`);
  }

  // Helper method to get top industries by symbol count
  private getTopIndustriesBySymbolCount(count: number): string[] {
    const industryCounts: [string, number][] = [];

    // Count symbols in each industry
    for (const [industry, symbols] of this.industryMap.entries()) {
      industryCounts.push([industry, symbols.size]);
    }

    // Sort by count (descending) and take the top 'count'
    return industryCounts
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([industry]) => industry);
  }

  // Get list of available industries with better error handling
  public getAvailableIndustries(): string[] {
    if (!this.initialized) {
      console.warn('Attempt to get industries before initialization');
      return ['Sample Industry']; // Return a fallback value to prevent UI from breaking
    }

    try {
      // If we have industry map built, use it as it's more reliable
      if (this.industryMap.size > 0) {
        return Array.from(this.industryMap.keys()).sort();
      }

      // Fall back to the available industries set
      if (this.availableIndustries.size > 0) {
        return Array.from(this.availableIndustries).sort();
      }

      // Last resort fallback
      console.warn('No industries found, returning fallback');
      return ['Sample Industry'];
    } catch (error) {
      console.error('Error in getAvailableIndustries:', error);
      return ['Sample Industry']; // Return fallback on error
    }
  }

  // Get list of available symbols with better error handling
  public getAvailableSymbols(): string[] {
    if (!this.initialized) {
      console.warn('Attempt to get symbols before initialization');
      return ['SAMPLE']; // Return a fallback value
    }

    try {
      // Use stockData if available
      if (this.stockData.size > 0) {
        return Array.from(this.stockData.keys()).sort();
      }

      // Fall back to the available symbols set
      if (this.availableSymbols.size > 0) {
        return Array.from(this.availableSymbols).sort();
      }

      // Last resort fallback
      console.warn('No symbols found, returning fallback');
      return ['SAMPLE'];
    } catch (error) {
      console.error('Error in getAvailableSymbols:', error);
      return ['SAMPLE']; // Return fallback on error
    }
  }

  // Get symbols by industry - with better error handling
  public getSymbolsByIndustry(industry: string): string[] {
    // Return empty array if not initialized instead of throwing
    if (!this.initialized) {
      console.warn('Attempt to get symbols before initialization');
      return [];
    }

    try {
      // First check if this is a cached industry
      if (this._industrySymbolsCache && this._industrySymbolsCache.has(industry)) {
        const cachedSymbols = this._industrySymbolsCache.get(industry);
        if (cachedSymbols && cachedSymbols.length > 0) {
          return cachedSymbols;
        }
      }

      // Check precomputed map next
      if (this.industryToSymbolsMap.has(industry)) {
        return this.industryToSymbolsMap.get(industry) || [];
      }

      // Then check the industry map
      if (this.industryMap && this.industryMap.has(industry)) {
        const symbolsSet = this.industryMap.get(industry);
        if (symbolsSet) {
          const symbols = Array.from(symbolsSet);

          // Cache for future use
          if (this._industrySymbolsCache) {
            this._industrySymbolsCache.set(industry, symbols);
          }

          return symbols;
        }
      }

      // Fallback to older method if the above didn't work
      const symbols: string[] = [];

      for (const [symbol, ind] of this.industryData.entries()) {
        if (ind === industry) {
          symbols.push(symbol);
        }
      }

      // Cache these symbols too
      if (symbols.length > 0 && this._industrySymbolsCache) {
        this._industrySymbolsCache.set(industry, symbols);
      }

      return symbols;
    } catch (error) {
      console.error(`Error in getSymbolsByIndustry for "${industry}":`, error);
      return []; // Return empty array instead of throwing
    }
  }

  // Other methods with better error handling
  public getIndustryForSymbol(symbol: string): string | null {
    if (!this.initialized) {
      console.warn('Attempt to get industry before initialization');
      return null;
    }

    try {
      return this.industryData.get(symbol) || null;
    } catch (error) {
      console.error(`Error in getIndustryForSymbol for "${symbol}":`, error);
      return null;
    }
  }

  public getStats(): IndustryMapperStats {
    if (!this.initialized) {
      console.warn('Getting stats before initialization');
      return {
        totalSymbols: 0,
        mappedIndustries: 0,
        totalIndustries: 0
      };
    }

    try {
      return {
        totalSymbols: this.industryData.size,
        mappedIndustries: new Set(Array.from(this.industryData.values())).size,
        totalIndustries: this.availableIndustries.size
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalSymbols: 0,
        mappedIndustries: 0,
        totalIndustries: 0
      };
    }
  }

  // Other required methods with simplified implementation for brevity
  public cleanSymbols(inputText: string): string[] {
    try {
      // Clean and validate input symbols
      const symbols = inputText
        .replace(/\n/g, ',')
        .replace(/;/g, ',')
        .split(',')
        .map(s => {
          const cleaned = s.trim().toUpperCase();
          return cleaned.startsWith("NSE:") ? cleaned.substring(4) : cleaned;
        })
        .filter(s => s.length > 0);

      // Remove duplicates while preserving order
      const uniqueSymbols: string[] = [];
      const seen = new Set<string>();

      for (const symbol of symbols) {
        if (!seen.has(symbol)) {
          seen.add(symbol);
          uniqueSymbols.push(symbol);
        }
      }

      return uniqueSymbols;
    } catch (error) {
      console.error('Error cleaning symbols:', error);
      return [];
    }
  }

  public mapSymbols(inputText: string): { mapped: Map<string, string>, invalid: string[] } {
    if (!this.initialized) {
      console.warn('Mapping symbols before initialization');
      return { mapped: new Map(), invalid: [] };
    }

    try {
      const cleanedSymbols = this.cleanSymbols(inputText);

      if (cleanedSymbols.length === 0) {
        return { mapped: new Map(), invalid: [] };
      }

      if (cleanedSymbols.length > 999) {
        console.warn('Too many symbols provided, limiting to 999');
        cleanedSymbols.splice(999);
      }

      const mappedSymbols = new Map<string, string>();
      const invalidSymbols: string[] = [];

      for (const symbol of cleanedSymbols) {
        if (this.industryData.has(symbol)) {
          mappedSymbols.set(symbol, this.industryData.get(symbol) || 'Unknown');
        } else {
          invalidSymbols.push(symbol);
        }
      }

      return { mapped: mappedSymbols, invalid: invalidSymbols };
    } catch (error) {
      console.error('Error mapping symbols:', error);
      return { mapped: new Map(), invalid: [] };
    }
  }

  // Simplified implementation of the remaining methods
  public processSymbols(symbolsArray: string[], includeFundamentals: boolean = false): Promise<any> {
    return new Promise((resolve) => {
      if (!this.initialized) {
        console.warn('Processing symbols before initialization');
        resolve({
          mappedSymbols: [],
          invalidSymbols: [],
          tvFormattedOutput: '',
          flatOutput: ''
        });
        return;
      }

      try {
        // Convert array to comma-separated string and process
        const symbolsStr = symbolsArray.join(',');
        const { mapped, invalid } = this.mapSymbols(symbolsStr);

        // Get detailed stock data
        const stockDataList: StockData[] = [];
        for (const [symbol, industry] of mapped.entries()) {
          const stockData: StockData = {
            symbol,
            industry
          };

          if (includeFundamentals && this.fundamentalsData.has(symbol)) {
            stockData.fundamentals = this.fundamentalsData.get(symbol);
          }

          if (this.resultsCalendar.has(symbol)) {
            stockData.resultsDate = this.resultsCalendar.get(symbol);
          }

          stockDataList.push(stockData);
        }

        // Simple formatted outputs
        const symbols = Array.from(mapped.keys()).sort();
        const flatOutput = symbols.map(s => `NSE:${s}`).join(',');

        // Create industry-categorized output for TradingView
        let tvFormattedOutput = '';

        // Group symbols by industry
        const symbolsByIndustry = new Map<string, string[]>();
        for (const [symbol, industry] of mapped.entries()) {
          if (!symbolsByIndustry.has(industry)) {
            symbolsByIndustry.set(industry, []);
          }
          symbolsByIndustry.get(industry)?.push(symbol);
        }

        // Sort the industries by the number of symbols they contain (descending)
        const sortedIndustries = Array.from(symbolsByIndustry.entries())
          .sort((a, b) => b[1].length - a[1].length);

        // Format industry categories for TradingView using ### format
        for (const [industry, industrySymbols] of sortedIndustries) {
          // Add industry as a category header with symbol count
          tvFormattedOutput += `###${industry}(${industrySymbols.length}),`;

          // Add symbols for this industry
          const formattedSymbols = industrySymbols.sort().map(s => `NSE:${s}`).join(',');
          tvFormattedOutput += formattedSymbols;

          // Add comma after each industry group (except the last one)
          const currentIndex = sortedIndustries.findIndex(([ind]) => ind === industry);
          if (currentIndex < sortedIndustries.length - 1) {
            tvFormattedOutput += ',';
          }
        }

        resolve({
          mappedSymbols: stockDataList,
          invalidSymbols: invalid,
          tvFormattedOutput,
          flatOutput
        });
      } catch (error) {
        console.error('Error processing symbols:', error);
        resolve({
          mappedSymbols: [],
          invalidSymbols: [],
          tvFormattedOutput: '',
          flatOutput: ''
        });
      }
    });
  }
}
