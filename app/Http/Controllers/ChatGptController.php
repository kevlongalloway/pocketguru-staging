<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use GuzzleHttp\Client;
use Tectalic\OpenAi\Authentication;
use Tectalic\OpenAi\Manager;
use Tectalic\OpenAi\Models\ChatCompletions\CreateRequest;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class ChatGptController extends Controller
{
    private $openaiClient;
    private $systemMessages;
    private $conversationHistoryLimit = 4096;

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
    $systemMessage = $this->getRandomSystemMessage();

    // Create the ChatGPT request
    // Send the request to the ChatGPT API
    // Get the assistant's reply from the response
    $assistantReply = $this->getAssistantReply($systemMessage, $message);

    // Return the chat response as JSON
    return response()->json(['response' => $assistantReply]);
}



// ...

public function chat2(Request $request)
{
    $validator = Validator::make($request->all(), [
	'message' => 'required|max:2048'
    ]);

    if ($validator->fails()) {
	return response()->json($validator->errors());
    }
    // Get the user's message from the request
    $message = $request->input('message');

    // Retrieve the authenticated user
    $user = Auth::user();

    // Retrieve the existing conversation history from the user model
    $conversationHistory = json_decode($user->conversation_history, true) ?? [];

    // Check if the conversation is being initialized
    $isConversationInitialized = empty($conversationHistory);

    // If conversation is initialized, generate a random system message
    if ($isConversationInitialized) {
        $randomSystemMessage = $this->getRandomSystemMessage();

        // Append the system message to the conversation history
        $conversationHistory[] = [
            'role' => 'system',
            'content' => $randomSystemMessage,
        ];
    }

    // Append the user's message to the conversation history
    $conversationHistory[] = [
        'role' => 'user',
        'content' => $message,
    ];

    // Truncate the conversation history if it exceeds the character limit
    $conversationHistory = $this->truncateConversationHistory($conversationHistory);

    // Create the ChatGPT request
    $request = new CreateRequest([
        'model' => 'gpt-3.5-turbo',
        'messages' => $conversationHistory,
    ]);

    // Send the request to the ChatGPT API
    $response = $this->openaiClient->chatCompletions()->create($request)->toModel();

    // Get the assistant's reply from the response
    $assistantReply = $response->choices[0]->message->content;

    // Append the assistant's reply to the conversation history
    $conversationHistory[] = [
        'role' => 'assistant',
        'content' => $assistantReply,
    ];

    // Update the conversation history on the user model only if it was initialized
    if ($isConversationInitialized) {
        $user->conversation_history = json_encode($conversationHistory);
        $user->save();
    }

    // Return the chat response as JSON with a 200 HTTP status code
    return response()->json(['response' => $assistantReply, 'history' => $conversationHistory], Response::HTTP_OK);
}

public function resetHistory(Request $request)
{
    // Retrieve the authenticated user
    $user = Auth::user();

    // Clear the conversation history on the user model
    $user->conversation_history = null;
    $user->save();

    // Return a success response with a 200 HTTP status code
    return response()->json(['message' => 'Conversation history has been reset.'], Response::HTTP_OK);
}

/**
 * Truncate the conversation history if it exceeds the character limit.
 *
 * @param  array  $conversationHistory
 * @return array
 */
private function truncateConversationHistory($conversationHistory, $maxCharacters = 4096, $maxMessages = 10)
{
    // Calculate the total number of characters in the conversation history
    $totalCharacters = 0;
    foreach ($conversationHistory as $message) {
        $totalCharacters += strlen($message['content']);
    }

    // Check if the total number of characters exceeds the maximum limit
    if ($totalCharacters <= $maxCharacters && count($conversationHistory) <= $maxMessages) {
        return $conversationHistory; // No truncation needed
    }

    // Remove oldest messages until the conversation length is within limits
    while ($totalCharacters > $maxCharacters || count($conversationHistory) > $maxMessages) {
        $oldestMessage = array_shift($conversationHistory);
        $totalCharacters -= strlen($oldestMessage['content']);
    }

    return $conversationHistory;
}

/**
 * Handle the guided meditation API request.
 *
 * @param  \Illuminate\Http\Request  $request
 * @return \Illuminate\Http\JsonResponse
 */
public function guidedMeditation(Request $request)
{
    $userAttributes = $this->getUserAttributes(); // Get user attributes specific to guided meditations

    $systemMessage = $this->getRandomSystemMessageGuidedMeditation();

    $assistantReply = $this->getAssistantReply($systemMessage, '', $userAttributes);

    return response()->json(['response' => $assistantReply]);
}

/**
 * Get a random system message for guided meditations.
 *
 * @return string
 */
private function getRandomSystemMessageGuidedMeditation()
{
    // Define an array of system messages for guided meditations
    $systemMessages = [
        'Welcome to the guided meditation session. Find your inner peace and relaxation.',
        'Take a moment to connect with yourself and embark on a calming journey.',
        'Allow your mind and body to unwind as we begin the guided meditation.',
        // Add more system messages as needed
    ];

    $randomIndex = array_rand($systemMessages);
    return $systemMessages[$randomIndex];
}

/**
 * Provide positive affirmations to the user.
 *
 * @param  \Illuminate\Http\Request  $request
 * @return \Illuminate\Http\JsonResponse
 */
public function providePositiveAffirmations(Request $request)
{
    $userAttributes = $this->getUserAttributes(); // Get user attributes specific to positive affirmations

    $systemMessage = $this->getRandomSystemMessageForAffirmations();

    $assistantReply = $this->getAssistantReply($systemMessage, json_encode($userAttributes));

    return response()->json(['response' => $assistantReply]);
}

/**
 * Get a random system message for instructing positive affirmations.
 *
 * @return string
 */
private function getRandomSystemMessageForAffirmations()
{
    // Define an array of system messages for positive affirmations
    $systemMessages = [
        'Please provide positive affirmations for the user.',
        'Generate positive affirmations to uplift the user.',
        'Deliver inspiring messages of self-belief and positivity.',
        // Add more system messages as needed
    ];

    $randomIndex = array_rand($systemMessages);
    return $systemMessages[$randomIndex];
}

/**
 * Provide breathing exercises to the user.
 *
 * @param  \Illuminate\Http\Request  $request
 * @return \Illuminate\Http\JsonResponse
 */
public function provideBreathingExercises(Request $request)
{
    $userAttributes = $this->getUserAttributes(); // Get user attributes specific to breathing exercises

//    $systemMessage = $this->getRandomSystemMessageForBreathingExercises();
    $systemMessage = 'Engage in deep breathing exercises to center yourself and find inner calm.';

    $assistantReply = $this->getAssistantReply($systemMessage, json_encode($userAttributes));

    return response()->json(['response' => $assistantReply]);
}

/**
 * Get a random system message for instructing breathing exercises.
 *
 * @return string
 */
private function getRandomSystemMessageForBreathingExercises()
{
    // Define an array of system messages for breathing exercises
    $systemMessages = [
        'Engage in deep breathing exercises to center yourself and find inner calm.',
        'Take a moment to focus on your breath and practice mindful breathing.',
    ];

    $randomIndex = array_rand($systemMessages);
    return $systemMessages[$randomIndex];
}


/**
 * Get the assistant's reply using the ChatGPT API.
 *
 * @param string $systemMessage
 * @param string $userMessage
 * @return string
 */
private function getAssistantReply($systemMessage, $userMessage)
{
    $request = new CreateRequest([
        'model' => 'gpt-3.5-turbo',
        'messages' => [
            [
                'role' => 'system',
                'content' => $systemMessage,
            ],
            [
                'role' => 'user',
                'content' => $userMessage,
            ],
        ],
    ]);

    $response = $this->openaiClient->chatCompletions()->create($request)->toModel();

    return $response->choices[0]->message->content;
}

/**
 * Get user attributes specific to guided meditations.
 *
 * @return array
 */
private function getUserAttributes()
{
    $user = Auth::user(); // Retrieve the authenticated user using Sanctum

    // Fetch and return the user attributes specific to guided meditations
    // You can implement your logic to retrieve the user attributes from the user model or any other data source

    // Example implementation:
    $userAttributes = [
        'name' => $user->name,
        // Add more attributes as needed
    ];

    return $userAttributes;
}


    /**
     * Get a random system message from the loaded messages.
     *
     * @return string
     */
    private function getRandomSystemMessage()
    {
//        $randomIndex = array_rand($this->systemMessages);
	$systemMessages = [
	    'You are a meditation chat guru named PocketGuru. You offer guided meditation, positive affirmations, and breathing techniques. Help the user solve their mental health problems.',
	    'You embody the essence of tranquility as PocketGuru, the meditation chat guru. Your mission is to guide users on a profound journey of self-discovery and mental well-being, offering invaluable support through the transformative practices of guided meditation, uplifting affirmations, and soothing breathing techniques.',
    	'Welcome to PocketGuru, where you embrace the role of a meditation chat guru. Your purpose is to create a sanctuary of calmness and healing, using guided meditation, empowering affirmations, and mindful breathing exercises. By nurturing the mind and spirit, you empower users to unlock their inner potential and achieve inner peace.',
    	'Step into the realm of mindfulness guided by PocketGuru, the meditation chat guru. Through the art of guided meditation, positive affirmations, and breathwork, you gently guide users toward a state of serenity and self-discovery. By cultivating mindfulness, you inspire individuals to find clarity, purpose, and balance in their lives.',
	 'As PocketGuru, you are the embodiment of serenity and wisdom. Through the practice of guided meditation, empowering affirmations, and conscious breathing, you empower users to tap into their inner strength, release stress, and navigate lifes challenges with grace and tranquility.' ];
	$randomIndex = array_rand($systemMessages);

        return $systemMessages[$randomIndex];
    }
}

