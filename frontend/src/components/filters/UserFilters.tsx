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

export function UserFilters({
  onFilterChange,
}: {
  onFilterChange: (filters: {
    name?: string;
    role?: string;
    verified?: boolean;
    activated?: boolean;
  }) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize state from URL query parameters
  const [name, setName] = useState<string>(searchParams.get("name") || "");
  const [role, setRole] = useState<string>(searchParams.get("role") || "");
  const [verified, setVerified] = useState<boolean | undefined>(
    searchParams.has("verified")
      ? searchParams.get("verified") === "true"
      : undefined
  );
  const [activated, setActivated] = useState<boolean | undefined>(
    searchParams.has("activated")
      ? searchParams.get("activated") === "true"
      : undefined
  );

  // Initialize filters on component mount
  useEffect(() => {
    // Only apply filters from URL on initial load if there are any params
    if (searchParams.toString()) {
      const initialFilters: {
        name?: string;
        role?: string;
        verified?: boolean;
        activated?: boolean;
      } = {};

      if (searchParams.has("name")) {
        initialFilters.name = searchParams.get("name") || undefined;
      }

      if (searchParams.has("role")) {
        initialFilters.role = searchParams.get("role") || undefined;
      }

      if (searchParams.has("verified")) {
        initialFilters.verified = searchParams.get("verified") === "true";
      }

      if (searchParams.has("activated")) {
        initialFilters.activated = searchParams.get("activated") === "true";
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
    role?: string;
    verified?: boolean;
    activated?: boolean;
  }) => {
    const newSearchParams = new URLSearchParams();

    if (filters.name) {
      newSearchParams.set("name", filters.name);
    }

    if (filters.role) {
      newSearchParams.set("role", filters.role);
    }

    if (filters.verified !== undefined) {
      newSearchParams.set("verified", String(filters.verified));
    }

    if (filters.activated !== undefined) {
      newSearchParams.set("activated", String(filters.activated));
    }

    setSearchParams(newSearchParams);
  };

  const handleApplyFilters = () => {
    const filters = {
      name: name || undefined,
      role: role || undefined,
      verified,
      activated,
    };

    // Update URL query parameters
    updateSearchParams(filters);

    // Notify parent component
    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    setName("");
    setRole("");
    setVerified(undefined);
    setActivated(undefined);

    // Clear URL query parameters
    setSearchParams(new URLSearchParams());

    // Notify parent component
    onFilterChange({});
  };

  const handleRemoveFilter = (filterName: string) => {
    const newFilters = {
      name: name || undefined,
      role: role || undefined,
      verified,
      activated,
    };

    // Remove the specified filter
    delete newFilters[filterName as keyof typeof newFilters];

    // Update component state based on the filter being removed
    if (filterName === "name") setName("");
    if (filterName === "role") setRole("");
    if (filterName === "verified") setVerified(undefined);
    if (filterName === "activated") setActivated(undefined);

    // Update URL query parameters
    updateSearchParams(newFilters);

    // Notify parent component
    onFilterChange(newFilters);
  };

  const hasActiveFilters = () => {
    return name || role || verified !== undefined || activated !== undefined;
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
            {role && (
              <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center">
                Role: {role}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveFilter("role")}
                />
              </div>
            )}
            {verified !== undefined && (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                Verified: {verified ? "Yes" : "No"}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveFilter("verified")}
                />
              </div>
            )}
            {activated !== undefined && (
              <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center">
                Activated: {activated ? "Yes" : "No"}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveFilter("activated")}
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
                  User Name
                </label>
                <input
                  type="text"
                  placeholder="Search by name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  User Role
                </label>
                <Select
                  value={role || "all"}
                  onValueChange={(value) =>
                    setRole(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="superuser">Superuser</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Verification Status
                </label>
                <Select
                  value={verified === undefined ? "all" : String(verified)}
                  onValueChange={(value) =>
                    setVerified(value === "all" ? undefined : value === "true")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Verification Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="true">Verified</SelectItem>
                    <SelectItem value="false">Not Verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Account Status
                </label>
                <Select
                  value={activated === undefined ? "all" : String(activated)}
                  onValueChange={(value) =>
                    setActivated(value === "all" ? undefined : value === "true")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Account Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    <SelectItem value="true">Activated</SelectItem>
                    <SelectItem value="false">Deactivated</SelectItem>
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
