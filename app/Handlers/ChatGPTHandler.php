<?php

namespace App\Handlers;

use GuzzleHttp\Client;
use Illuminate\Http\Response;

class ChatGPTHandler {
    private $maxTokens = 4096;
    private $apiKey;

    public function __construct()
    {
        $this->apiKey = env('OPENAI_API_KEY');
    }

    public function makeTextCompletionRequest($prompt, $maxTokens)
    {
        // Set the API endpoint URL
        $url = 'https://api.openai.com/v1/completions';

        // Set the request headers
        $headers = [
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ];

        // Set the request data
        $data = [
            'model' => 'text-davinci-003',
            'prompt' => $prompt,
            'max_tokens' => $maxTokens,
        ];

        // Create a new Guzzle HTTP client instance
        $client = new Client();

        // Send a POST request to the OpenAI API
        $response = $client->post($url, [
            'headers' => $headers,
            'json' => $data
        ]);

        // Check if the request was successful (200 status code)
        if ($response->getStatusCode() === 200) {
            // Extract the generated text from the API response
            $responseData = json_decode($response->getBody(), true);
            return $responseData['choices'][0]['text'];
        }

        // Handle error response
        return null;
    }

    public function makeChatCompletionRequest($message, $chatHistory = [], $systemMessage = null)
    {
        $client = new Client();

        // Set the API endpoint
        $url = 'https://api.openai.com/v1/chat/completions';

        // Construct the messages array with chat history
        $messages = [];

        if ($systemMessage !== null) {
            $messages[] = ['role' => 'system', 'content' => $systemMessage];
        }

        $messages[] = ['role' => 'user', 'content' => $message];

        // Set the request parameters
        $data = [
            'model' => 'gpt-3.5-turbo',
            'messages' => $messages
        ];

        // Send the request to the API
        $response = $client->post($url, [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json'
            ],
            'json' => $data
        ]);

        // Get the response body
        $responseBody = $response->getBody()->getContents();

        // Parse the JSON response
        $responseData = json_decode($responseBody, true);

        // Extract the generated message
        $generatedMessage = $responseData['choices'][0]['message']['content'];

        return response()->json(
            ["response" => $generatedMessage],
            Response::HTTP_OK
        );
    }
}
