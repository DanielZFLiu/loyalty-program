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

export function TransactionFilters({ 
  onFilterChange 
}: { 
  onFilterChange: (filters: {
    typeFilter?: string;
    relatedId?: number;
    promotionId?: number;
    amount?: number;
    operator?: 'gte' | 'lte';
  }) => void 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [relatedId, setRelatedId] = useState<number | undefined>(undefined);
  const [promotionId, setPromotionId] = useState<number | undefined>(undefined);
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [operator, setOperator] = useState<string>('gte');

  const handleApplyFilters = () => {
    onFilterChange({
      typeFilter: typeFilter !== 'all' ? typeFilter : undefined,
      relatedId,
      promotionId,
      amount,
      operator: operator as 'gte' | 'lte'
    });
  };

  const handleResetFilters = () => {
    setTypeFilter('all');
    setRelatedId(undefined);
    setPromotionId(undefined);
    setAmount(undefined);
    setOperator('gte');
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
        {(typeFilter !== 'all' || relatedId || promotionId || amount) && (
          <div className="flex space-x-2">
            {typeFilter !== 'all' && (
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center">
                Type: {typeFilter}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    setTypeFilter('all');
                    handleApplyFilters();
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
                    handleApplyFilters();
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
                    handleApplyFilters();
                  }} 
                />
              </div>
            )}
            {amount && (
              <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center">
                Amount {operator}: {amount}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    setAmount(undefined);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
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
                    Related ID (Must be used with Type)
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
                  <Select value={operator} onValueChange={(value) => setOperator(value as 'gte' | 'lte')}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gte">Greater than or equal</SelectItem>
                      <SelectItem value="lte">Less than or equal</SelectItem>
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