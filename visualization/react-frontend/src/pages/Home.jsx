import { useWs } from "../hooks/useWs";
import { useEffect, useState } from "react";
import { SentimentChart } from "../components/SentimentChart";
import {PieChartComponent} from "../components/PieChartComponent";
import {BarChartComponent} from "../components/BarChartComponent";

export default function Home() {
  //these state for sentiment area chart
  const [ws1Data, setWs1Data] = useState([]);
  const [ws2Data, setWs2Data] = useState([]);

  //these state for sentiment pie chart
  const [ws1DataPie, setWs1DataPie] = useState([
    { sentiment: "positive", count: 0, fill: "green" },
    { sentiment: "negative", count: 0, fill: "red" },
    { sentiment: "neutral", count: 0, fill: "gray" },
  ]);
  const [ws2DataPie, setWs2DataPie] = useState([
    { sentiment: "positive", count: 0, fill: "green" },
    { sentiment: "negative", count: 0, fill: "red" },
    { sentiment: "neutral", count: 0, fill: "gray" },
  ]);

  //these states for barchart comparision of apple and samsung sentiments
  const [wsDataBar, setWsDataBar] = useState([]); 


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

        setWs1DataPie((prev) => {
          // Initialize if empty
          const initial = [
            { sentiment: "positive", count: 0, fill: "green" },
            { sentiment: "negative", count: 0, fill: "red" },
            { sentiment: "neutral", count: 0, fill: "gray" },
          ];

          const current = prev.length === 0 ? initial : prev;

          // Update the count for the matching sentiment
          return current.map((item) =>
            item.sentiment === jsonData.sentiment_class.toLowerCase()
              ? { ...item, count: item.count + 1 }
              : item
          );
        });

        setWsDataBar((prev) => {
          // Initialize if empty
          const initial = [
            { sentiment: "positive", apple: 0, samsung: 0 },
            { sentiment: "negative", apple: 0, samsung: 0 },
            { sentiment: "neutral", apple: 0, samsung: 0 },
          ];

          const current = prev.length === 0 ? initial : prev;

          // Update the count for the matching sentiment
          return current.map((item) =>
            item.sentiment === jsonData.sentiment_class.toLowerCase() && jsonData.brand.toLowerCase() === "apple"
              ? { ...item, apple: item.apple + 1 }
              : item.sentiment === jsonData.sentiment_class.toLowerCase() && jsonData.brand.toLowerCase() === "samsung"
              ? { ...item, samsung: item.samsung + 1 }
              : item
          );
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

        setWs2DataPie((prev) => {
          // Initialize if empty
          const initial = [
            { sentiment: "positive", count: 0, fill: "green" },
            { sentiment: "negative", count: 0, fill: "red" },
            { sentiment: "neutral", count: 0, fill: "gray" },
          ];

          const current = prev.length === 0 ? initial : prev;

          // Update the count for the matching sentiment
          return current.map((item) =>
            item.sentiment === jsonData.sentiment_class.toLowerCase()
              ? { ...item, count: item.count + 1 }
              : item
          );
        });

        setWsDataBar((prev) => {
          // Initialize if empty
          const initial = [
            { sentiment: "positive", apple: 0, samsung: 0 },
            { sentiment: "negative", apple: 0, samsung: 0 },
            { sentiment: "neutral", apple: 0, samsung: 0 },
          ];

          const current = prev.length === 0 ? initial : prev;

          // Update the count for the matching sentiment
          return current.map((item) =>
            item.sentiment === jsonData.sentiment_class.toLowerCase() &&
            jsonData.brand.toLowerCase() === "apple"
              ? { ...item, apple: item.apple + 1 }
              : item.sentiment === jsonData.sentiment_class.toLowerCase() &&
                jsonData.brand.toLowerCase() === "samsung"
              ? { ...item, samsung: item.samsung + 1 }
              : item
          );
        });
      } catch (error) {
        console.error("Error parsing JSON from ws2:", error);
      }
    }
  }, [isWs2Ready, ws2Value]);


  return (
    <>
      <div className="flex flex-col gap-2 p-4 m-4 bg-gray-100 rounded-lg shadow-lg ">
        <h1 className="text-3xl font-bold text-center">
          Brand Monitor Analysis-Apple
        </h1>
        <p className="text-center">
          This is a real-time analysis of tweets related to Company Apple and
          its competitor Samsung.
        </p>
      </div>
      <div className="gap-4">
        <div className="flex flex-col">
          <h5 className="text-xl pl-4 ml-2 font-bold">Sentiment Analysis</h5>
          <div className=" p-4 flex flex-col  gap-5">
            <SentimentChart data={ws1Data} title="Apple Sentiment" />
            <SentimentChart data={ws2Data} title="Samsung Sentiment" />
          </div>
        </div>
        <div className="flex flex-col">
          <h5 className="text-xl pl-4 ml-2 font-bold">
            Sentiment Distribution
          </h5>
          <div className="p-4 flex justify-center gap-10">
            <PieChartComponent data={ws1DataPie} title="Apple Sentiment" />
            <PieChartComponent data={ws2DataPie} title="Samsung Sentiment" />
          </div>
        </div>
        <div className="flex flex-col">
          <h5 className="text-xl pl-4 ml-2 font-bold">
            Bar Chart Comparison
          </h5>
          <div className="p-4">
            <BarChartComponent data={wsDataBar}/>
          </div>
        </div>
      </div>
    </>
  );
}
