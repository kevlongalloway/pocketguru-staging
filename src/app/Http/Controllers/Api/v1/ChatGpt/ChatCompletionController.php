<?php

namespace App\Http\Controllers\Api\v1\ChatGpt;

use App\Handlers\ChatGPTHandler;
use App\Http\Controllers\Controller;
use App\Models\SystemMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class ChatCompletionController extends Controller {
    private $openaiClient;
    private $conversationHistoryLimit = 4096;

    public function __construct() {
        $this->openaiClient = new ChatGPTHandler;
    }

    public function chat(Request $request) {
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

        // Truncate the conversation history if it exceeds the character limit
        $conversationHistory = $this->truncateConversationHistory($conversationHistory, 10);

        // Make the chat completion request
        $response = $this->openaiClient->makeChatCompletionRequest(
            $message,
            $conversationHistory,
            $this->findOrRandomSystemMessage($conversationHistory)
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
            "history" => $conversationHistory,
        ], Response::HTTP_OK);
    }

    public function index() {
        return response()->json(Auth::user()->conversation_history);
    }

    private function findOrRandomSystemMessage($conversationHistory) {
        foreach ($conversationHistory as $chat) {
            if ($chat['role'] === 'system') {
                return $chat['content'];
            }
        }

        // If no system message is found in the conversation history, get a random one.
        return $this->getRandomSystemMessage();
    }

    private function appendChatToHistory(&$conversationHistory, $role, $content) {
        $conversationHistory[] = [
            "role" => $role,
            "content" => $content,
        ];
    }

    public function resetHistory(Request $request) {
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

    private function truncateConversationHistory($history, $maxLength) {
        if (count($history) > $maxLength) {
            array_shift($history);
        }
        return $history;
    }

    private function getRandomSystemMessage() {
        $systemMessage = SystemMessage::where('service_id', 1)->inRandomOrder()->first()->content;
        return $systemMessage;
    }
}
