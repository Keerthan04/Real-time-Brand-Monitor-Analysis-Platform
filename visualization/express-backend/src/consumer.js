import kafkaClient from './service/kafkaclient.js';

const consumerRun = async (groupId,topic,websocket) =>{
    const consumer = kafkaClient.consumer({ groupId: groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });

    const handleMessage = async ({topic, partition, message}) => {
        websocket.clients.forEach((client) => {
          // console.log("message is ",message)
          if (client.readyState === 1) {
            client.send(message.value.toString());
          }
        });

        // console.log(
        //   `Topic - ${topic}, Partition - ${partition}, Message - ${message.value}`
        // );
    }

    try {
        await consumer.run({
            eachMessage: handleMessage
        })
    } catch (error) {
        console.error(`Error in consumer: ${error.message}`);
    }
}

export default consumerRun;