// Transactions.tsx (Updated)
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionFilters } from "@/components/filters/TransactionFilters";
import { useNavigate } from "react-router-dom";
import { checkRole } from "@/lib/api/util";
import {
  listTransactions as listMyTransactions,
  type Transaction,
} from "@/lib/api/userMe";
import {
  listTransactions,
  type ListTransactionsOptions,
} from "@/lib/api/transaction";
import { ChevronRight, AlertTriangle } from "lucide-react";

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isManager, setIsManager] = useState(false);
  const [filters, setFilters] = useState<{
    name?: string;
    createdBy?: string;
    suspicious?: boolean;
    typeFilter?: string;
    relatedId?: number;
    promotionId?: number;
    amount?: number;
    operator?: "gte" | "lte";
  }>({
    typeFilter: "all",
    operator: "gte",
  });
  const [filterMode, setFilterMode] = useState<"partial" | "all">("partial");
  const navigate = useNavigate();

  const fetchTransactions = async () => {
    try {
      // check if user is manager or above
      const showAll = await checkRole("manager");
      setIsManager(showAll);
      if (showAll) setFilterMode("all");
      else setFilterMode("partial");

      // start building the filter parameters
      const params: ListTransactionsOptions = {
        page,
        limit: 10,
      };

      // filters for both manager/superuser and user/cashier groups
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

      // filters for manager/superuser
      if (showAll && filters.name) {
        params.name = filters.name;
      }
      if (showAll && filters.createdBy) {
        params.createdBy = filters.createdBy;
      }
      if (showAll && filters.suspicious) {
        params.suspicious = filters.suspicious;
      }

      console.log(params);

      let data;
      if (!showAll) {
        // fetch transactions for user/cashier group
        data = await listMyTransactions(params);
      } else {
        // fetch transactions for manager/superuser group
        data = await listTransactions(params);
      }
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

  const handleTransactionClick = (transactionId: number) => {
    // Only managers can access transaction details
    if (isManager) {
      navigate(`${window.location.pathname}/${transactionId}`);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionFilters
            onFilterChange={setFilters}
            filterMode={filterMode}
          />

          <div className="space-y-4">
            {transactions.map((transaction) => (
              <Card
                key={transaction.id}
                className={`hover:shadow-md transition-shadow ${
                  isManager ? "cursor-pointer group" : ""
                }`}
                onClick={() => handleTransactionClick(transaction.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getTransactionColor(
                            transaction.type.toUpperCase() as Transaction["type"]
                          )}`}
                        >
                          {transaction.type.charAt(0).toUpperCase() +
                            transaction.type.slice(1).toLowerCase()}
                        </span>
                      </div>
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
                    <div className="flex items-center">
                      <div className="text-right mr-3">
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
                        <p className="text-xs text-gray-500">
                          Transaction #{transaction.id}
                        </p>
                      </div>
                      {isManager && (
                        <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
                      )}
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
            <span className="flex items-center px-4">
              Page {page} of {totalPages}
            </span>
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
