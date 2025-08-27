"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const yearlyData = [
    { month: "Jan", revenue: 2000 },
    { month: "Feb", revenue: 2500 },
    { month: "Mar", revenue: 3200 },
    { month: "Apr", revenue: 2800 },
    { month: "May", revenue: 3500 },
    { month: "Jun", revenue: 4000 },
    { month: "Jul", revenue: 3700 },
    { month: "Aug", revenue: 4200 },
    { month: "Sep", revenue: 3900 },
    { month: "Oct", revenue: 4500 },
    { month: "Nov", revenue: 4800 },
    { month: "Dec", revenue: 5000 },
  ];

  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      {/* Cards --------------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Total Orders
          </h3>
          <p className="text-3xl font-bold text-orange-500">1,245</p>
          <p className="text-sm text-gray-500 mt-1">This month</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Revenue</h3>
          <p className="text-3xl font-bold text-green-600">$24,530</p>
          <p className="text-sm text-gray-500 mt-1">This month</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Active Restaurants
          </h3>
          <p className="text-3xl font-bold text-blue-500">57</p>
          <p className="text-sm text-gray-500 mt-1">Currently onboard</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Active Users
          </h3>
          <p className="text-3xl font-bold text-purple-500">3,890</p>
          <p className="text-sm text-gray-500 mt-1">Logged in last 30 days</p>
        </div>
      </div>

      {/* Chart ------------------------------------------------------------------------*/}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Yearly Revenue Overview
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#91BA84" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
