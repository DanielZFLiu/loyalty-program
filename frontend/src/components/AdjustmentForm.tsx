import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  createAdjustmentTransaction,
  type TransactionSummary,
} from "@/lib/api/transaction";

interface AdjustmentFormProps {
  transaction: TransactionSummary;
  onSuccess: (updatedTransaction: TransactionSummary) => void;
  onCancel: () => void;
}

export function AdjustmentForm({
  transaction,
  onSuccess,
  onCancel,
}: AdjustmentFormProps) {
  const [amount, setAmount] = useState<number>(0);
  const [remark, setRemark] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (amount === 0) {
      setError("Adjustment amount cannot be zero.");
      setLoading(false);
      return;
    }

    if (!transaction.utorid) {
      setError("Cannot create adjustment: User ID is missing.");
      setLoading(false);
      return;
    }

    try {
      // Create the adjustment transaction
      await createAdjustmentTransaction(
        transaction.utorid,
        amount,
        transaction.id,
        [], // No promotions for adjustments
        remark || `Adjustment for transaction #${transaction.id}`
      );

      // Create a fake transaction summary to pass back
      // In a real app, you might want to fetch the actual updated data
      const updatedTransaction: TransactionSummary = {
        ...transaction,
        // We don't change the transaction itself, just return it
      };

      onSuccess(updatedTransaction);
    } catch (error) {
      console.error("Error creating adjustment transaction:", error);
      setError("Failed to create adjustment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="original-amount">Original Transaction</Label>
        <Input
          id="original-amount"
          type="text"
          value={`${transaction.amount} points${
            transaction.spent ? ` ($${transaction.spent.toFixed(2)})` : ""
          }`}
          disabled
          className="bg-gray-50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="adjustment-amount">Adjustment Amount*</Label>
        <div className="flex items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-r-none px-2"
            onClick={() => setAmount((prev) => (prev <= 0 ? prev - 10 : -10))}
          >
            -10
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none px-2 border-l-0 border-r-0"
            onClick={() => setAmount((prev) => (prev <= 0 ? prev - 1 : -1))}
          >
            -1
          </Button>
          <Input
            id="adjustment-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="text-center rounded-none"
            required
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none px-2 border-l-0 border-r-0"
            onClick={() => setAmount((prev) => (prev >= 0 ? prev + 1 : 1))}
          >
            +1
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-l-none px-2"
            onClick={() => setAmount((prev) => (prev >= 0 ? prev + 10 : 10))}
          >
            +10
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          {amount > 0
            ? `Adding ${amount} points to user's account`
            : amount < 0
            ? `Removing ${Math.abs(amount)} points from user's account`
            : "Enter a non-zero amount"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="remark">Reason for Adjustment</Label>
        <Textarea
          id="remark"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Explain why this adjustment is being made"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading || amount === 0}>
          {loading ? "Creating..." : "Create Adjustment"}
        </Button>
      </div>
    </form>
  );
}
