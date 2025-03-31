import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '@/lib/api/userMe';
import { createTransferTransaction } from '@/lib/api/transaction';

interface UserData {
  points: number;
  id: number;
  utorid: string;
}

export function Points() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const navigate = useNavigate();

  const [transferUserId, setTransferUserId] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<number | ''>('');
  const [transferRemark, setTransferRemark] = useState<string>('');
  const [transferSuccess, setTransferSuccess] = useState<boolean | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user data
    const fetchUserData = async () => {
      try {
        const response = await getMe();
        setUserData(response);
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  if (!userData) {
    return <div>Loading...</div>;
  }

  // Create QR code data
  const qrData = JSON.stringify({
    type: 'user',
    userId: userData.id,
    utorid: userData.utorid,
  });

  const handleTransferPoints = async () => {
    // Convert transferAmount to a number for validation
    const amount = Number(transferAmount);

    // Validate transfer amount
    if (amount <= 0) {
      console.error('Transfer amount must be greater than 0');
      setTransferSuccess(false);
      return; // Exit the function if the amount is invalid
    }

    // Validate that the user is not transferring points to themselves
    if (transferUserId === userData.id.toString()) {
      console.error('You cannot transfer points to yourself');
      setSuccessMessage('You cannot transfer points to yourself'); // Set error message
      setTransferSuccess(false);
      return; // Exit the function if the user is trying to transfer to themselves
    }

    try {
      await createTransferTransaction(Number(transferUserId), amount, transferRemark);

      setTransferSuccess(true);
      setSuccessMessage('Points transferred successfully!'); // Set success message
      setTransferUserId('');
      setTransferAmount('');
      setTransferRemark('');

      // Show success message for a short duration before reloading
      setTimeout(() => {
        window.location.reload();
      }, 2000); // Adjust the duration as needed
    } catch (error) {
      console.error('Error transferring points:', error);
      setTransferSuccess(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{userData.points}</div>
            <p className="text-muted-foreground">Available points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <QRCodeSVG value={qrData} size={200} />
              <p className="text-sm text-muted-foreground">
                Show this QR code to initiate transactions
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  // Download QR code as PNG
                  const canvas = document.querySelector('canvas');
                  if (canvas) {
                    const pngUrl = canvas.toDataURL('image/png');
                    const downloadLink = document.createElement('a');
                    downloadLink.download = 'my-qr-code.png';
                    downloadLink.href = pngUrl;
                    downloadLink.click();
                  }
                }}
              >
                Download QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transfer Points</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            value={transferUserId}
            onChange={(e) => setTransferUserId(e.target.value)}
            placeholder="Enter User ID"
            className="border p-2 rounded w-full mb-2"
          />
          <input
            type="number"
            value={transferAmount}
            onChange={(e) => setTransferAmount(Number(e.target.value))}
            placeholder="Enter Amount"
            className="border p-2 rounded w-full mb-2"
          />
          <input
            type="text"
            value={transferRemark}
            onChange={(e) => setTransferRemark(e.target.value)}
            placeholder="Enter Remark (optional)"
            className="border p-2 rounded w-full mb-2"
          />
          <Button onClick={handleTransferPoints} className="w-full">
            Transfer Points
          </Button>
          {transferSuccess === true && <p className="text-green-500 mt-2">{successMessage}</p>}
          {transferSuccess === false && <p className="text-red-500 mt-2">Failed to transfer points.</p>}
        </CardContent>
      </Card>
    </div>
  );
} 