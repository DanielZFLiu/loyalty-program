import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRCodeSVG } from 'qrcode.react';
import { getMe } from '@/lib/api/userMe';
import { listTransactions } from '@/lib/api/userMe';
import type { Transaction } from '@/lib/api/userMe';
import {createTransferTransaction} from '@/lib/api/transaction';

interface UserProfile {
  id: number;
  utorid: string;
  name: string;
  points: number;
}

export function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [transferUserId, setTransferUserId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRemark, setTransferRemark] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  const [qrValue, setQrValue] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([fetchProfile(), fetchRecentTransactions()])
      .then(() => setLoading(false))
      .catch((err) => {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      });
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getMe();
      setProfile(data);

      // Create QR code value containing user ID and UserId
      const qrData = JSON.stringify({
        type: 'user',
        userId: data.id,
        utorid: data.utorid,
        timestamp: new Date().toISOString()
      });

      setQrValue(qrData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      navigate('/login');
      throw error;
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const data = await listTransactions({
        page: 1,
        limit: 5,
      });
      setRecentTransactions(data.results);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');

    try {
      // Validate recipient
      if (!transferUserId.trim()) {
        setTransferError('Please enter a User Id');
        return;
      }

      // Validate amount
      const amount = parseInt(transferAmount);
      if (isNaN(amount) || amount <= 0) {
        setTransferError('Please enter a valid amount greater than 0');
        return;
      }

      // Prevent transferring to yourself
      if (profile && Number(transferUserId) === profile.id) {
        setTransferError('You cannot transfer points to yourself');
        return;
      }

      const recipientId = Number(transferUserId);

      await createTransferTransaction(recipientId, amount, transferRemark || undefined);

      // Refresh profile to get updated points balance
      await fetchProfile();

      setTransferSuccess(`Successfully transferred ${amount} points`);
      setTransferUserId('');
      setTransferAmount('');
      setTransferRemark('');

      // Refresh transactions
      fetchRecentTransactions();

      // Auto-dismiss success message after a few seconds
      setTimeout(() => {
        setTransferSuccess('');
      }, 5000);
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : 'Failed to transfer points');
    }
  };

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

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-6">{error}</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Points Balance Card */}
      <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <CardContent className="pt-6 pb-6">
          <div className="text-center">
            <h2 className="text-xl font-medium mb-2">Your Points Balance</h2>
            <p className="text-5xl font-bold">{profile?.points || 0}</p>
          </div>
        </CardContent>
      </Card>

      {/* QR Code and Transfer Widget Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your QR Code</CardTitle>
            <CardDescription>Use this code for transfers and purchases</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="border-4 border-white p-4 rounded-lg shadow-md bg-white mb-4">
              <QRCodeSVG
                value={qrValue}
                size={180}
                level="H"
              />
            </div>
          </CardContent>
        </Card>

        {/* Transfer Points Card */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer Points</CardTitle>
            <CardDescription>Send points to another user</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipientUserId">Recipient User ID</Label>
                <Input
                  id="recipientUserId"
                  value={transferUserId}
                  onChange={(e) => setTransferUserId(e.target.value)}
                  placeholder="Enter UserId"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remark">Remark (optional)</Label>
                <Input
                  id="remark"
                  value={transferRemark}
                  onChange={(e) => setTransferRemark(e.target.value)}
                  placeholder="What's this transfer for?"
                />
              </div>
              {transferError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {transferError}
                </div>
              )}
              {transferSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-green-600 text-sm">
                  {transferSuccess}
                </div>
              )}
              <Button type="submit" className="w-full">Send Points</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Link to="/transactions">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type.charAt(0) + transaction.type.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {transaction.remark || `${transaction.type} transaction`}
                    </p>
                  </div>
                  <p className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent transactions</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/redeem">
              <Button className="w-full h-20 flex flex-col items-center justify-center" variant="outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
                  <path d="M12 8V2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <path d="m17 7-5 5" />
                  <path d="M14 7h3v3" />
                </svg>
                Redeem Points
              </Button>
            </Link>
            <Link to="/transactions">
              <Button className="w-full h-20 flex flex-col items-center justify-center" variant="outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                View All Transactions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}