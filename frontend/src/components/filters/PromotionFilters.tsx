import { useState } from "react";
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

export function PromotionFilters({
  onFilterChange,
}: {
  onFilterChange: (filters: {
    name?: string;
    type?: "automatic" | "one-time";
    started?: boolean;
    ended?: boolean;
  }) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<"automatic" | "one-time" | undefined>(
    undefined
  );
  const [started, setStarted] = useState<boolean | undefined>(undefined);
  const [ended, setEnded] = useState<boolean | undefined>(undefined);

  const handleApplyFilters = () => {
    onFilterChange({
      name: name || undefined,
      type,
      started,
      ended,
    });
  };

  const handleResetFilters = () => {
    setName("");
    setType(undefined);
    setStarted(undefined);
    setEnded(undefined);
    onFilterChange({});
  };

  const hasActiveFilters = () => {
    return (
      name || type !== undefined || started !== undefined || ended !== undefined
    );
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
                    setName("");
                    onFilterChange({
                      type,
                      started,
                      ended,
                    });
                  }}
                />
              </div>
            )}
            {type && (
              <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center">
                Type: {type}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setType(undefined);
                    onFilterChange({
                      name: name || undefined,
                      started,
                      ended,
                    });
                  }}
                />
              </div>
            )}
            {started !== undefined && (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                Started: {started ? "Yes" : "No"}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setStarted(undefined);
                    onFilterChange({
                      name: name || undefined,
                      type,
                      ended,
                    });
                  }}
                />
              </div>
            )}
            {ended !== undefined && (
              <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center">
                Ended: {ended ? "Yes" : "No"}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setEnded(undefined);
                    onFilterChange({
                      name: name || undefined,
                      type,
                      started,
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Started Status
                </label>
                <Select
                  value={started === undefined ? "all" : String(started)}
                  onValueChange={(value) =>
                    setStarted(value === "all" ? undefined : value === "true")
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
