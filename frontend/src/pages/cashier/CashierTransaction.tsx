import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Promotion, getPromotions } from '@/lib/api/promotion';
import { createPurchaseTransaction } from '@/lib/api/transaction';
export default function CashierCreateTransaction() {
  const [utorid, setUtorid] = useState('');
  const [spent, setSpent] = useState('');
  const [remark, setRemark] = useState('');
  const [selectedPromotions, setSelectedPromotions] = useState<Promotion[]>([]);
  const promotionIds = selectedPromotions.map(promo => promo.id);
  const [loading, setLoading] = useState(false);

  const [autoPromotions, setAutoPromotions] = useState<Promotion[]>([]);
  const [oneTimePromotions, setOneTimePromotions] = useState<Promotion[]>([]);
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(true);

  const [autoPromotionPage, setAutoPromotionPage] = useState(1);
  const [totalAutoPromotions, setTotalAutoPromotions] = useState(0);
  const [oneTimePromotionPage, setOneTimePromotionPage] = useState(1);
  const [totalOneTimePromotions, setTotalOneTimePromotions] = useState(0);

  useEffect(() => {
    fetchPromotions();
  }, [autoPromotionPage, oneTimePromotionPage]);

  const fetchPromotions = async () => {
    setIsLoadingPromotions(true);
    try {
      const autoResponse = await getPromotions({
        page: autoPromotionPage,
        limit: 10,
        type: 'automatic',
      });
      const oneTimeResponse = await getPromotions({
        page: oneTimePromotionPage,
        limit: 10,
        type: 'one-time',
      });

      setAutoPromotions(autoResponse.results);
      setOneTimePromotions(oneTimeResponse.results);
      setTotalAutoPromotions(autoResponse.count);
      setTotalOneTimePromotions(oneTimeResponse.count);
    } catch (error) {
      console.error('Failed to fetch promotions', error);
    } finally {
      setIsLoadingPromotions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const invalidPromotions = selectedPromotions.filter(promo => 
        promo.minSpending && Number(spent) < promo.minSpending
      );
      if (invalidPromotions.length > 0) {
        // todo: some kind of toast notification
        return;
      }
      await createPurchaseTransaction(utorid, Number(spent), promotionIds, remark);
    } catch (error) {
      console.error('Failed to create transaction', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Transaction</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="utorid">UtorID</Label>
          <Input
            id="utorid"
            value={utorid}
            onChange={(e) => setUtorid(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="spent">Amount Spent</Label>
          <Input
            id="spent"
            type="number"
            value={spent}
            onChange={(e) => setSpent(e.target.value)}
            required
          />
        </div>
        {isLoadingPromotions ? (
          <p className="text-gray-600">Loading promotions...</p>
        ) : (
          <>
            {autoPromotions?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold">Automatic Promotions</h3>
                <p className="text-sm text-gray-500 mb-2">
                  These promotions are automatically applied to the transaction.
                </p>
                <div className="space-y-2 border rounded-md p-3 bg-gray-50">
                  {autoPromotions.map((promo) => (
                    <div key={promo.id} className="flex items-center">
                      <div>
                        <p className="font-medium text-gray-800">{promo.name}</p>
                        {promo.rate !== undefined && promo.rate !== null && promo.rate > 0 && (
                          <p className="text-sm text-gray-600">
                            {promo.rate}x points
                          </p>
                        )}
                        {promo.points !== undefined && promo.points !== null && promo.points > 0 && (
                          <p className="text-sm text-gray-600">
                            {promo.points} bonus points
                          </p>
                        )}
                        {promo.minSpending !== undefined && promo.minSpending !== null && promo.minSpending > 0 && (
                          <p className="text-sm text-gray-600">
                            Min spending: ${promo.minSpending.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setAutoPromotionPage((prev) => Math.max(1, prev - 1))}
                    disabled={autoPromotionPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {autoPromotionPage} of {Math.ceil(totalAutoPromotions / 10)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setAutoPromotionPage((prev) => prev + 1)}
                    disabled={autoPromotionPage * 10 >= totalAutoPromotions}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
            {oneTimePromotions?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold">One-Time Promotions</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Select one-time promotions for this transaction. These
                  can only be used once per customer.
                </p>
                <div className="space-y-2 border rounded-md p-3 bg-gray-50">
                  {oneTimePromotions.map((promo) => (
                    <div key={promo.id} className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-800">{promo.name}</p>
                        {promo.rate !== undefined && promo.rate !== null && promo.rate > 0 && (
                          <p className="text-sm text-gray-600">
                            {promo.rate}x points
                          </p>
                        )}
                        {promo.points !== undefined && promo.points !== null && promo.points > 0 && (
                          <p className="text-sm text-gray-600">
                            {promo.points} bonus points
                          </p>
                        )}
                        {promo.minSpending !== undefined && promo.minSpending !== null && promo.minSpending > 0 && (
                          <p className="text-sm text-gray-600">
                            Min spending: ${promo.minSpending.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <Checkbox
                        id={promo.id.toString()}
                        className="h-6 w-6"
                        checked={promotionIds.includes(promo.id)}
                        onCheckedChange={(checked) =>
                          setSelectedPromotions((prev) =>
                            checked
                              ? [...prev, promo]
                              : prev.filter((p) => p.id !== promo.id)
                          )
                        }
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setOneTimePromotionPage((prev) => Math.max(1, prev - 1))}
                    disabled={oneTimePromotionPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {oneTimePromotionPage} of {Math.ceil(totalOneTimePromotions / 10)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setOneTimePromotionPage((prev) => prev + 1)}
                    disabled={oneTimePromotionPage * 10 >= totalOneTimePromotions}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        <div className="space-y-2">
          <Label htmlFor="remark">Remark</Label>
          <Input
            id="remark"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>
        <Button type="submit">Create Purchase</Button>
      </form>
    </div>
  );
}
