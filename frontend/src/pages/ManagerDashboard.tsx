import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getMe } from "@/lib/api/userMe";
import { listTransactions, getTransaction } from "@/lib/api/transaction";
import { getPromotions } from "@/lib/api/promotion";
import { listEvents } from "@/lib/api/event";
import { listUsers } from "@/lib/api/user";
import {
  Users,
  User,
  CreditCard,
  Tag,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  Clock,
  Coins,
  CheckCircle,
  Eye,
  BarChart3,
} from "lucide-react";

interface ManagerProfile {
  id: number;
  utorid: string;
  name: string;
  role: string;
}

interface QuickStat {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  link: string;
}

// Transaction types with colors for summary
const transactionTypes = {
  purchase: {
    color: "bg-blue-100 text-blue-800",
    icon: <CreditCard className="h-4 w-4" />,
  },
  adjustment: {
    color: "bg-yellow-100 text-yellow-800",
    icon: <Coins className="h-4 w-4" />,
  },
  redemption: {
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  transfer: {
    color: "bg-purple-100 text-purple-800",
    icon: <User className="h-4 w-4" />,
  },
  event: {
    color: "bg-orange-100 text-orange-800",
    icon: <Calendar className="h-4 w-4" />,
  },
};

export function ManagerDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ManagerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activePromotions: 0,
    upcomingEvents: 0,
    suspiciousTransactions: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [transactionSummary, setTransactionSummary] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    Promise.all([
      fetchProfile(),
      fetchStats(),
      fetchRecentActivity(),
      fetchTransactionSummary(),
    ])
      .then(() => setLoading(false))
      .catch((err) => {
        console.error("Error loading dashboard data:", err);
        setLoading(false);
      });
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getMe();
      setProfile(data);
      setIsSuperuser(data.role.toLowerCase() === "superuser");
      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      navigate("/login");
      throw error;
    }
  };

  const fetchStats = async () => {
    try {
      // Get total users
      const usersResponse = await listUsers({ limit: 1 });

      // Get active promotions
      const promotionsResponse = await getPromotions({
        limit: 1,
        ended: false,
      });

      // Get upcoming events
      const eventsResponse = await listEvents({
        limit: 1,
        started: false,
      });

      // Get suspicious transactions
      const suspiciousResponse = await listTransactions({
        limit: 1,
        suspicious: true,
      });

      setStats({
        totalUsers: usersResponse.count,
        activePromotions: promotionsResponse.count,
        upcomingEvents: eventsResponse.count,
        suspiciousTransactions: suspiciousResponse.count,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      throw error;
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Get most recent transactions for activity feed
      const transactions = await listTransactions({
        limit: 5,
        page: 1,
      });

      // Format transactions as activity items
      const activityItems = await Promise.all(
        transactions.results.map(async (t) => {
          let description = "";
          switch (t.type.toLowerCase()) {
            case "purchase":
              description = `Purchase transaction of ${
                t.spent?.toFixed(2) || "0.00"
              } USD`;
              break;
            case "adjustment":
              if (t.relatedId) {
                try {
                  await getTransaction(t.relatedId);
                  description = `Adjustment of ${t.amount} points for transaction #${t.relatedId}`;
                } catch (e) {
                  description = `Adjustment of ${t.amount} points`;
                }
              } else {
                description = `Adjustment of ${t.amount} points`;
              }
              break;
            case "redemption":
              description = `Redemption of ${Math.abs(t.amount)} points`;
              break;
            case "transfer":
              description = `Transfer of ${Math.abs(t.amount)} points`;
              break;
            case "event":
              description = `Event transaction of ${Math.abs(t.amount)} points`;
              break;
            default:
              description = `${t.type} transaction created`;
          }

          return {
            id: t.id,
            type: t.type.toLowerCase(),
            description,
            amount: t.amount,
            suspicious: t.suspicious,
            createdBy: t.createdBy,
            timestamp: new Date().toISOString(), // Would come from transaction in a real app
          };
        })
      );

      setRecentActivity(activityItems);
    } catch (error) {
      console.error("Error fetching activity:", error);
      setRecentActivity([]);
    }
  };

  const fetchTransactionSummary = async () => {
    try {
      // Get transactions for summary stats - get a larger number to make the summary meaningful
      const transactions = await listTransactions({
        limit: 20,
        page: 1,
      });

      // Count transactions by type
      const summary: Record<string, number> = {};
      transactions.results.forEach((t) => {
        const type = t.type.toLowerCase();
        summary[type] = (summary[type] || 0) + 1;
      });

      setTransactionSummary(summary);
    } catch (error) {
      console.error("Error fetching transaction summary:", error);
    }
  };

  const getQuickStats = (): QuickStat[] => [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <Users className="h-5 w-5" />,
      color: "bg-blue-500",
      link: "/manager/users",
    },
    {
      title: "Active Promotions",
      value: stats.activePromotions,
      icon: <Tag className="h-5 w-5" />,
      color: "bg-purple-500",
      link: "/manager/promotions",
    },
    {
      title: "Upcoming Events",
      value: stats.upcomingEvents,
      icon: <Calendar className="h-5 w-5" />,
      color: "bg-green-500",
      link: "/manager/events",
    },
    {
      title: "Suspicious Transactions",
      value: stats.suspiciousTransactions,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "bg-orange-500",
      link: "/manager/transactions",
    },
  ];

  const getActivityIcon = (type: string, suspicious: boolean) => {
    if (suspicious)
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;

    switch (type.toLowerCase()) {
      case "purchase":
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case "adjustment":
        return <Coins className="h-4 w-4 text-yellow-500" />;
      case "redemption":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "transfer":
        return <User className="h-4 w-4 text-purple-500" />;
      case "event":
        return <Calendar className="h-4 w-4 text-indigo-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRecentActivityTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome, {profile?.name || "Manager"}
              </h1>
              <p className="text-indigo-100 mt-1">
                {isSuperuser ? "Superuser Dashboard" : "Manager Dashboard"} •{" "}
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {getQuickStats().map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <Link to={stat.link}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {stat.title}
                    </p>
                    <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg text-white`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* Main Section - Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Card - 1/3 width */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used management tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="flex justify-between items-center h-auto py-3"
                onClick={() => navigate("/manager/users")}
              >
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <Users className="h-5 w-5 text-blue-700" />
                  </div>
                  <span>Manage Users</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-blue-600" />
              </Button>

              <Button
                variant="outline"
                className="flex justify-between items-center h-auto py-3"
                onClick={() => navigate("/manager/transactions")}
              >
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                    <CreditCard className="h-5 w-5 text-green-700" />
                  </div>
                  <span>View Transactions</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              </Button>

              <Button
                variant="outline"
                className="flex justify-between items-center h-auto py-3"
                onClick={() => navigate("/manager/events")}
              >
                <div className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-lg mr-3">
                    <Calendar className="h-5 w-5 text-purple-700" />
                  </div>
                  <span>Event Dashboard</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-purple-600" />
              </Button>

              <Button
                variant="outline"
                className="flex justify-between items-center h-auto py-3"
                onClick={() => navigate("/manager/promotions")}
              >
                <div className="flex items-center">
                  <div className="bg-orange-100 p-2 rounded-lg mr-3">
                    <Tag className="h-5 w-5 text-orange-700" />
                  </div>
                  <span>Manage Promotions</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-orange-600" />
              </Button>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium text-gray-500 mb-3">
                Create New
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-1"
                  onClick={() => navigate("/manager/promotions")}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Promotion</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-1"
                  onClick={() => navigate("/manager/events")}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Event</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Card - 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Latest transaction activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Activity</TabsTrigger>
                <TabsTrigger value="suspicious">
                  Suspicious{" "}
                  <span className="ml-1 bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full text-xs">
                    {stats.suspiciousTransactions}
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-0 -mx-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className={`px-3 py-3 hover:bg-gray-50 border-b last:border-b-0 flex items-center justify-between ${
                        activity.suspicious ? "bg-orange-50/50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.type, activity.suspicious)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {activity.description}
                            </p>
                            {activity.suspicious && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                                Suspicious
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            By {activity.createdBy || "System"} •{" "}
                            <Clock className="inline h-3 w-3" />{" "}
                            {getRecentActivityTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`/manager/transactions/${activity.id}`)
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recent activity found
                  </div>
                )}
              </TabsContent>

              <TabsContent value="suspicious">
                {recentActivity.filter((a) => a.suspicious).length > 0 ? (
                  recentActivity
                    .filter((a) => a.suspicious)
                    .map((activity, index) => (
                      <div
                        key={index}
                        className="px-3 py-3 bg-orange-50/50 hover:bg-orange-50 border-b last:border-b-0 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {activity.description}
                              <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                                Suspicious
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              By {activity.createdBy || "System"} •{" "}
                              <Clock className="inline h-3 w-3" />{" "}
                              {getRecentActivityTime(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/manager/transactions/${activity.id}`)
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No suspicious activities found
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid - Transaction Summary and System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transaction Summary Card - Left side */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <div>
                <CardTitle>Transaction Summary</CardTitle>
                <CardDescription>
                  Summary of recent transactions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.keys(transactionSummary).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(transactionSummary).map(([type, count]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div
                          className={`p-2 rounded-full mr-3 ${
                            transactionTypes[
                              type as keyof typeof transactionTypes
                            ]?.color || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {transactionTypes[
                            type as keyof typeof transactionTypes
                          ]?.icon || <CreditCard className="h-4 w-4" />}
                        </div>
                        <span className="capitalize">{type}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No transaction data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Status Card - Right side */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current platform health</CardDescription>
              </div>
            </div>
          </CardHeader>
          {/* probably shouldnt hard code this lol */}
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">User Services</span>
                  </div>
                  <div className="mt-2 flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-700">Online</span>
                  </div>
                </div>

                <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Transactions</span>
                  </div>
                  <div className="mt-2 flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-700">Online</span>
                  </div>
                </div>

                <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Events</span>
                  </div>
                  <div className="mt-2 flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-700">Online</span>
                  </div>
                </div>

                <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Promotions</span>
                  </div>
                  <div className="mt-2 flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-700">Online</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500">
                Last checked: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
