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

export function TransactionFilters({
  onFilterChange,
  filterMode
}: {
  onFilterChange: (filters: {
    name?: string;
    createdBy?: string;
    suspicious?: boolean;
    typeFilter?: string;
    relatedId?: number;
    promotionId?: number;
    amount?: number;
    operator?: 'gte' | 'lte';
  }) => void;
  filterMode: "partial" | "all" // partial: user, cashier; all: manager, superuser
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [relatedId, setRelatedId] = useState<number | undefined>(undefined);
  const [promotionId, setPromotionId] = useState<number | undefined>(undefined);
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [operator, setOperator] = useState<string>('gte');

  // New state for "all" filter mode
  const [name, setName] = useState<string>('');
  const [createdBy, setCreatedBy] = useState<string>('');
  const [suspicious, setSuspicious] = useState<boolean>(false);

  const handleApplyFilters = () => {
    const filters = {
      typeFilter: typeFilter !== 'all' ? typeFilter : undefined,
      relatedId,
      promotionId,
      amount,
      operator: operator as 'gte' | 'lte'
    };

    // Add additional filters for "all" mode
    if (filterMode === "all") {
      Object.assign(filters, {
        name: name || undefined,
        createdBy: createdBy || undefined,
        suspicious: suspicious || undefined
      });
    }

    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    setTypeFilter('all');
    setRelatedId(undefined);
    setPromotionId(undefined);
    setAmount(undefined);
    setOperator('gte');

    // Reset additional filters for "all" mode
    setName('');
    setCreatedBy('');
    setSuspicious(false);

    onFilterChange({});
  };

  const hasActiveFilters = () => {
    const baseFilters = typeFilter !== 'all' || relatedId || promotionId || amount;
    const advancedFilters = filterMode === "all" && (name || createdBy || suspicious);
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
            {typeFilter !== 'all' && (
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center">
                Type: {typeFilter}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setTypeFilter('all');
                    onFilterChange({
                      ...{
                        relatedId,
                        promotionId,
                        amount,
                        operator: operator as 'gte' | 'lte',
                        ...(filterMode === "all" && {
                          name: name || undefined,
                          createdBy: createdBy || undefined,
                          suspicious: suspicious || undefined
                        })
                      },
                      typeFilter: undefined
                    });
                  }}
                />
              </div>
            )}
            {relatedId && (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                Related ID: {relatedId}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setRelatedId(undefined);
                    onFilterChange({
                      ...{
                        typeFilter: typeFilter !== 'all' ? typeFilter : undefined,
                        promotionId,
                        amount,
                        operator: operator as 'gte' | 'lte',
                        ...(filterMode === "all" && {
                          name: name || undefined,
                          createdBy: createdBy || undefined,
                          suspicious: suspicious || undefined
                        })
                      },
                      relatedId: undefined
                    });
                  }}
                />
              </div>
            )}
            {promotionId && (
              <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center">
                Promotion ID: {promotionId}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setPromotionId(undefined);
                    onFilterChange({
                      ...{
                        typeFilter: typeFilter !== 'all' ? typeFilter : undefined,
                        relatedId,
                        amount,
                        operator: operator as 'gte' | 'lte',
                        ...(filterMode === "all" && {
                          name: name || undefined,
                          createdBy: createdBy || undefined,
                          suspicious: suspicious || undefined
                        })
                      },
                      promotionId: undefined
                    });
                  }}
                />
              </div>
            )}
            {amount && (
              <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center">
                Amount {operator === 'gte' ? '>=' : '<='}: {amount}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setAmount(undefined);
                    onFilterChange({
                      ...{
                        typeFilter: typeFilter !== 'all' ? typeFilter : undefined,
                        relatedId,
                        promotionId,
                        operator: operator as 'gte' | 'lte',
                        ...(filterMode === "all" && {
                          name: name || undefined,
                          createdBy: createdBy || undefined,
                          suspicious: suspicious || undefined
                        })
                      },
                      amount: undefined
                    });
                  }}
                />
              </div>
            )}

            {/* New filter chips for "all" mode */}
            {filterMode === "all" && name && (
              <div className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs flex items-center">
                Name: {name}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setName('');
                    onFilterChange({
                      ...{
                        typeFilter: typeFilter !== 'all' ? typeFilter : undefined,
                        relatedId,
                        promotionId,
                        amount,
                        operator: operator as 'gte' | 'lte',
                        createdBy: createdBy || undefined,
                        suspicious: suspicious || undefined
                      },
                      name: undefined
                    });
                  }}
                />
              </div>
            )}
            {filterMode === "all" && createdBy && (
              <div className="bg-pink-100 text-pink-800 px-2 py-1 rounded-full text-xs flex items-center">
                Created By: {createdBy}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setCreatedBy('');
                    onFilterChange({
                      ...{
                        typeFilter: typeFilter !== 'all' ? typeFilter : undefined,
                        relatedId,
                        promotionId,
                        amount,
                        operator: operator as 'gte' | 'lte',
                        name: name || undefined,
                        suspicious: suspicious || undefined
                      },
                      createdBy: undefined
                    });
                  }}
                />
              </div>
            )}
            {filterMode === "all" && suspicious && (
              <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center">
                Suspicious: Yes
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setSuspicious(false);
                    onFilterChange({
                      ...{
                        typeFilter: typeFilter !== 'all' ? typeFilter : undefined,
                        relatedId,
                        promotionId,
                        amount,
                        operator: operator as 'gte' | 'lte',
                        name: name || undefined,
                        createdBy: createdBy || undefined
                      },
                      suspicious: undefined
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
              {/* Show additional filters for "all" mode */}
              {filterMode === "all" && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="Filter by name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border rounded-md p-2 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Created By
                    </label>
                    <input
                      type="text"
                      placeholder="Filter by creator"
                      value={createdBy}
                      onChange={(e) => setCreatedBy(e.target.value)}
                      className="w-full border rounded-md p-2 text-sm"
                    />
                  </div>

                  <div className="space-y-2 flex items-center">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="suspicious"
                        checked={suspicious}
                        onCheckedChange={setSuspicious}
                      />
                      <Label htmlFor="suspicious" className="text-sm font-medium text-gray-700">
                        Show Suspicious Only
                      </Label>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Transaction Type
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="PURCHASE">Purchase</SelectItem>
                    <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                    <SelectItem value="REDEMPTION">Redemption</SelectItem>
                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                    <SelectItem value="EVENT">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Related ID
                </label>
                <input
                  type="number"
                  placeholder="Enter Related ID"
                  value={relatedId === undefined ? '' : relatedId}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value >= 0 || e.target.value === '') {
                      setRelatedId(e.target.value ? value : undefined);
                    }
                  }}
                  className="w-full border rounded-md p-2 text-sm"
                  disabled={typeFilter === 'all'}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Promotion ID
                </label>
                <input
                  type="number"
                  placeholder="Enter Promotion ID"
                  value={promotionId === undefined ? '' : promotionId}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value >= 0 || e.target.value === '') {
                      setPromotionId(e.target.value ? value : undefined);
                    }
                  }}
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Amount Filter
                </label>
                <div className="flex items-center space-x-2">
                  <Select value={operator} onValueChange={(value) => setOperator(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gte">≥</SelectItem>
                      <SelectItem value="lte">≤</SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={amount === undefined ? '' : amount}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value >= 0 || e.target.value === '') {
                        setAmount(e.target.value ? value : undefined);
                      }
                    }}
                    className="w-full border rounded-md p-2 text-sm"
                  />
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