import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import io from "socket.io-client";

// Connect to your Flask backend; adjust the URL/port as needed.
const socket = io("http://localhost:5001");

function App() {
  // State for sentiment and topic data.
  const [appleSentimentData, setAppleSentimentData] = useState({
    positive: 0,
    negative: 0,
  });
  const [samsungSentimentData, setSamsungSentimentData] = useState({
    positive: 0,
    negative: 0,
  });
  const [appleTopicData, setAppleTopicData] = useState({});
  const [samsungTopicData, setSamsungTopicData] = useState({});

  useEffect(() => {
    // Listen for connection and real-time updates.
    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
    });

    socket.on("update_sentiment_data", (data) => {
      console.log("Received update_sentiment_data:", data);
      // Update state with the received data.
      setAppleSentimentData(data.apple_sentiment_counts);
      setSamsungSentimentData(data.samsung_sentiment_counts);
      setAppleTopicData(data.apple_topic_sentiments);
      setSamsungTopicData(data.samsung_topic_sentiments);
    });

    // Cleanup on unmount.
    return () => {
      socket.off("update_sentiment_data");
    };
  }, []);

  // Prepare sentiment chart data.
  const sentimentChartData = {
    labels: ["Positive", "Negative"],
    datasets: [
      {
        label: "Apple Sentiment",
        data: [
          appleSentimentData["Positive"] || appleSentimentData["positive"] || 0,
          appleSentimentData["Negative"] || appleSentimentData["negative"] || 0,
        ],
        backgroundColor: "rgba(0, 123, 255, 0.7)",
      },
      {
        label: "Samsung Sentiment",
        data: [
          samsungSentimentData["Positive"] ||
            samsungSentimentData["positive"] ||
            0,
          samsungSentimentData["Negative"] ||
            samsungSentimentData["negative"] ||
            0,
        ],
        backgroundColor: "rgba(255, 99, 132, 0.7)",
      },
    ],
  };

  // For the topics chart, merge the topic keys from both brands.
  const allTopics = Array.from(
    new Set([...Object.keys(appleTopicData), ...Object.keys(samsungTopicData)])
  );

  // Map each topic to its respective sentiment count (e.g., positive count).
  const appleTopicSentiments = allTopics.map(
    (topic) =>
      (appleTopicData[topic] && (appleTopicData[topic]["positive"] || 0)) || 0
  );
  const samsungTopicSentiments = allTopics.map(
    (topic) =>
      (samsungTopicData[topic] && (samsungTopicData[topic]["positive"] || 0)) ||
      0
  );

  const topicChartData = {
    labels: allTopics,
    datasets: [
      {
        label: "Apple Topic Sentiment",
        data: appleTopicSentiments,
        backgroundColor: "rgba(0, 123, 255, 0.7)",
      },
      {
        label: "Samsung Topic Sentiment",
        data: samsungTopicSentiments,
        backgroundColor: "rgba(255, 99, 132, 0.7)",
      },
    ],
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Real-Time Sentiment Visualization</h1>
      <div style={{ maxWidth: "600px", margin: "auto" }}>
        <Bar
          data={sentimentChartData}
          options={{
            responsive: true,
            scales: { y: { beginAtZero: true } },
          }}
        />
      </div>
      <div style={{ maxWidth: "600px", margin: "50px auto" }}>
        <Bar
          id="appleSamsungSentimentChart"
          data={topicChartData}
          options={{
            responsive: true,
            scales: { y: { beginAtZero: true } },
          }}
        />
      </div>
    </div>
  );
}

export default App;
