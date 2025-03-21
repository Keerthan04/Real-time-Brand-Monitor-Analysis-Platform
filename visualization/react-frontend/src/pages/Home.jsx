import { AreaLineChartCanvas } from "../components/AreaLineChartCanvas";
import { useWs } from "../hooks/useWs";
import { useEffect, useState } from "react";
import { SentimentChart } from "../components/SentimentChart";

export default function Home() {
  const [ws1Data, setWs1Data] = useState([]);
  const [ws2Data, setWs2Data] = useState([]);
  const [isWs1Ready, ws1Value] = useWs("ws://localhost:6002");
  const [isWs2Ready, ws2Value] = useWs("ws://localhost:6001");

  // Process data from the first WebSocket (e.g. Apple)
  useEffect(() => {
    if (isWs1Ready && ws1Value) {
      try {
        const jsonData = JSON.parse(ws1Value);
        setWs1Data((prev) => {
          // If empty, start fresh with 0 for each sentiment
          const lastItem = prev[prev.length - 1] ?? {
            positive: 0,
            negative: 0,
            neutral: 0,
          };

          return [
            ...prev,
            {
              date: jsonData.processed_timestamp
                ? new Date(jsonData.processed_timestamp).toLocaleTimeString()
                : new Date().toLocaleTimeString(),
              positive:
                jsonData.sentiment_class.toLowerCase() === "positive"
                  ? lastItem.positive + 1
                  : lastItem.positive,
              negative:
                jsonData.sentiment_class.toLowerCase() === "negative"
                  ? lastItem.negative + 1
                  : lastItem.negative,
              neutral:
                jsonData.sentiment_class.toLowerCase() === "neutral"
                  ? lastItem.neutral + 1
                  : lastItem.neutral,
            },
          ];
        });

      } catch (error) {
        console.error("Error parsing JSON from ws1:", error);
      }
    }
  }, [isWs1Ready, ws1Value]);

  // Process data from the second WebSocket (e.g. Samsung)
  useEffect(() => {
    if (isWs2Ready && ws2Value) {
      try {
        const jsonData = JSON.parse(ws2Value);
        setWs2Data((prev) => {
          // If empty, start fresh with 0 for each sentiment
          const lastItem = prev[prev.length - 1] ?? {
            positive: 0,
            negative: 0,
            neutral: 0,
          };

          return [
            ...prev,
            {
              date: jsonData.processed_timestamp
                ? new Date(jsonData.processed_timestamp).toLocaleTimeString()
                : new Date().toLocaleTimeString(),
              positive:
                jsonData.sentiment_class.toLowerCase() === "positive"
                  ? lastItem.positive + 1
                  : lastItem.positive,
              negative:
                jsonData.sentiment_class.toLowerCase() === "negative"
                  ? lastItem.negative + 1
                  : lastItem.negative,
              neutral:
                jsonData.sentiment_class.toLowerCase() === "neutral"
                  ? lastItem.neutral + 1
                  : lastItem.neutral,
            },
          ];
        });

      } catch (error) {
        console.error("Error parsing JSON from ws2:", error);
      }
    }
  }, [isWs2Ready, ws2Value]);

  console.log({ ws1Data });
  console.log({ ws2Data });

  return (
    <div className="h-screen w-screen p-4 flex  items-center justify-center gap-5">
      <SentimentChart data={ws1Data} title="Apple Sentiment" />
      <SentimentChart data={ws2Data} title="Samsung Sentiment" />
      {/* <AreaLineChartCanvas data={ws2Data} color={"green"} /> */}
    </div>
  );
}
