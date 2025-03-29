import { useWs } from "../hooks/useWs";
import { useEffect, useState } from "react";
import { SentimentChart } from "../components/SentimentChart";
import {PieChartComponent} from "../components/PieChartComponent";
import {BarChartComponent} from "../components/BarChartComponent";
import {TopicBarChartComponent} from "../components/TopicBarChartComponent";

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

  //these states for showing the top 5 topics of positive and negative sentiment for apple and samsung(neutral not taken into account)
  const [ws1PositiveDataTopics, setWs1PositiveDataTopics] = useState([]);
  const [ws2PositiveDataTopics, setWs2PositiveDataTopics] = useState([]);

  const [ws1NegativeDataTopics, setWs1NegativeDataTopics] = useState([]);
  const [ws2NegativeDataTopics, setWs2NegativeDataTopics] = useState([]);


  const [isWs1Ready, ws1Value] = useWs("ws://localhost:6002");
  const [isWs2Ready, ws2Value] = useWs("ws://localhost:6001");

  // Process data from the first WebSocket (e.g. Apple)
  useEffect(() => {
    if (isWs1Ready && ws1Value) {
      try {
        const jsonData = JSON.parse(ws1Value);
        console.log(jsonData);
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

        setWs1PositiveDataTopics((prev) => {
          // 1) If `prev` is empty, start fresh with an empty array.
          const initial= [];
          const current = prev?.length ? [...prev] : initial;
          try {
            const topicsArray = JSON.parse(jsonData.topics);
            // 2) Filter the incoming topics for "positive" only and of "apple".
            const positiveTopics = topicsArray.filter(
              (t) => t.sentiment.toLowerCase() === "positive"
            );

            // 3) For each positive topic, update or insert its mention_count in `current`.
            positiveTopics.forEach((pt) => {
              const topicKey = pt.topic.toLowerCase();
              // Look for an existing topic in current state.
              const existingIndex = current.findIndex(
                (item) => item.topic === topicKey
              );

              if (existingIndex >= 0) {
                // Update the existing topic's count
                current[existingIndex] = {
                  ...current[existingIndex],
                  count: current[existingIndex].count + pt.mention_count,
                };
              } else {
                // Insert a new topic with its mention_count
                current.push({
                  topic: topicKey,
                  count: pt.mention_count,
                });
              }
            });

            // 4) Sort descending by `count` and keep only top 5.
            current.sort((a, b) => b.count - a.count);
            const top5 = current.slice(0, 5);

            return top5;
          } catch (error) {
            console.error("Error parsing JSON from ws1:", error);
            return current;
          }
        });

        setWs1NegativeDataTopics((prev) => {
          // 1) If `prev` is empty, start fresh with an empty array.
          const initial = [];
          const current = prev?.length ? [...prev] : initial;
          try {
            const topicsArray = JSON.parse(jsonData.topics);
            // 2) Filter the incoming topics for "positive" only and of "apple".
            const negativeTopics = topicsArray.filter(
              (t) => t.sentiment.toLowerCase() === "negative"
            );

            // 3) For each positive topic, update or insert its mention_count in `current`.
            negativeTopics.forEach((pt) => {
              const topicKey = pt.topic.toLowerCase();
              // Look for an existing topic in current state.
              const existingIndex = current.findIndex(
                (item) => item.topic === topicKey
              );

              if (existingIndex >= 0) {
                // Update the existing topic's count
                current[existingIndex] = {
                  ...current[existingIndex],
                  count: current[existingIndex].count + pt.mention_count,
                };
              } else {
                // Insert a new topic with its mention_count
                current.push({
                  topic: topicKey,
                  count: pt.mention_count,
                });
              }
            });

            // 4) Sort descending by `count` and keep only top 5.
            current.sort((a, b) => b.count - a.count);
            const top5 = current.slice(0, 5);

            return top5;
          } catch (error) {
            console.error("Error parsing JSON from ws1:", error);
            return current;
          }
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

        setWs2PositiveDataTopics((prev) => {
          // 1) If `prev` is empty, start fresh with an empty array.
          const initial = [];
          const current = prev?.length ? [...prev] : initial;
          try {
            const topicsArray = JSON.parse(jsonData.topics);
            // 2) Filter the incoming topics for "positive" only and of "samsung".
            const positiveTopics = topicsArray.filter(
              (t) => t.sentiment.toLowerCase() === "positive"
            );

            // 3) For each positive topic, update or insert its mention_count in `current`.
            positiveTopics.forEach((pt) => {
              const topicKey = pt.topic.toLowerCase();
              // Look for an existing topic in current state.
              const existingIndex = current.findIndex(
                (item) => item.topic === topicKey
              );

              if (existingIndex >= 0) {
                // Update the existing topic's count
                current[existingIndex] = {
                  ...current[existingIndex],
                  count: current[existingIndex].count + pt.mention_count,
                };
              } else {
                // Insert a new topic with its mention_count
                current.push({
                  topic: topicKey,
                  count: pt.mention_count,
                });
              }
            });

            // 4) Sort descending by `count` and keep only top 5.
            current.sort((a, b) => b.count - a.count);
            const top5 = current.slice(0, 5);

            return top5;
          } catch (error) {
            console.error("Error parsing JSON from ws2:", error);
            return current;
          }
        });

        setWs2NegativeDataTopics((prev) => {
          // 1) If `prev` is empty, start fresh with an empty array.
          const initial = [];
          const current = prev?.length ? [...prev] : initial;
          try {
            const topicsArray = JSON.parse(jsonData.topics);
            // 2) Filter the incoming topics for "positive" only and of "apple".
            const negativeTopics = topicsArray.filter(
              (t) =>
                t.sentiment.toLowerCase() === "negative"
            );

            // 3) For each positive topic, update or insert its mention_count in `current`.
            negativeTopics.forEach((pt) => {
              const topicKey = pt.topic.toLowerCase();
              // Look for an existing topic in current state.
              const existingIndex = current.findIndex(
                (item) => item.topic === topicKey
              );

              if (existingIndex >= 0) {
                // Update the existing topic's count
                current[existingIndex] = {
                  ...current[existingIndex],
                  count: current[existingIndex].count + pt.mention_count,
                };
              } else {
                // Insert a new topic with its mention_count
                current.push({
                  topic: topicKey,
                  count: pt.mention_count,
                });
              }
            });

            // 4) Sort descending by `count` and keep only top 5.
            current.sort((a, b) => b.count - a.count);
            const top5 = current.slice(0, 5);

            return top5;  
          } catch (error) {
            console.error("Error parsing JSON from ws2:", error);
            return current;
          }
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
          <h5 className="text-xl pl-4 ml-2 font-bold">Bar Chart Comparison</h5>
          <div className="p-4">
            <BarChartComponent data={wsDataBar} />
          </div>
        </div>
        <div className="flex flex-col">
          <h5 className="text-md w-full text-center pl-4 ml-2 font-bold">
            Reddit Posts Topic Wise Comparison
          </h5>
          <h5 className="text-md pl-4 ml-2 font-bold">
            Positive Topics Comparison
          </h5>
          <div className="p-4  flex flex-col items-center gap-4">
            <TopicBarChartComponent
              data={ws1PositiveDataTopics}
              sentiment="positive"
              company="Apple"
            />
            <TopicBarChartComponent
              data={ws2PositiveDataTopics}
              sentiment="positive"
              company="Samsung"
            />
          </div>
          <h5 className="text-md pl-4 ml-2 font-bold">
            Negative Topics Comparison
          </h5>
          <div className="p-4 flex flex-col items-center gap-4">
            <TopicBarChartComponent
              data={ws1NegativeDataTopics}
              sentiment="negative"
              company="Apple"
            />
            <TopicBarChartComponent
              data={ws2NegativeDataTopics}
              sentiment="negative"
              company="Samsung"
            />
          </div>
        </div>
      </div>
    </>
  );
}
