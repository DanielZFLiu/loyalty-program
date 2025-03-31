import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { TransactionFilters } from "../components/TransactionFilters";
import { useNavigate } from "react-router-dom";
import { listTransactions, type ListTransactionsOptions, type Transaction } from "@/lib/api/userMe";


export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<{
    typeFilter?: string;
    relatedId?: number;
    promotionId?: number;
    amount?: number;
    operator?: "gte" | "lte";
  }>({
    typeFilter: "all",
    operator: "gte",
  });
  const navigate = useNavigate();

  const fetchTransactions = async () => {
    try {
      const params: ListTransactionsOptions = {
        page,
        limit: 10,
      };

      if (filters.typeFilter && filters.typeFilter !== "all") {
        params.type = filters.typeFilter;
      }
      if (filters.relatedId !== undefined) {
        params.relatedId = filters.relatedId;
      }
      if (filters.promotionId !== undefined) {
        params.promotionId = filters.promotionId;
      }
      if (filters.amount !== undefined && filters.operator) {
        params.amount = filters.amount;
      }
      if (filters.operator) {
        params.operator = filters.operator;
      }
      
      const data = await listTransactions(params);
      setTransactions(data.results);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (error) {
      console.error("Error fetching transactions:", error);
      navigate("/login");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, filters, navigate]);

  const getTransactionColor = (type: Transaction["type"]) => {
    switch (type) {
      case "PURCHASE":
        return "bg-blue-100 text-blue-800";
      case "ADJUSTMENT":
        return "bg-yellow-100 text-yellow-800";
      case "REDEMPTION":
        return "bg-green-100 text-green-800";
      case "TRANSFER":
        return "bg-purple-100 text-purple-800";
      case "EVENT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionFilters onFilterChange={setFilters} />

          <div className="space-y-4">
            {transactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getTransactionColor(
                          transaction.type.toUpperCase() as Transaction["type"]
                        )}`}
                      >
                        {transaction.type.charAt(0).toUpperCase() +
                          transaction.type.slice(1).toLowerCase()}
                      </span>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          Amount spent: $
                          {transaction.spent?.toFixed(2) || "0.00"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Points accumulated: {transaction.amount} points
                        </p>
                        <p className="text-sm text-gray-600">
                          Remark: {transaction.remark || "No remark"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Created By: {transaction.createdBy || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-semibold ${
                          transaction.amount >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.amount >= 0 ? "+" : ""}
                        {transaction.amount} points
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
