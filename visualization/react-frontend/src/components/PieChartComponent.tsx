import { Pie, PieChart } from "recharts";

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

type piechartData = {
  sentiment: "positive" | "negative" | "neutral";
  count: number;
  fill: string;
};

// const randomData: piechartData[] = [
//   { sentiment: "positive", count: 100, fill: "#95CB95" },
//   { sentiment: "negative", count: 80, fill: "#FE8E8E" },
//   { sentiment: "neutral", count: 70, fill: "#D2D2D2" },
// ];

const chartConfig = {
  Sentiment: {
    label: "Sentiment",
  },
  positive: {
    label: "Positive",
    color: "green",
  },
  negative: {
    label: "Negative",
    color: "red",
  },
  neutral: {
    label: "Neutral",
    color: "gray",
  },
} satisfies ChartConfig;

export function PieChartComponent({
  data,
  title,
}: {
  data?: piechartData[];
  title: string;
}) {
  return (
    <Card className="flex flex-col w-1/2">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title} Pie Chart</CardTitle>
        <CardDescription>
          Shows distribution of sentiment of tweets of {title}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel={false} />}
            />
            <Pie data={data} dataKey="count" nameKey="sentiment" label>
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="sentiment" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
