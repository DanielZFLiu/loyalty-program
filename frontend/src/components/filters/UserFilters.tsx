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
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [verified, setVerified] = useState<boolean | undefined>(undefined);
  const [activated, setActivated] = useState<boolean | undefined>(undefined);

  const handleApplyFilters = () => {
    onFilterChange({
      name: name || undefined,
      role: role || undefined,
      verified,
      activated,
    });
  };

  const handleResetFilters = () => {
    setName("");
    setRole("");
    setVerified(undefined);
    setActivated(undefined);
    onFilterChange({});
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
                  onClick={() => {
                    setName("");
                    onFilterChange({
                      role: role || undefined,
                      verified,
                      activated,
                    });
                  }}
                />
              </div>
            )}
            {role && (
              <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center">
                Role: {role}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setRole("");
                    onFilterChange({
                      name: name || undefined,
                      verified,
                      activated,
                    });
                  }}
                />
              </div>
            )}
            {verified !== undefined && (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                Verified: {verified ? "Yes" : "No"}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setVerified(undefined);
                    onFilterChange({
                      name: name || undefined,
                      role: role || undefined,
                      activated,
                    });
                  }}
                />
              </div>
            )}
            {activated !== undefined && (
              <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center">
                Activated: {activated ? "Yes" : "No"}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setActivated(undefined);
                    onFilterChange({
                      name: name || undefined,
                      role: role || undefined,
                      verified,
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
