const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({
    message: "Hello! Thank you for using Claude-GPT-API. Made by adityabh2007. Repo: https://github.com/adityabh2007/Claude-GPT-API",
  });
});

app.post('/v1/chat/completions', async (req, res) => {
  const { model, messages, stream } = req.body;

  // Only support user role
  for (let message of messages) {
    if (message.role === 'system') {
      message.role = 'user';
    }
  }

  try {
    await chatWithDuckDuckGo(req, res, messages, stream, model);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/v1/models', (req, res) => {
  res.json({
    object: "list",
    data: [
      {
        id: "gpt-3.5-turbo-0125",
        object: "model",
        created: 1692901427,
        owned_by: "system",
      },
      {
        id: "claude-3-haiku-20240307",
        object: "model",
        created: 1692901427,
        owned_by: "user",
      },
    ],
  });
});

async function chatWithDuckDuckGo(req, res, messages, stream, model) {
	const headers = {
	  'accept': 'text/event-stream',
	  'accept-language': 'en',
	  'content-type': 'application/json',
	  'cookie': 'dcm=1; dcs=1',
	  'origin': 'https://duckduckgo.com',
	  'priority': 'u=1, i',
	  'referer': 'https://duckduckgo.com/',
	  'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
	  'sec-ch-ua-mobile': '?0',
	  'sec-ch-ua-platform': '"Windows"',
	  'sec-fetch-dest': 'empty',
	  'sec-fetch-mode': 'cors',
	  'sec-fetch-site': 'same-origin',
	  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
	  'x-vqd-4': '4-132201320654189335102394766993669085744'
	};
  
	const chatURL = "https://duckduckgo.com/duckchat/v1/chat";
  
	try {
	  const payload = {
		model: model,
		messages: messages
	  };
  
	  const chatResponse = await axios.post(chatURL, payload, {
		headers: headers,
		responseType: 'stream'
	  });

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Transfer-Encoding': 'chunked',
    });

    let responseContent = "";

    chatResponse.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataChunk = line.substring(6);
          if (dataChunk === "[DONE]") {
            if (!stream) {
              res.json({
                id: uuidv4(),
                object: "chat.completion",
                created: Date.now(),
                model: model,
                choices: [{
                  index: 0,
                  message: {
                    role: "assistant",
                    content: responseContent,
                  },
                  finish_reason: "stop",
                }],
              });
              res.end();
            } else {
              res.write(`data: ${JSON.stringify({
                id: uuidv4(),
                object: "chat.completion",
                created: Date.now(),
                model: model,
                choices: [{ index: 0, finish_reason: "stop" }],
              })}\n\n`);
              res.write("data: [DONE]\n\n");
              res.end();
            }
            return;
          }

          const data = JSON.parse(dataChunk);
          responseContent += data.message;

          if (stream) {
            res.write(`data: ${JSON.stringify({
              id: data.id,
              object: "chat.completion",
              created: data.created,
              model: data.model,
              choices: [{ index: 0, delta: { content: data.message } }],
            })}\n\n`);
          }
        }
      }
    });

    chatResponse.data.on('end', () => {
      if (stream) {
        res.end();
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
