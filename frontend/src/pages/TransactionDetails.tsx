// TransactionDetails.tsx
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
import { Badge } from "@/components/ui/badge";
import {
  getTransaction,
  updateTransactionSuspicious,
  type TransactionSummary,
} from "@/lib/api/transaction";
import { checkRole } from "@/lib/api/util";
import {
  AlertTriangle,
  CreditCard,
  User,
  FileText,
  Tag,
  Link as LinkIcon,
} from "lucide-react";
import { AdjustmentForm } from "@/components/manageTransactions/AdjustmentForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function TransactionDetails() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<TransactionSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [suspiciousUpdateLoading, setSuspiciousUpdateLoading] = useState(false);

  useEffect(() => {
    const checkManagerStatus = async () => {
      const isManagerOrAbove = await checkRole("manager");
      setIsManager(isManagerOrAbove);

      if (!isManagerOrAbove) {
        setLoading(false);
        setError("You don't have permission to view transaction details.");
      }
      return isManagerOrAbove;
    };

    const fetchTransactionDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if user is manager
        const hasAccess = await checkManagerStatus();
        if (!hasAccess) return;

        // Fetch transaction details
        const response = await getTransaction(Number(transactionId));
        setTransaction(response);
      } catch (error) {
        console.error("Error fetching transaction details:", error);
        setError("Failed to load transaction details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [transactionId, navigate]);

  const handleToggleSuspicious = async () => {
    if (!transaction) return;

    setSuspiciousUpdateLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      const updatedTransaction = await updateTransactionSuspicious(
        transaction.id,
        !transaction.suspicious
      );

      setTransaction(updatedTransaction);
      setStatusMessage(
        updatedTransaction.suspicious
          ? "Transaction marked as suspicious"
          : "Transaction marked as not suspicious"
      );
    } catch (error) {
      console.error("Error updating transaction suspicious status:", error);
      setError("Failed to update transaction status. Please try again.");
    } finally {
      setSuspiciousUpdateLoading(false);
    }
  };

  const handleAdjustmentSuccess = (updatedTransaction: TransactionSummary) => {
    setAdjustmentDialogOpen(false);
    setStatusMessage("Adjustment transaction created successfully!");
    // Refresh the transaction data
    setTransaction(updatedTransaction);
  };

  const getTransactionColor = (type?: string) => {
    if (!type) return "bg-gray-400 text-gray-800";

    switch (type.toUpperCase()) {
      case "PURCHASE":
        return "bg-blue-400 text-blue-800";
      case "ADJUSTMENT":
        return "bg-yellow-400 text-yellow-800";
      case "REDEMPTION":
        return "bg-green-400 text-green-800";
      case "TRANSFER":
        return "bg-purple-400 text-purple-800";
      case "EVENT":
        return "bg-orange-400 text-orange-800";
      default:
        return "bg-gray-400 text-gray-800";
    }
  };

  const formatType = (type?: string) => {
    if (!type) return "Unknown";
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-6">
          <p>Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="bg-red-400 text-red-800 p-4 rounded-md">
              {error || "Transaction not found"}
            </div>
            <Button className="mt-4" onClick={() => navigate("/transactions")}>
              Back to Transactions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl">Transaction Details</CardTitle>
              <Badge
                classes={getTransactionColor(transaction.type)}
                text={formatType(transaction.type)}
              ></Badge>
              {transaction.suspicious && (
                <Badge
                  classes="bg-red-400 text-red-800"
                  text="Suspicious"
                  innerChild={<AlertTriangle className="h-3.5 w-3.5 mr-1" />}
                ></Badge>
              )}
            </div>

            {isManager && (
              <div className="flex gap-2">
                <Button
                  variant={transaction.suspicious ? "outline" : "destructive"}
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={handleToggleSuspicious}
                  disabled={suspiciousUpdateLoading}
                >
                  <AlertTriangle className="h-4 w-4" />
                  {transaction.suspicious
                    ? "Mark Not Suspicious"
                    : "Mark Suspicious"}
                </Button>
                {(transaction.type !== "adjustment" &&
                  transaction.type !== "ADJUSTMENT") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => setAdjustmentDialogOpen(true)}
                  >
                    <CreditCard className="h-4 w-4" />
                    Create Adjustment
                  </Button>
                )}
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
              <h3 className="text-lg font-semibold">Transaction Information</h3>

              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Transaction ID
                </h4>
                <p className="text-md">{transaction.id}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Amount</h4>
                <p
                  className={`text-lg font-semibold ${
                    transaction.type.toUpperCase() === 'REDEMPTION' ? 
                      "text-red-600" : 
                      (transaction.amount >= 0 ? "text-green-600" : "text-red-600")
                  }`}
                >
                  {transaction.type.toUpperCase() === 'REDEMPTION' 
                    ? "-" + Math.abs(transaction.amount)
                    : (transaction.amount >= 0 ? "+" + transaction.amount : transaction.amount)
                  } points
                </p>
              </div>

              {transaction.spent !== undefined && transaction.type.toUpperCase() !== 'REDEMPTION' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Spent</h4>
                  <p className="text-md">${transaction.spent?.toFixed(2)}</p>
                </div>
              )}
              
              {transaction.type.toUpperCase() === 'REDEMPTION' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <p className="text-md">
                    {transaction.processedBy ? (
                      <span className="text-green-600 font-medium">Processed by {transaction.processedBy}</span>
                    ) : (
                      <span className="text-amber-600 font-medium">Pending</span>
                    )}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-500">User</h4>
                <p className="text-md flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-500" />
                  {transaction.utorid || "N/A"}
                </p>
              </div>

              {transaction.createdBy && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Created By
                  </h4>
                  <p className="text-md">{transaction.createdBy}</p>
                </div>
              )}

              {transaction.relatedId !== undefined && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Related Transaction
                  </h4>
                  <p className="text-md flex items-center">
                    <LinkIcon className="h-4 w-4 mr-2 text-blue-500" />
                    {transaction.relatedId && (
                      <Button
                        variant="link"
                        className="p-0 h-auto text-blue-600"
                        onClick={() =>
                          navigate(`/transactions/${transaction.relatedId}`)
                        }
                      >
                        #{transaction.relatedId}
                      </Button>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Details</h3>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <p className="text-md">
                  {transaction.suspicious ? (
                    <span className="text-red-600 font-medium">
                      Flagged as Suspicious
                    </span>
                  ) : (
                    <span className="text-green-600 font-medium">Normal</span>
                  )}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Remarks</h4>
                <p className="text-md whitespace-pre-wrap bg-gray-50 p-3 rounded-md min-h-10">
                  <FileText className="h-4 w-4 mr-2 text-blue-500 inline-block" />
                  {transaction.remark || "No remarks"}
                </p>
              </div>

              {transaction.promotionIds &&
                transaction.promotionIds.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Applied Promotions
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {transaction.promotionIds.map((id) => (
                        <Badge
                          key={id}
                          classes="bg-purple-400 text-purple-800"
                          innerChild={<Tag className="h-3 w-3 mr-1" />}
                          text={`Promotion #${id}`}
                        ></Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button variant="outline" onClick={() => navigate("/transactions")}>
            Back to Transactions
          </Button>
        </CardFooter>
      </Card>

      {/* Adjustment Dialog */}
      <Dialog
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Adjustment Transaction</DialogTitle>
            <DialogDescription>
              Create an adjustment for transaction #{transaction.id}
            </DialogDescription>
          </DialogHeader>

          <AdjustmentForm
            transaction={transaction}
            onSuccess={handleAdjustmentSuccess}
            onCancel={() => setAdjustmentDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
