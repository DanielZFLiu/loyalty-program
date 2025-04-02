import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { processRedemptionTransaction } from '@/lib/api/transaction';

const CashierRedemptionsPage = () => {
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProcessRedemption = async () => {
    if (!transactionId) {
      return;
    }

    setLoading(true);
    try {
      await processRedemptionTransaction(Number(transactionId));
      setTransactionId('');
    } catch (error) {
      // todo: some kind of toast notification
      console.error('Failed to redeem transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Process Redemption</h1>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="transaction-id">Transaction ID</Label>
          <Input
            id="transaction-id"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Enter transaction ID"
            required
          />
        </div>

        <Button
          onClick={handleProcessRedemption}
          disabled={loading || !transactionId}
          className="w-full"
        >
          {loading ? 'Processing...' : 'Process Redemption'}
        </Button>
      </div>
    </div>
  );
};

export default CashierRedemptionsPage;
