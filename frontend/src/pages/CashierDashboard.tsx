import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const CashierDashboard = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Transaction</CardTitle>
            <CardDescription>
              Create new transactions for customers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/cashier/create-transaction">Create Transaction</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Process Redemption</CardTitle>
            <CardDescription>
              Process customer redemption requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/cashier/process-redemption">Process Redemption</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CashierDashboard;