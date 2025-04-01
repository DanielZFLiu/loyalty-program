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

export function EventFilters({ 
  onFilterChange,
  // filterMode
}: { 
  onFilterChange: (filters: {
    name?: string;
    location?: string;
    started?: boolean;
    ended?: boolean;
    showFull?: boolean;
  }) => void;
  // filterMode: "partial" | "all" // partial: user, cashier; all: manager, superuser
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<string | undefined>(undefined);
  const [started, setStarted] = useState<boolean | undefined>(undefined);
  const [ended, setEnded] = useState<boolean | undefined>(undefined);
  const [showFull, setShowFull] = useState<boolean>(false);

  const handleApplyFilters = () => {
    onFilterChange({
      name: name || undefined,
      location: location || undefined,
      started,
      ended,
      showFull
    });
  };

  const handleResetFilters = () => {
    setName(undefined);
    setLocation(undefined);
    setStarted(undefined);
    setEnded(undefined);
    setShowFull(false);
    onFilterChange({});
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
        {(name || location || started !== undefined || ended !== undefined || showFull) && (
          <div className="flex space-x-2">
            {name && (
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center">
                Name: {name}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    setName(undefined);
                    handleApplyFilters();
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
                    setLocation(undefined);
                    handleApplyFilters();
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
                    handleApplyFilters();
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
                    handleApplyFilters();
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
                    handleApplyFilters();
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
                  value={name || ''}
                  onChange={(e) => setName(e.target.value || undefined)}
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
                  value={location || ''}
                  onChange={(e) => setLocation(e.target.value || undefined)}
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
                      setEnded(undefined);
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
                  Show Full Events
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showFull}
                    onChange={(e) => setShowFull(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Include Full Events</span>
                </div>
              </div>
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