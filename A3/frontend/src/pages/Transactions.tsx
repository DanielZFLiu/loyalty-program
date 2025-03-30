import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { TransactionFilters } from '../components/TransactionFilters';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: number;
  type: 'PURCHASE' | 'ADJUSTMENT' | 'REDEMPTION' | 'TRANSFER' | 'EVENT';
  amount: number;
  spent?: number;
  remark?: string;
  createdAt: string;
  createdBy: string;
}

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    typeFilter: 'all',
    relatedId: undefined,
    promotionId: undefined,
    amount: undefined,
    operator: 'gte',
  });
  const navigate = useNavigate();

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const params: URLSearchParams = new URLSearchParams({
        page: String(page),
        limit: String(10),
      });

      if (filters.typeFilter && filters.typeFilter !== 'all') {
        params.append('type', filters.typeFilter);
      }
      if (filters.relatedId !== undefined) {
        params.append('relatedId', String(filters.relatedId));
      }
      if (filters.promotionId !== undefined) {
        params.append('promotionId', String(filters.promotionId));
      }
      if (filters.amount !== undefined && filters.operator) {
        params.append('amount', String(filters.amount));
      }
      if (filters.operator) {
        params.append('operator', filters.operator);
      }

      const response = await fetch(
        `http://localhost:3000/users/me/transactions?${params.toString()}`,
        {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('data', response);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      setTransactions(data.results);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      navigate('/login');
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, filters, navigate]);

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'PURCHASE':
        return 'bg-blue-100 text-blue-800';
      case 'ADJUSTMENT':
        return 'bg-yellow-100 text-yellow-800';
      case 'REDEMPTION':
        return 'bg-green-100 text-green-800';
      case 'TRANSFER':
        return 'bg-purple-100 text-purple-800';
      case 'EVENT':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
                        transaction.type.toUpperCase() as Transaction['type']
                      )}`}
                    >
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1).toLowerCase()}
                    </span>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        Amount spent: ${transaction.spent?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Points accumulated: {transaction.amount} points
                      </p>
                      <p className="text-sm text-gray-600">
                        Remark: {transaction.remark || 'No remark'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Created By: {transaction.createdBy || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${
                        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.amount >= 0 ? '+' : ''}
                      {transaction.amount} points
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
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