import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Filter, X } from 'lucide-react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

export function EventFilters({
  onFilterChange,
  filterMode
}: {
  onFilterChange: (filters: {
    name?: string;
    location?: string;
    started?: boolean;
    ended?: boolean;
    showFull?: boolean;
    published?: boolean;
  }) => void;
  filterMode: "partial" | "all" // partial: user, cashier; all: manager, superuser
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [started, setStarted] = useState<boolean | undefined>(undefined);
  const [ended, setEnded] = useState<boolean | undefined>(undefined);
  const [showFull, setShowFull] = useState<boolean>(false);
  // New state for "all" filter mode
  const [published, setPublished] = useState<boolean | undefined>(undefined);

  const handleApplyFilters = () => {
    const filters: {
      name?: string;
      location?: string;
      started?: boolean;
      ended?: boolean;
      showFull?: boolean;
      published?: boolean;
    } = {
      name: name || undefined,
      location: location || undefined,
      started,
      ended,
      showFull: showFull || undefined
    };

    // Add published filter for "all" mode
    if (filterMode === "all") {
      filters.published = published;
    }

    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    setName('');
    setLocation('');
    setStarted(undefined);
    setEnded(undefined);
    setShowFull(false);
    setPublished(undefined);
    onFilterChange({});
  };

  const hasActiveFilters = () => {
    const baseFilters = name || location || started !== undefined || ended !== undefined || showFull;
    const advancedFilters = filterMode === "all" && published !== undefined;
    return baseFilters || advancedFilters;
  };

  return (
    <div className="w-full">
      <div className="flex items-center space-x-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
        {hasActiveFilters() && (
          <div className="flex flex-wrap gap-2">
            {name && (
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center">
                Name: {name}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setName('');
                    onFilterChange({
                      ...{
                        location: location || undefined,
                        started,
                        ended,
                        showFull: showFull || undefined,
                        ...(filterMode === "all" && { published })
                      },
                      name: undefined
                    });
                  }}
                />
              </div>
            )}
            {location && (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                Location: {location}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setLocation('');
                    onFilterChange({
                      ...{
                        name: name || undefined,
                        started,
                        ended,
                        showFull: showFull || undefined,
                        ...(filterMode === "all" && { published })
                      },
                      location: undefined
                    });
                  }}
                />
              </div>
            )}
            {started !== undefined && (
              <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center">
                Started: {started ? 'Yes' : 'No'}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setStarted(undefined);
                    onFilterChange({
                      ...{
                        name: name || undefined,
                        location: location || undefined,
                        ended,
                        showFull: showFull || undefined,
                        ...(filterMode === "all" && { published })
                      },
                      started: undefined
                    });
                  }}
                />
              </div>
            )}
            {ended !== undefined && (
              <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center">
                Ended: {ended ? 'Yes' : 'No'}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setEnded(undefined);
                    onFilterChange({
                      ...{
                        name: name || undefined,
                        location: location || undefined,
                        started,
                        showFull: showFull || undefined,
                        ...(filterMode === "all" && { published })
                      },
                      ended: undefined
                    });
                  }}
                />
              </div>
            )}
            {showFull && (
              <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center">
                Show Full Events
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setShowFull(false);
                    onFilterChange({
                      ...{
                        name: name || undefined,
                        location: location || undefined,
                        started,
                        ended,
                        ...(filterMode === "all" && { published })
                      },
                      showFull: undefined
                    });
                  }}
                />
              </div>
            )}
            {/* New filter chip for published filter */}
            {filterMode === "all" && published !== undefined && (
              <div className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs flex items-center">
                Published: {published ? 'Yes' : 'No'}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setPublished(undefined);
                    onFilterChange({
                      ...{
                        name: name || undefined,
                        location: location || undefined,
                        started,
                        ended,
                        showFull: showFull || undefined
                      },
                      published: undefined
                    });
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {isExpanded && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Event Name
                </label>
                <input
                  type="text"
                  placeholder="Enter Event Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Enter Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Event Status
                </label>
                <div className="flex space-x-2">
                  <Select
                    value={started === undefined ? 'all' : String(started)}
                    onValueChange={(value) => {
                      setStarted(value === 'all' ? undefined : value === 'true');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Started Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="true">Started</SelectItem>
                      <SelectItem value="false">Not Started</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ended Status
                </label>
                <div className="flex space-x-2">
                  <Select
                    value={ended === undefined ? 'all' : String(ended)}
                    onValueChange={(value) => {
                      setEnded(value === 'all' ? undefined : value === 'true');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ended Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="true">Ended</SelectItem>
                      <SelectItem value="false">Not Ended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 h-full mt-3">
                  <Switch
                    id="show-full"
                    checked={showFull}
                    onCheckedChange={setShowFull}
                  />
                  <Label htmlFor="show-full" className="text-sm font-medium text-gray-700">
                    Include Full Events
                  </Label>
                </div>
              </div>

              {/* New published filter for "all" mode */}
              {filterMode === "all" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Publication Status
                  </label>
                  <div className="flex space-x-2">
                    <Select
                      value={published === undefined ? 'all' : String(published)}
                      onValueChange={(value) => {
                        setPublished(value === 'all' ? undefined : value === 'true');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Publication Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="true">Published</SelectItem>
                        <SelectItem value="false">Unpublished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={handleResetFilters}
              >
                Reset Filters
              </Button>
              <Button onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}