<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use GuzzleHttp\Client;
use Tectalic\OpenAi\Authentication;
use Tectalic\OpenAi\Manager;
use Tectalic\OpenAi\Models\ChatCompletions\CreateRequest;

class ChatGptController extends Controller
{
    private $openaiClient;
    private $systemMessages;

    /**
     * Create a new ChatGptController instance.
     *
     * @return void
     */
    public function __construct()
    {
        // Build the OpenAI client with API key
        $this->openaiClient = Manager::build(
            new Client(),
            new Authentication(getenv('OPENAI_API_KEY'))
        );

        // Load system messages from file
        $systemMessagesFilePath = storage_path('app/system_messages.txt');
        $this->systemMessages = file($systemMessagesFilePath, FILE_IGNORE_NEW_LINES);
    }

/**
 * Handle the chat API request.
 *
 * @param  \Illuminate\Http\Request  $request
 * @return \Illuminate\Http\JsonResponse
 */
public function chat(Request $request)
{
    // Get the user's message from the request
    $message = $request->input('message');

    // Generate a random system message
    $randomSystemMessage = $this->getRandomSystemMessage();

    // Create the ChatGPT request
    $request = new CreateRequest([
        'model' => 'gpt-3.5-turbo',
        'messages' => [
            [
                'role' => 'system',
                'content' => $randomSystemMessage,
            ],
            [
                'role' => 'user',
                'content' => $message,
            ],
        ],
    ]);

    // Send the request to the ChatGPT API
    $response = $this->openaiClient->chatCompletions()->create($request)->toModel();

    // Get the assistant's reply from the response
    $assistantReply = $response->choices[0]->message->content;

    // Return the chat response as JSON
    return response()->json(['response' => $assistantReply]);
}

    /**
     * Get a random system message from the loaded messages.
     *
     * @return string
     */
    private function getRandomSystemMessage()
    {
        $randomIndex = array_rand($this->systemMessages);
        return $this->systemMessages[$randomIndex];
    }
}

