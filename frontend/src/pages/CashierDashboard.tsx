import { Link } from "react-router-dom";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { useState, useEffect } from "react";
import { getMe } from "@/lib/api/userMe";
import { CreditCard, Gift, ArrowRight } from "lucide-react";

interface CashierProfile {
  id: number;
  utorid: string;
  name: string;
  role: string;
}

const CashierDashboard = () => {
  const [profile, setProfile] = useState<CashierProfile | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Fetch cashier profile
    const fetchProfile = async () => {
      try {
        const data = await getMe();
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Cashier Header Card */}
      <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                {getGreeting()}, {profile?.name || "Cashier"}
              </h1>
              <p className="text-blue-100 mt-1">Cashier Dashboard</p>
            </div>
            <div className="mt-4 md:mt-0 text-right">
              <p className="text-2xl font-medium">{formatTime(currentTime)}</p>
              <p className="text-blue-100">{formatDate(currentTime)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        {/* Transaction Card */}
        <Link to="/cashier/create-transaction" className="group block">
          <Card className="h-full transition-all duration-300 hover:shadow-md overflow-hidden group-hover:border-blue-300">
            <div className="h-full flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-full bg-blue-100 p-3">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      Create Transaction
                    </h3>
                    <p className="text-gray-500">
                      Process purchases and apply promotions
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 pl-2">
                  <p>• Record customer purchases</p>
                  <p>• Apply automatic and one-time promotions</p>
                  <p>• Award points based on spending</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 flex justify-end">
                <span className="inline-flex items-center gap-2 text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                  Create Transaction
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Card>
        </Link>

        {/* Redemption Card */}
        <Link to="/cashier/process-redemption" className="group block">
          <Card className="h-full transition-all duration-300 hover:shadow-md overflow-hidden group-hover:border-purple-300">
            <div className="h-full flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-full bg-purple-100 p-3">
                    <Gift className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      Process Redemption
                    </h3>
                    <p className="text-gray-500">
                      Complete point redemption requests
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 pl-2">
                  <p>• Verify redemption transaction IDs</p>
                  <p>• Process customer reward redemptions</p>
                  <p>• Mark redemptions as completed</p>
                </div>
              </div>

              <div className="bg-purple-50 p-4 flex justify-end">
                <span className="inline-flex items-center gap-2 text-purple-600 font-medium group-hover:text-purple-700 transition-colors">
                  Process Redemption
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default CashierDashboard;
