import { useState } from 'react';
import { Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { RoadListPanel } from './RoadListPanel';
import { JunctionListPanel } from './JunctionListPanel';
import { SignalListPanel } from './SignalListPanel';
import { useOdrSidebarStore } from '../../../hooks/use-opendrive-store';

/**
 * Main sidebar container for the Road Network editor mode.
 * Provides tabbed navigation between Roads, Junctions, and Signals,
 * with a shared search/filter input at the top.
 */
export function OdrSidebar() {
  const [activeTab, setActiveTab] = useState<string>('roads');
  const searchQuery = useOdrSidebarStore((s) => s.searchQuery);
  const setSearchQuery = useOdrSidebarStore((s) => s.setSearchQuery);

  return (
    <div className="flex flex-col h-full bg-[var(--color-glass-1)] border-r border-[var(--color-glass-edge)]">
      {/* Search input */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter..."
            className="h-7 pl-8 text-[12px] bg-[var(--color-glass-2)] border-[var(--color-glass-edge)]"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <TabsList className="w-full shrink-0 bg-[var(--color-glass-2)] border-b border-[var(--color-glass-edge)] px-1">
          <TabsTrigger
            value="roads"
            className="flex-1 text-[11px] data-[state=active]:bg-[var(--color-glass-active)] data-[state=active]:text-[var(--color-text-primary)]"
          >
            Roads
          </TabsTrigger>
          <TabsTrigger
            value="junctions"
            className="flex-1 text-[11px] data-[state=active]:bg-[var(--color-glass-active)] data-[state=active]:text-[var(--color-text-primary)]"
          >
            Junctions
          </TabsTrigger>
          <TabsTrigger
            value="signals"
            className="flex-1 text-[11px] data-[state=active]:bg-[var(--color-glass-active)] data-[state=active]:text-[var(--color-text-primary)]"
          >
            Signals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roads" className="flex-1 mt-0 min-h-0">
          <RoadListPanel searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="junctions" className="flex-1 mt-0 min-h-0">
          <JunctionListPanel searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="signals" className="flex-1 mt-0 min-h-0">
          <SignalListPanel searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
