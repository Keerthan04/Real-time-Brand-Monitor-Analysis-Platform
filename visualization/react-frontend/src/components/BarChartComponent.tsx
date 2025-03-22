import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type BarChartData = {
    sentiment: "positive" | "negative" | "neutral";
    apple: number;
    samsung: number;
};
// const chartData: BarChartData[] = [
//   { sentiment: "positive", apple: 100, samsung: 80 },
//   { sentiment: "negative", apple: 80, samsung: 70 },
//   { sentiment: "neutral", apple: 60, samsung: 50 },
// ];

const chartConfig = {
    apple: {
        label: "Apple",
        color: "red",
    },
    samsung: {
        label: "Samsung",
        color: "blue",
    },
} satisfies ChartConfig;

export function BarChartComponent({data}: {data?: BarChartData[]}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart Comparision</CardTitle>
        <CardDescription>
          Shows the comparision between each sentiment of Apple and Samsung
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full min-w-[300px]"
        >
          <BarChart accessibilityLayer data={data}>
            <defs>
              {/* Red Gradient */}
              <linearGradient id="fillRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.3} />
              </linearGradient>

              {/* Green Gradient */}
              <linearGradient id="fillGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.3} />
              </linearGradient>

              {/* Blue Gradient */}
              <linearGradient id="fillBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="sentiment"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
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
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="apple" fill="url(#fillRed)" radius={2} />
            <Bar dataKey="samsung" fill="url(#fillBlue)" radius={2} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
