"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IndustryMapper } from "@/lib/data-processor"
import { useAppContext } from "@/context/app-context"
import { toast } from "sonner"
import {
  Star as StarIcon,
  Copy as CopyIcon,
  X,
  XCircle,
  ArrowUpDown as ArrowUpDownIcon,
  Trash2 as Trash2Icon,
  GripVertical
} from "lucide-react"
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import { restrictToParentElement } from "@dnd-kit/modifiers"
import {
  AnimatedContainer,
  AnimatedList,
  AnimatedListItem,
  AnimatedButton
} from "@/components/ui/animated-container"

// Sort Item component for drag and drop
function SortableItem({ id, industry, onRemove }: { id: string; industry: string | null; onRemove: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <AnimatedContainer
      as="div"
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between py-1.5 px-2 sm:px-3 rounded-md text-sm bg-muted cursor-move touch-manipulation transition-colors duration-200 hover:bg-muted/70"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-1.5 overflow-hidden">
        <GripVertical className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        <span className="truncate font-medium" title={id}>{id}</span>
        {industry && (
          <span className="text-xs px-1.5 py-0.5 bg-background/50 rounded">{industry}</span>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <AnimatedButton
          className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive bg-transparent flex items-center justify-center rounded-full"
          onClick={() => onRemove(id)}
        >
          <X className="h-3.5 w-3.5" />
        </AnimatedButton>
      </div>
    </AnimatedContainer>
  )
}

interface WatchlistProps {
  mapper: IndustryMapper | null;
}

export function Watchlist({ mapper }: WatchlistProps) {
  const { watchlist, reorderWatchlist, removeFromWatchlist, clearWatchlist } = useAppContext()
  const [reorderMode, setReorderMode] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const toggleReorderMode = () => {
    setReorderMode(!reorderMode)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = watchlist.indexOf(active.id as string)
      const newIndex = watchlist.indexOf(over.id as string)

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderWatchlist(oldIndex, newIndex)
      }
    }
  }

  const handleRemoveFromWatchlist = (symbol: string) => {
    removeFromWatchlist(symbol)
    toast.success(`Removed ${symbol} from watchlist`)
  }

  const handleCopyWatchlist = () => {
    if (watchlist.length > 0) {
      navigator.clipboard.writeText(watchlist.join(", "))
      toast.success("Copied watchlist to clipboard")
    }
  }

  const getIndustryForSymbol = (symbol: string): string | null => {
    if (!mapper) return null
    return mapper.getIndustryForSymbol(symbol)
  }

  // Regular item render (no drag and drop)
  const renderSymbolItem = (symbol: string, index: number) => (
    <AnimatedListItem
      key={index}
      className="flex items-center justify-between py-1.5 px-2 sm:px-3 rounded-md text-sm hover:bg-muted/50 transition-colors duration-200"
    >
      <div className="flex items-center gap-1.5 overflow-hidden">
        <span className="truncate font-medium" title={symbol}>{symbol}</span>
        {getIndustryForSymbol(symbol) && (
          <span className="text-xs px-1.5 py-0.5 bg-background/50 rounded">{getIndustryForSymbol(symbol)}</span>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <AnimatedButton
          className="h-7 w-7 sm:h-8 sm:w-8 bg-transparent hover:bg-muted/80 rounded-full flex items-center justify-center"
          onClick={() => {
            navigator.clipboard.writeText(symbol)
            toast.success(`Copied ${symbol} to clipboard`)
          }}
        >
          <CopyIcon className="h-3.5 w-3.5" />
        </AnimatedButton>
        <AnimatedButton
          className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive/90 bg-transparent hover:bg-background/50 rounded-full flex items-center justify-center"
          onClick={() => handleRemoveFromWatchlist(symbol)}
        >
          <X className="h-3.5 w-3.5" />
        </AnimatedButton>
      </div>
    </AnimatedListItem>
  )

  return (
    <AnimatedContainer type="fadeUp" className="h-full">
      <Card className="h-full">
        <CardHeader className="p-3 sm:p-6 pb-2">
          <div className="flex justify-between items-center">
            <AnimatedContainer type="fadeUp">
              <div>
                <CardTitle className="text-base sm:text-xl flex items-center">
                  <StarIcon className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500" />
                  Watchlist
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  {watchlist.length} {watchlist.length === 1 ? 'symbol' : 'symbols'} saved
                </CardDescription>
              </div>
            </AnimatedContainer>

            {watchlist.length > 1 && (
              <AnimatedContainer type="fadeUp" delay={0.1}>
                <div className="flex gap-1">
                  <AnimatedButton
                    className={`h-8 text-xs px-3 py-1 rounded-md transition-all duration-200 ${
                      reorderMode
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border text-foreground hover:bg-muted/60'
                    }`}
                    onClick={toggleReorderMode}
                  >
                    {reorderMode ? 'Done' : 'Reorder'}
                  </AnimatedButton>

                  {!reorderMode && (
                    <>
                      <AnimatedButton
                        className="h-8 w-8 border border-border text-foreground hover:bg-muted/60 rounded-md flex items-center justify-center transition-all duration-200"
                        onClick={handleCopyWatchlist}
                      >
                        <CopyIcon className="h-4 w-4" />
                      </AnimatedButton>
                      <AnimatedButton
                        className="h-8 w-8 border border-border text-destructive hover:bg-destructive/10 rounded-md flex items-center justify-center transition-all duration-200"
                        onClick={() => {
                          if (confirm("Clear watchlist?")) {
                            clearWatchlist()
                            toast.success("Watchlist cleared")
                          }
                        }}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </AnimatedButton>
                    </>
                  )}
                </div>
              </AnimatedContainer>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-2">
          {watchlist.length > 0 ? (
            <div className="space-y-1">
              {reorderMode ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToParentElement]}
                >
                  <SortableContext items={watchlist} strategy={verticalListSortingStrategy}>
                    <AnimatedList staggerDelay={0.025}>
                      {watchlist.map((item) => (
                        <SortableItem
                          key={item}
                          id={item}
                          industry={getIndustryForSymbol(item)}
                          onRemove={handleRemoveFromWatchlist}
                        />
                      ))}
                    </AnimatedList>
                  </SortableContext>
                </DndContext>
              ) : (
                <AnimatedList staggerDelay={0.025}>
                  {watchlist.map((item, index) => renderSymbolItem(item, index))}
                </AnimatedList>
              )}
            </div>
          ) : (
            <AnimatedContainer type="fadeUp" className="text-center py-6">
              <StarIcon className="h-8 w-8 mx-auto text-muted-foreground opacity-20" />
              <p className="text-sm text-muted-foreground mt-2">Your watchlist is empty</p>
              <p className="text-xs text-muted-foreground mt-1">Add symbols from search results</p>
            </AnimatedContainer>
          )}
        </CardContent>
      </Card>
    </AnimatedContainer>
  )
}
