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
import { useSearchParams } from "react-router-dom";

export function PromotionFilters({
  onFilterChange,
  userRole,
}: {
  onFilterChange: (filters: {
    name?: string;
    type?: "automatic" | "one-time";
    started?: boolean;
    ended?: boolean;
  }) => void;
  userRole: "regular" | "manager" | "admin";
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const isManager = userRole === "manager" || userRole === "admin";
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize state from URL query parameters
  const [name, setName] = useState<string>(searchParams.get("name") || "");
  const [type, setType] = useState<"automatic" | "one-time" | undefined>(
    (searchParams.get("type") as "automatic" | "one-time") || undefined
  );
  const [started, setStarted] = useState<boolean | undefined>(
    searchParams.has("started")
      ? searchParams.get("started") === "true"
      : undefined
  );
  const [ended, setEnded] = useState<boolean | undefined>(
    searchParams.has("ended") ? searchParams.get("ended") === "true" : undefined
  );

  // Initialize filters on component mount
  useEffect(() => {
    // Only apply filters from URL on initial load if there are any params
    if (searchParams.toString()) {
      const initialFilters: {
        name?: string;
        type?: "automatic" | "one-time";
        started?: boolean;
        ended?: boolean;
      } = {};

      if (searchParams.has("name")) {
        initialFilters.name = searchParams.get("name") || undefined;
      }

      if (searchParams.has("type")) {
        const typeValue = searchParams.get("type");
        if (typeValue === "automatic" || typeValue === "one-time") {
          initialFilters.type = typeValue;
        }
      }

      // Only include manager-specific filters if user is a manager
      if (isManager) {
        if (searchParams.has("started")) {
          initialFilters.started = searchParams.get("started") === "true";
        }

        if (searchParams.has("ended")) {
          initialFilters.ended = searchParams.get("ended") === "true";
        }
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
    type?: "automatic" | "one-time";
    started?: boolean;
    ended?: boolean;
  }) => {
    const newSearchParams = new URLSearchParams();

    if (filters.name) {
      newSearchParams.set("name", filters.name);
    }

    if (filters.type) {
      newSearchParams.set("type", filters.type);
    }

    // Only include manager-specific filters if user is a manager
    if (isManager) {
      if (filters.started !== undefined) {
        newSearchParams.set("started", String(filters.started));
      }

      if (filters.ended !== undefined) {
        newSearchParams.set("ended", String(filters.ended));
      }
    }

    setSearchParams(newSearchParams);
  };

  const handleApplyFilters = () => {
    const filters: {
      name?: string;
      type?: "automatic" | "one-time";
      started?: boolean;
      ended?: boolean;
    } = {
      name: name || undefined,
      type,
      // Only include manager-specific filters if user is a manager
      ...(isManager && { started, ended }),
    };

    // Update URL query parameters
    updateSearchParams(filters);

    // Notify parent component
    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    setName("");
    setType(undefined);
    if (isManager) {
      setStarted(undefined);
      setEnded(undefined);
    }

    // Clear URL query parameters
    setSearchParams(new URLSearchParams());

    // Notify parent component
    onFilterChange({});
  };

  const handleRemoveFilter = (filterName: string) => {
    const newFilters: {
      name?: string;
      type?: "automatic" | "one-time";
      started?: boolean;
      ended?: boolean;
    } = {
      name: name || undefined,
      type,
      // Only include manager-specific filters if user is a manager
      ...(isManager && { started, ended }),
    };

    // Remove the specified filter
    delete newFilters[filterName as keyof typeof newFilters];

    // Update component state based on the filter being removed
    if (filterName === "name") setName("");
    if (filterName === "type") setType(undefined);
    if (filterName === "started") setStarted(undefined);
    if (filterName === "ended") setEnded(undefined);

    // Update URL query parameters
    updateSearchParams(newFilters);

    // Notify parent component
    onFilterChange(newFilters);
  };

  const hasActiveFilters = () => {
    if (isManager) {
      return (
        name ||
        type !== undefined ||
        started !== undefined ||
        ended !== undefined
      );
    }
    return name || type !== undefined;
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
            {type && (
              <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center">
                Type: {type}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveFilter("type")}
                />
              </div>
            )}
            {isManager && started !== undefined && (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                Started: {started ? "Yes" : "No"}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveFilter("started")}
                />
              </div>
            )}
            {isManager && ended !== undefined && (
              <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center">
                Ended: {ended ? "Yes" : "No"}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveFilter("ended")}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {isExpanded && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Promotion Name
                </label>
                <input
                  type="text"
                  placeholder="Enter Promotion Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Promotion Type
                </label>
                <Select
                  value={type || "all"}
                  onValueChange={(value) =>
                    setType(
                      value === "all"
                        ? undefined
                        : (value as "automatic" | "one-time")
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="automatic">Automatic</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isManager && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Started Status
                    </label>
                    <Select
                      value={started === undefined ? "all" : String(started)}
                      onValueChange={(value) =>
                        setStarted(
                          value === "all" ? undefined : value === "true"
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Started Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Promotions</SelectItem>
                        <SelectItem value="true">Started</SelectItem>
                        <SelectItem value="false">Not Started</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Ended Status
                    </label>
                    <Select
                      value={ended === undefined ? "all" : String(ended)}
                      onValueChange={(value) =>
                        setEnded(value === "all" ? undefined : value === "true")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ended Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Promotions</SelectItem>
                        <SelectItem value="true">Ended</SelectItem>
                        <SelectItem value="false">Not Ended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
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
