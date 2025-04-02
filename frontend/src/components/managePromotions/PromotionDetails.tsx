import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getPromotion,
  deletePromotion,
  type Promotion,
} from "@/lib/api/promotion";
import { checkRole } from "@/lib/api/util";
import {
  PencilIcon,
  TrashIcon,
  CalendarRange,
  Clock,
  DollarSign,
  Scale,
  Coins,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PromotionEditForm } from "@/components/managePromotions/PromotionEditForm";

export function PromotionDetails() {
  const { promotionId } = useParams<{ promotionId: string }>();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);

  // State for dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const checkManagerStatus = async () => {
      const isManagerOrAbove = await checkRole("manager");
      setIsManager(isManagerOrAbove);

      if (!isManagerOrAbove) {
        setLoading(false);
        setError("You don't have permission to view promotion details.");
      }
      return isManagerOrAbove;
    };

    const fetchPromotionDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if user is manager
        const hasAccess = await checkManagerStatus();
        if (!hasAccess) return;

        // Fetch promotion details
        const response = await getPromotion(Number(promotionId));
        setPromotion(response);
      } catch (error) {
        console.error("Error fetching promotion details:", error);
        setError("Failed to load promotion details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPromotionDetails();
  }, [promotionId, navigate]);

  const handleEditSuccess = async () => {
    setEditDialogOpen(false);
    setStatusMessage("Promotion updated successfully!");

    // Refresh the promotion data
    try {
      const updatedPromotion = await getPromotion(Number(promotionId));
      setPromotion(updatedPromotion);
    } catch (error) {
      console.error("Error reloading promotion:", error);
    }
  };

  const handleDeletePromotion = async () => {
    setDeleteLoading(true);
    setError(null);

    try {
      await deletePromotion(Number(promotionId));
      setDeleteDialogOpen(false);
      setStatusMessage("Promotion deleted successfully!");

      // Navigate back to promotions list after a short delay
      setTimeout(() => {
        navigate("/promotions");
      }, 1500);
    } catch (error) {
      console.error("Error deleting promotion:", error);
      setError("Failed to delete promotion. Please try again.");
      setDeleteLoading(false);
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPromotionStatus = () => {
    if (!promotion) return "";

    const now = new Date();
    const startTime = promotion.startTime
      ? new Date(promotion.startTime)
      : null;
    const endTime = new Date(promotion.endTime);

    if (startTime && now < startTime) {
      return "Scheduled";
    } else if (now > endTime) {
      return "Expired";
    } else {
      return "Active";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-400 text-green-800";
      case "Scheduled":
        return "bg-blue-400 text-blue-800";
      case "Expired":
        return "bg-gray-400 text-gray-800";
      default:
        return "bg-gray-400 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-6">
          <p>Loading promotion details...</p>
        </div>
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="bg-red-400 text-red-800 p-4 rounded-md">
              {error || "Promotion not found"}
            </div>
            <Button className="mt-4" onClick={() => navigate("/promotions")}>
              Back to Promotions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = getPromotionStatus();

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl">{promotion.name}</CardTitle>
              <Badge classes={getStatusColor(status)} text={status}></Badge>
              <Badge
                classes={
                  promotion.type === "automatic"
                    ? "bg-green-400 text-green-800"
                    : "bg-purple-400 text-purple-800"
                }
                text={promotion.type === "automatic" ? "Automatic" : "One-time"}
              ></Badge>
            </div>

            {isManager && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {statusMessage && (
            <Alert classes="mb-6 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" classes="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Promotion Details</h3>

              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Description
                </h4>
                <p className="text-md whitespace-pre-wrap">
                  {promotion.description || "No description provided."}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Promotion ID
                </h4>
                <p className="text-md">#{promotion.id}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Promotion Type
                </h4>
                <p className="text-md flex items-center">
                  {promotion.type === "automatic" ? (
                    <>
                      <Scale className="h-4 w-4 mr-2 text-green-600" />
                      Automatic (Rate-based)
                    </>
                  ) : (
                    <>
                      <Coins className="h-4 w-4 mr-2 text-purple-600" />
                      One-time (Fixed Points)
                    </>
                  )}
                </p>
              </div>

              {promotion.type === "automatic" && (
                <>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Rate Multiplier
                    </h4>
                    <p className="text-md text-green-600 font-semibold">
                      {promotion.rate
                        ? `${promotion.rate}x points`
                        : "No rate specified"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Minimum Spending
                    </h4>
                    <p className="text-md flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                      {promotion.minSpending
                        ? `$${promotion.minSpending.toFixed(2)}`
                        : "No minimum"}
                    </p>
                  </div>
                </>
              )}

              {promotion.type === "one-time" && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Points Award
                  </h4>
                  <p className="text-md text-purple-600 font-semibold">
                    {promotion.points} points
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Promotion Schedule</h3>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <p
                  className={`text-md font-medium ${
                    status === "Active"
                      ? "text-green-600"
                      : status === "Scheduled"
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {status}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Valid Period
                </h4>
                <div className="space-y-2">
                  <p className="text-md flex items-center">
                    <CalendarRange className="h-4 w-4 mr-2 text-blue-600" />
                    {promotion.startTime
                      ? `From ${formatDateTime(
                          promotion.startTime
                        )} to ${formatDateTime(promotion.endTime)}`
                      : `Until ${formatDateTime(promotion.endTime)}`}
                  </p>

                  {/* Show time remaining if active */}
                  {status === "Active" && (
                    <p className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Expires in: {getTimeRemaining(promotion.endTime)}
                    </p>
                  )}
                </div>
              </div>

              {/* Additional relevant information could be added here */}
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button variant="outline" onClick={() => navigate("/promotions")}>
            Back to Promotions
          </Button>
        </CardFooter>
      </Card>

      {/* Edit Promotion Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <PromotionEditForm
            promotion={promotion}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Promotion Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Promotion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this promotion? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePromotion}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete Promotion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to calculate and format time remaining
function getTimeRemaining(endTimeStr: string): string {
  const endTime = new Date(endTimeStr);
  const now = new Date();

  const diffMs = endTime.getTime() - now.getTime();
  if (diffMs <= 0) return "Expired";

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} and ${diffHours} hour${
      diffHours !== 1 ? "s" : ""
    }`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${
      diffHours !== 1 ? "s" : ""
    } and ${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
  } else {
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
  }
}
