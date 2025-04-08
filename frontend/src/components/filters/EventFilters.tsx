import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "react-router-dom";

export function EventFilters({
  onFilterChange,
  filterMode,
}: {
  onFilterChange: (filters: {
    name?: string;
    location?: string;
    started?: boolean;
    ended?: boolean;
    showFull?: boolean;
    published?: boolean;
  }) => void;
  filterMode: "partial" | "all"; // partial: user, cashier; all: manager, superuser
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize state from URL query parameters
  const [name, setName] = useState<string>(searchParams.get("name") || "");
  const [location, setLocation] = useState<string>(
    searchParams.get("location") || ""
  );
  const [started, setStarted] = useState<boolean | undefined>(
    searchParams.has("started")
      ? searchParams.get("started") === "true"
      : undefined
  );
  const [ended, setEnded] = useState<boolean | undefined>(
    searchParams.has("ended") ? searchParams.get("ended") === "true" : undefined
  );
  const [showFull, setShowFull] = useState<boolean>(
    searchParams.get("showFull") === "true"
  );
  const [published, setPublished] = useState<boolean | undefined>(
    searchParams.has("published")
      ? searchParams.get("published") === "true"
      : undefined
  );

  // Initialize filters on component mount
  useEffect(() => {
    // Only apply filters from URL on initial load if there are any params
    if (searchParams.toString()) {
      const initialFilters: {
        name?: string;
        location?: string;
        started?: boolean;
        ended?: boolean;
        showFull?: boolean;
        published?: boolean;
      } = {};

      if (searchParams.has("name")) {
        initialFilters.name = searchParams.get("name") || undefined;
      }

      if (searchParams.has("location")) {
        initialFilters.location = searchParams.get("location") || undefined;
      }

      if (searchParams.has("started")) {
        initialFilters.started = searchParams.get("started") === "true";
      }

      if (searchParams.has("ended")) {
        initialFilters.ended = searchParams.get("ended") === "true";
      }

      if (searchParams.has("showFull")) {
        initialFilters.showFull = searchParams.get("showFull") === "true";
      }

      if (filterMode === "all" && searchParams.has("published")) {
        initialFilters.published = searchParams.get("published") === "true";
      }

      // Notify parent component of initial filters
      onFilterChange(initialFilters);

      // If there are any filters in the URL, expand the filter panel
      if (Object.keys(initialFilters).length > 0) {
        setIsExpanded(true);
      }
    }
  }, []);

  const updateSearchParams = (filters: {
    name?: string;
    location?: string;
    started?: boolean;
    ended?: boolean;
    showFull?: boolean;
    published?: boolean;
  }) => {
    const newSearchParams = new URLSearchParams();

    if (filters.name) {
      newSearchParams.set("name", filters.name);
    }

    if (filters.location) {
      newSearchParams.set("location", filters.location);
    }

    if (filters.started !== undefined) {
      newSearchParams.set("started", String(filters.started));
    }

    if (filters.ended !== undefined) {
      newSearchParams.set("ended", String(filters.ended));
    }

    if (filters.showFull) {
      newSearchParams.set("showFull", String(filters.showFull));
    }

    if (filterMode === "all" && filters.published !== undefined) {
      newSearchParams.set("published", String(filters.published));
    }

    setSearchParams(newSearchParams);
  };

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
      showFull: showFull || undefined,
    };

    // Add published filter for "all" mode
    if (filterMode === "all") {
      filters.published = published;
    }

    // Update URL query parameters
    updateSearchParams(filters);

    // Notify parent component
    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    setName("");
    setLocation("");
    setStarted(undefined);
    setEnded(undefined);
    setShowFull(false);
    setPublished(undefined);

    // Clear URL query parameters
    setSearchParams(new URLSearchParams());

    // Notify parent component
    onFilterChange({});
  };

  const handleRemoveFilter = (filterName: string) => {
    const newFilters: {
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
      showFull: showFull || undefined,
    };

    if (filterMode === "all") {
      newFilters.published = published;
    }

    // Remove the specified filter
    delete newFilters[filterName as keyof typeof newFilters];

    // Update component state based on the filter being removed
    if (filterName === "name") setName("");
    if (filterName === "location") setLocation("");
    if (filterName === "started") setStarted(undefined);
    if (filterName === "ended") setEnded(undefined);
    if (filterName === "showFull") setShowFull(false);
    if (filterName === "published") setPublished(undefined);

    // Update URL query parameters
    updateSearchParams(newFilters);

    // Notify parent component
    onFilterChange(newFilters);
  };

  const hasActiveFilters = () => {
    const baseFilters =
      name ||
      location ||
      started !== undefined ||
      ended !== undefined ||
      showFull;
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
                  onClick={() => handleRemoveFilter("name")}
                />
              </div>
            )}
            {location && (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                Location: {location}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveFilter("location")}
                />
              </div>
            )}
            {started !== undefined && (
              <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center">
                Started: {started ? "Yes" : "No"}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveFilter("started")}
                />
              </div>
            )}
            {ended !== undefined && (
              <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center">
                Ended: {ended ? "Yes" : "No"}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveFilter("ended")}
                />
              </div>
            )}
            {showFull && (
              <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center">
                Show Full Events
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveFilter("showFull")}
                />
              </div>
            )}
            {/* New filter chip for published filter */}
            {filterMode === "all" && published !== undefined && (
              <div className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs flex items-center">
                Published: {published ? "Yes" : "No"}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveFilter("published")}
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
                    value={started === undefined ? "all" : String(started)}
                    onValueChange={(value) => {
                      setStarted(
                        value === "all" ? undefined : value === "true"
                      );
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
                    value={ended === undefined ? "all" : String(ended)}
                    onValueChange={(value) => {
                      setEnded(value === "all" ? undefined : value === "true");
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
                  <Label
                    htmlFor="show-full"
                    className="text-sm font-medium text-gray-700"
                  >
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
                      value={
                        published === undefined ? "all" : String(published)
                      }
                      onValueChange={(value) => {
                        setPublished(
                          value === "all" ? undefined : value === "true"
                        );
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
              <Button variant="outline" onClick={handleResetFilters}>
                Reset Filters
              </Button>
              <Button onClick={handleApplyFilters}>Apply Filters</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
