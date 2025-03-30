import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Define enums to match your Prisma model
enum PromotionType {
  AUTOMATIC = "automatic",
  ONE_TIME = "one-time"
}

// Update interface to match your database model
interface Promotion {
  id: number;
  name: string;
  description: string;
  type: PromotionType;
  startTime: string;
  endTime: string;
  minSpending: number | null;
  rate: number | null;
  points: number;
  createdAt: string;
}

export function Promotions() {
  // Initialize state with empty array
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simplified filters
  const [nameFilter, setNameFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Add state for filter visibility
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Define the fetch function
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Build query parameters
        const params = new URLSearchParams({
          page: String(page),
          limit: '10',
        });
        
        if (nameFilter) {
          params.append('name', nameFilter);
        }
        
        if (typeFilter && typeFilter !== 'all') {
          params.append('type', typeFilter);
        }
        
        // Make API request
        const response = await fetch(
          `http://localhost:3000/promotions?${params.toString()}`,
          {
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch promotions: ${response.status}`);
        }
        
        const data = await response.json();
        setPromotions(data.results);
        setTotalPages(Math.ceil(data.count / 10));
        setError(null);
      } catch (err) {
        console.error('Error fetching promotions:', err);
        setError('Failed to load promotions. Please try again later.');
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Call the fetch function
    fetchPromotions();
  }, [page, nameFilter, typeFilter]);

  // Handle filter changes
  const handleNameFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameFilter(e.target.value);
    setPage(1); // Reset to first page
  };
  
  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setPage(1); // Reset to first page
  };

  // Toggle filter visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Active Promotions</CardTitle>
            <Button
              variant="outline"
              onClick={toggleFilters}
              className="flex items-center gap-2"
            >
              {showFilters ? (
                <>
                  Hide Filters <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Show Filters <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters - now collapsible */}
          {showFilters && (
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Name
                </label>
                <Input
                  id="name-filter"
                  placeholder="Search promotions..."
                  value={nameFilter}
                  onChange={handleNameFilterChange}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Type
                </label>
                <Select
                  value={typeFilter}
                  onValueChange={handleTypeFilterChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="automatic">Automatic</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Loading and error states */}
          {loading && <div className="text-center py-8">Loading promotions...</div>}
          {error && <div className="text-center py-8 text-red-500">{error}</div>}

          {/* Promotions list */}
          {!loading && !error && (
            <>
              {promotions.length > 0 ? (
                <div className="space-y-4">
                  {promotions.map((promotion) => (
                    <Card key={promotion.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-semibold">{promotion.name}</h3>
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                  promotion.type === PromotionType.AUTOMATIC
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {promotion.type}
                              </span>
                            </div>
                            <div className="mt-2 space-y-1">
                              {promotion.minSpending && (
                                <p className="text-sm text-gray-600">
                                  Min Spending: ${promotion.minSpending.toFixed(2)}
                                </p>
                              )}
                              <p className="text-sm text-gray-600">
                                Valid until: {new Date(promotion.endTime).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 text-right">
                            {/* Made both rate and bonus points styling consistent */}
                            {promotion.rate && (
                              <p className="text-lg font-semibold text-green-600">
                                Rate: x{(promotion.rate).toFixed(0)}
                              </p>
                            )}
                            {promotion.points > 0 && (
                              <p className="text-lg font-semibold text-green-600">
                                Points: {promotion.points}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No active promotions found</p>
                </div>
              )}

              {/* Enhanced pagination */}
              {totalPages > 0 && (
                <div className="mt-6 flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}