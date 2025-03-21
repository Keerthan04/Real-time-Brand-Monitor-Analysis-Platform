// import * as React from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

type chartData={
  date: string,
  positive: number,
  negative: number,
  neutral: number
}
const chartConfig = {
  positive: {
    label: "Positive",
    color: "green",
    // or just "green"
  },
  negative: {
    label: "Negative",
    color: "red",
    // or just "red"
  },
  neutral: {
    label: "Neutral",
    color: "gray",
    // or just "gray"
  },
} satisfies ChartConfig;

export function SentimentChart({data,title}: {data: chartData[],title: string}) {
  // const [timeRange, setTimeRange] = React.useState("90d");

  const filteredData = data;

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Area chart showing Positive, Neutral, Negative
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full min-w-[300px]"
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredData}>
              {/* Gradients for each sentiment */}
              <defs>
                <linearGradient id="fillPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="green" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="green" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="red" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="red" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillNeutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="gray" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="gray" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickFormatter={(value) => value.toLocaleString()} // formats numbers nicely
                domain={[0, "dataMax + 10"]} // adjusts domain dynamically
                label={{
                  value: "Sentiment Count",
                  angle: -90,
                  position: "insideLeft",
                }}
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `Time: ${value}`}
                    indicator="dot"
                  />
                }
              />

              {/* Stack all three sentiment categories */}
              <Area
                dataKey="positive"
                type="linear"
                fill={`url(#fillPositive)`}
                stroke={chartConfig.positive.color}
                // stackId="a"
              />
              <Area
                dataKey="neutral"
                type="linear"
                fill={`url(#fillNeutral)`}
                stroke={chartConfig.neutral.color}
                // stackId="a"
              />
              <Area
                dataKey="negative"
                type="linear"
                fill={`url(#fillNegative)`}
                stroke={chartConfig.negative.color}
                // stackId="a"
              />

              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
