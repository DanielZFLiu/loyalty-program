import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PromotionFilters } from "@/components/filters/PromotionFilters";
import { getPromotions } from "@/lib/api/promotion";
import type { GetPromotionsQuery, Promotion } from "@/lib/api/promotion";
import { checkRole } from "@/lib/api/util";
import { useNavigate } from "react-router-dom";
import { PlusCircle, ChevronRight, CalendarRange } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PromotionCreateForm } from "@/components/managePromotions/PromotionCreateForm";

// Define enums to match your Prisma model
enum PromotionType {
  AUTOMATIC = "automatic",
  ONE_TIME = "one-time",
}

export function Promotions() {
  // Initialize state with empty array
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState<{
    name?: string;
    type?: "automatic" | "one-time";
    started?: boolean;
    ended?: boolean;
  }>({});

  useEffect(() => {
    // Check if user is manager or above
    const checkUserRole = async () => {
      const isManagerOrAbove = await checkRole("manager");
      setIsManager(isManagerOrAbove);
    };

    checkUserRole();
  }, []);

  useEffect(() => {
    // Define the fetch function
    const fetchPromotions = async () => {
      try {
        setLoading(true);

        const params: GetPromotionsQuery = {
          page: page,
          limit: 10,
          ...filters,
        };

        const response = await getPromotions(params);

        setPromotions(response.results);
        setTotalPages(Math.ceil(response.count / 10));
        setError(null);
      } catch (err) {
        console.error("Error fetching promotions:", err);
        setError("Failed to load promotions. Please try again later.");
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    };

    // Call the fetch function
    fetchPromotions();
  }, [page, filters]);

  const handleFilterChange = (newFilters: {
    name?: string;
    type?: "automatic" | "one-time";
    started?: boolean;
    ended?: boolean;
  }) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handlePromotionClick = (id: number) => {
    if (isManager) {
      navigate(`/promotions/${id}`);
    }
  };

  const handleCreatePromotion = (promotionId: number) => {
    setCreateDialogOpen(false);
    navigate(`/promotions/${promotionId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Active Promotions</CardTitle>
            {isManager && (
              <Dialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Create Promotion
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                  <PromotionCreateForm
                    onSuccess={handleCreatePromotion}
                    onCancel={() => setCreateDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Only show filters if user is a manager or above */}
          {isManager && (
            <PromotionFilters onFilterChange={handleFilterChange} />
          )}

          {/* Loading and error states */}
          {loading && (
            <div className="text-center py-8">Loading promotions...</div>
          )}
          {error && (
            <div className="text-center py-8 text-red-500">{error}</div>
          )}

          {/* Promotions list */}
          {!loading && !error && (
            <>
              {promotions.length > 0 ? (
                <div className="space-y-4">
                  {promotions.map((promotion) => (
                    <Card
                      key={promotion.id}
                      className={`${
                        isManager
                          ? "cursor-pointer hover:shadow-md transition-shadow group"
                          : ""
                      }`}
                      onClick={() => handlePromotionClick(promotion.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-semibold">
                                {promotion.name}
                              </h3>
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                  promotion.type === PromotionType.AUTOMATIC
                                    ? "bg-green-100 text-green-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {promotion.type}
                              </span>
                            </div>
                            <div className="mt-2 space-y-1">
                              {promotion.minSpending && (
                                <p className="text-sm text-gray-600">
                                  Min Spending: $
                                  {promotion.minSpending.toFixed(2)}
                                </p>
                              )}
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <CalendarRange className="h-4 w-4 text-blue-500" />
                                {promotion.startTime
                                  ? `${formatDate(
                                      promotion.startTime
                                    )} - ${formatDate(promotion.endTime)}`
                                  : `Valid until: ${formatDate(
                                      promotion.endTime
                                    )}`}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 text-right flex items-center">
                            <div>
                              {/* Made both rate and bonus points styling consistent */}
                              {promotion.rate && (
                                <p className="text-lg font-semibold text-green-600">
                                  Rate: x{promotion.rate.toFixed(0)}
                                </p>
                              )}
                              {promotion.points > 0 && (
                                <p className="text-lg font-semibold text-green-600">
                                  Points: {promotion.points}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                Promotion #{promotion.id}
                              </p>
                            </div>
                            {isManager && (
                              <ChevronRight className="h-5 w-5 text-gray-400 ml-3 transition-transform group-hover:translate-x-1" />
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
