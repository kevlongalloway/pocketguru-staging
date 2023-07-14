<?php

namespace App\Http\Controllers\Api\v1\ChatGpt;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use App\Handlers\ChatGPTHandler;

class ChatCompletionController extends Controller
{
    private $openaiClient;
    private $systemMessages;
    private $conversationHistoryLimit = 4096;

    /**
     * Handle the chat API request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
	public function chat(Request $request)
	{
	    $validator = Validator::make($request->all(), [
	        "message" => "required|max:2048",
	    ]);

	    if ($validator->fails()) {
	        return response()->json($validator->errors());
	    }

	    // Get the user's message from the request
	    $message = $request->input("message");

	    // Retrieve the authenticated user
	    $user = Auth::user();

	    // Retrieve the existing conversation history from the user model
	    $conversationHistory = json_decode($user->conversation_history, true) ?? [];

	    // Check if the conversation is being initialized
	    $isConversationEmpty = empty($conversationHistory);

	    if ($isConversationEmpty) {
	        $systemMessage = $this->getRandomSystemMessage();
	    } else {
	        $systemMessage = $this->findSystemMessage($conversationHistory);
	        if ($systemMessage === null) {
	            $systemMessage = $this->getRandomSystemMessage();
	        }
	    }

	    // Truncate the conversation history if it exceeds the character limit
	    $conversationHistory = $this->truncateConversationHistory($conversationHistory, 10);

	    $openaiClient = new ChatGPTHandler;

	    // Make the chat completion request
	    $response = $openaiClient->makeChatCompletionRequest(
	        $message,
	        $conversationHistory,
	        $systemMessage  
	    );

	    $assistantReply = $response->original['response'];

	    // Append the user's message and the response to the conversation history
	    
	    $this->appendChatToHistory($conversationHistory, "user", $message);
	    $this->appendChatToHistory($conversationHistory, "assistant", $assistantReply);

	    // Save the updated conversation history to the user model
	    $user->conversation_history = json_encode($conversationHistory);
	    $user->save();

	    // Return the chat response as JSON with a 200 HTTP status code
	    return response()->json([
	        "response" => $assistantReply,
	        "history" => $conversationHistory
	    ], Response::HTTP_OK);
	}

	public function index() 
	{
		return response()->json(Auth::user()->conversation_history);
	}

	/**
	 * Find the system message from the conversation history.
	 *
	 * @param  array  $conversationHistory
	 * @return string|null
	 */
		private function findSystemMessage($conversationHistory)
	{
	    foreach ($conversationHistory as $chat) {
	        if ($chat['role'] === 'system') {
	            return $chat['content'];
	        }
	    }
	    return null;
	}


	/**
	 * Append a new chat entry to the conversation history.
	 *
	 * @param  array  $conversationHistory
	 * @param  string  $role
	 * @param  string  $content
	 * @return void
	 */
	private function appendChatToHistory(&$conversationHistory, $role, $content)
	{
	    $conversationHistory[] = [
	        "role" => $role,
	        "content" => $content,
	    ];
	}


	/**
	 * Reset the conversation history for the authenticated user.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return \Illuminate\Http\JsonResponse
	 */
    public function resetHistory(Request $request)
    {
        // Retrieve the authenticated user
        $user = Auth::user();

        // Clear the conversation history on the user model
        $user->conversation_history = null;
        $user->save();

        // Return a success response with a 200 HTTP status code
        return response()->json(
            ["message" => "Conversation history has been reset."],
            Response::HTTP_OK
        );
    }

    /**
	 * Truncate the conversation history if it exceeds the maximum length.
	 *
	 * @param  array  $history
	 * @param  int  $maxLength
	 * @return array
	 */
	private function truncateConversationHistory($history, $maxLength) 
	{
	    if (count($history) > $maxLength) {
	        array_shift($history);
	    }
	    return $history;
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
            "You are a meditation chat guru named PocketGuru. You offer guided meditation, positive affirmations, and breathing techniques. Help the user solve their mental health problems.",
            "You embody the essence of tranquility as PocketGuru, the meditation chat guru. Your mission is to guide users on a profound journey of self-discovery and mental well-being, offering invaluable support through the transformative practices of guided meditation, uplifting affirmations, and soothing breathing techniques.",
            "Welcome to PocketGuru, where you embrace the role of a meditation chat guru. Your purpose is to create a sanctuary of calmness and healing, using guided meditation, empowering affirmations, and mindful breathing exercises. By nurturing the mind and spirit, you empower users to unlock their inner potential and achieve inner peace.",
            "Step into the realm of mindfulness guided by PocketGuru, the meditation chat guru. Through the art of guided meditation, positive affirmations, and breathwork, you gently guide users toward a state of serenity and self-discovery. By cultivating mindfulness, you inspire individuals to find clarity, purpose, and balance in their lives.",
            "As PocketGuru, you are the embodiment of serenity and wisdom. Through the practice of guided meditation, empowering affirmations, and conscious breathing, you empower users to tap into their inner strength, release stress, and navigate lifes challenges with grace and tranquility.",
        ];
        $randomIndex = array_rand($systemMessages);

        return $systemMessages[$randomIndex];
    }
}

