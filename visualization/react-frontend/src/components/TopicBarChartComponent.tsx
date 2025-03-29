import { Bar, BarChart, XAxis, YAxis } from "recharts";

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
    topic: string;
    count: number;
};
// const chartData: BarChartData[] = [
//   { topic: "iphone", count: 100 },
//   { topic: "ipad", count: 80 },
//   { topic: "macbook", count: 60 },
//   { topic: "airpods", count: 40 },
//     { topic: "apple watch", count: 20 },
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

export function TopicBarChartComponent({ data, sentiment , company }: { data?: BarChartData[],sentiment: string,company: "Apple" | "Samsung" }) {
  return (
    <>
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>{company} Comparision</CardTitle>
          <CardDescription>
            Shows the  {sentiment} sentiment comparision for general topics for {company}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartConfig}
            className="mx-auto w-full max-h-[300px]"
          >
            <BarChart
              accessibilityLayer
              data={data}
              layout="horizontal"
              margin={{
                left: -10,
              }}
              
            >
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
              </defs>
              <YAxis
                type="number"
                dataKey="count"
                domain={[0, "dataMax + 10"]} // adjusts domain dynamically
                label={{
                  value: "Sentiment Count",
                  angle: -90,
                }}
              />
              <XAxis
                dataKey="topic"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 20)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="count"
                fill={
                  sentiment === "positive" ? "url(#fillGreen)" : "url(#fillRed)"
                }
                radius={5}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </>
  );
}
