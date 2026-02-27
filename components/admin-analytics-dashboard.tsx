"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Car, Calendar } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export type AnalyticsPayload = {
  date_from: string;
  date_to: string;
  months: number;
  totalRevenue: number;
  totalBookings: number;
  maintenanceCosts: number;
  netProfit: number;
  averageBookingValue: number;
  monthlyData: Array<{ month: string; bookings: number; revenue: number }>;
  mostRentedCars: Array<{ name: string; value: number }>;
  revenueByLocation: Array<{ name: string; value: number }>;
};

// --- Chart Configs ---
const revenueChartConfig: ChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
};

const bookingsChartConfig: ChartConfig = {
  bookings: {
    label: "Bookings",
    color: "hsl(var(--chart-2))",
  },
};

const locationChartConfig: ChartConfig = {
  value: {
    label: "Revenue",
    color: "hsl(var(--chart-3))",
  },
};

export function AdminAnalyticsDashboard({ analytics }: { analytics: AnalyticsPayload }) {
  // Prep pie chart data with fills
  const pieData = useMemo(() => {
    return analytics.mostRentedCars.map((item, i) => ({
      ...item,
      fill: COLORS[i % COLORS.length],
    }));
  }, [analytics.mostRentedCars]);

  const pieConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {
      value: { label: "Bookings" },
    };
    pieData.forEach((item) => {
      config[item.name] = {
        label: item.name,
        color: item.fill,
      };
    });
    return config;
  }, [pieData]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold">${analytics.netProfit.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{analytics.totalBookings}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-chart-2/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Booking Value</p>
                <p className="text-2xl font-bold">${analytics.averageBookingValue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-chart-4/10 flex items-center justify-center">
                <Car className="h-6 w-6 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Revenue trend for selected range</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={analytics.monthlyData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `$${value}`}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Monthly Bookings Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Bookings</CardTitle>
            <CardDescription>Number of paid bookings per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={bookingsChartConfig} className="h-[300px] w-full">
              <LineChart accessibilityLayer data={analytics.monthlyData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="var(--color-bookings)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Most Rented Cars */}
        <Card>
          <CardHeader>
            <CardTitle>Most Rented Cars</CardTitle>
            <CardDescription>Top 5 by paid bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieConfig} className="h-[300px] mx-auto aspect-square w-full pb-0 [&_.recharts-pie-label-text]:fill-foreground">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                  label
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue by Location */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Location</CardTitle>
            <CardDescription>Paid bookings by car location</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={locationChartConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={analytics.revenueByLocation} layout="vertical" margin={{ left: 12, right: 12 }}>
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `$${value}`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={90}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

