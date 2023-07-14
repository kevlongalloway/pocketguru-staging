<?php

namespace App\Http\Controllers\Api\v1\ChatGpt;

use App\Handlers\ChatGPTHandler;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

// use Symfony\Component\HttpFoundation\Response;

class ChatGptTestingController extends Controller {
	private $openaiClient;

	/**
	 * Create a new instance of the controller.
	 *
	 * This function initializes the OpenAI client by creating a new instance of the ChatGPTHandler class.
	 * The OpenAI client will be used to interact with the OpenAI API for chat-based language processing.
	 * It allows the controller to make requests to generate responses using the ChatGPT model.
	 */
	public function __construct() {
		$this->openaiClient = new ChatGPTHandler;
	}

	public function testSystemMessage(Request $request) {
		$systemMessage = $request->input("system_message");
		return response()->json($this->openaiClient->makeTextCompletionRequest($systemMessage, 300));
	}
}
