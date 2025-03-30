import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { QRCodeSVG } from 'qrcode.react';

interface UserData {
  points: number;
  id: number;
  utorid: string;
  isVerified?: boolean;
}

interface RedemptionTransaction {
  id: number;
  utorid: string;
  type: string;
  processedBy: string | null;
  amount: number;
  remark: string;
  createdBy: string;
}

export function RedemptionPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [amount, setAmount] = useState<number | ''>('');
  const [remark, setRemark] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redemptionData, setRedemptionData] = useState<RedemptionTransaction | null>(null);
  const navigate = useNavigate();

  // Fetch user's data including available points
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/users/me', {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        setUserData(data);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('Failed to load your points. Please try again later.');
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  // Fetch unprocessed redemption transactions
  useEffect(() => {
    const fetchUnprocessedRedemptions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/users/me/transactions?type=redemption&page=1&limit=10', {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        
        // Find the most recent unprocessed redemption request
        const unprocessedRedemption = data.results.find(
          (transaction: RedemptionTransaction) => 
            transaction.type === 'redemption' && 
            transaction.processedBy === null
        );
        
        if (unprocessedRedemption) {
          setRedemptionData(unprocessedRedemption);
        }
      } catch (err) {
        console.error('Failed to fetch unprocessed redemptions:', err);
      }
    };

    if (userData) {
      fetchUnprocessedRedemptions();
    }
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate input
    const pointAmount = Number(amount);
    if (isNaN(pointAmount) || pointAmount <= 0) {
      setError('Please enter a valid positive number of points to redeem');
      return;
    }

    if (userData && pointAmount > userData.points) {
      setError('You cannot redeem more points than you have available');
      return;
    }

    if (userData && userData.isVerified === false) {
      setError('Your account must be verified to redeem points');
      return;
    }

    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/users/me/transactions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'redemption',
          amount: pointAmount,
          remark: remark.trim()
        }),
      });
      
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Redemption failed: You do not have enough points');
        } else if (response.status === 403) {
          throw new Error('Redemption failed: Your account must be verified');
        } else {
          throw new Error('Failed to process your redemption request');
        }
      }
      
      const data = await response.json();
      
      // Set the redemption data with the new transaction
      setRedemptionData(data);
      
      // Reset form
      setAmount('');
      setRemark('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to process your redemption request. Please try again later.');
      } else {
        setError('Failed to process your redemption request. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Redeem Points</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Available Points</CardTitle>
          <CardDescription>Your current points balance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{userData.points.toLocaleString()}</p>
        </CardContent>
      </Card>

      {redemptionData ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pending Redemption Request</CardTitle>
            <CardDescription>Show this QR code to a cashier to process your redemption</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg mb-4">
              <QRCodeSVG 
                value={JSON.stringify({
                  id: redemptionData.id,
                  type: 'redemption',
                  amount: redemptionData.amount
                })} 
                size={200}
              />
            </div>
            <div className="text-center mb-4">
              <p className="font-medium">Redemption ID: {redemptionData.id}</p>
              <p className="text-lg font-bold">Amount: {redemptionData.amount.toLocaleString()} points</p>
              {redemptionData.remark && <p>Remark: {redemptionData.remark}</p>}
            </div>
            <Button 
              onClick={() => setRedemptionData(null)}
              variant="outline"
            >
              Create New Redemption
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Redeem Points</CardTitle>
            <CardDescription>Create a new redemption request</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="amount">Redemption Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  max={userData.points}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Enter amount of points to redeem"
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="remark">Remark (Optional)</Label>
                <textarea
                  id="remark"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Add a note about this redemption"
                  className="border p-2 rounded w-full"
                  rows={3}
                />
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                disabled={isLoading || (userData.isVerified === false)}
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Submit Redemption Request'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}