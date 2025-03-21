import { useEffect, useState } from "react";
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

  console.log("Apple topics data is", appleTopicData);
  console.log("Samsung topics data is", samsungTopicData);
  return (
    <>
      <div className="w-full h-full flex flex-col gap-2 justify-center items-center">
          <h3>Apple Sentiment Counts</h3>
          {/* Display the Apple sentiment data. */}
          <p>Positive: {appleSentimentData.positive}</p>
          <p>Negative: {appleSentimentData.negative}</p>
          <h3>Samsung Sentiment Counts</h3>
          {/* Display the Samsung sentiment data. */}
          <p>Positive: {samsungSentimentData.positive}</p>
          <p>Negative: {samsungSentimentData.negative}</p>
          <h3>Apple Topic Sentiments</h3>
          {/* Display the Apple topic data. */}
          <pre>{JSON.stringify(appleTopicData, null, 2)}</pre>
          <h3>Samsung Topic Sentiments</h3>
          {/* Display the Samsung topic data. */}
          <pre>{JSON.stringify(samsungTopicData, null, 2)}</pre>
      </div>
    </>
  );
}

export default App;
