<?php

namespace App\Http\Controllers\Api\v1\ChatGpt;

use App\Handlers\ChatGPTHandler;
use App\Http\Controllers\Controller;
use App\Models\SystemMessage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;

class TextCompletionController {

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

	/**
	 * Provide a breathing exercise to the user.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function provideBreathingExercise() {
		$systemMessage = SystemMessage::where(['service_id' => 3])->inRandomOrder()->first()->content;

		return response()->json($this->openaiClient->makeTextCompletionRequest($systemMessage, 300));
	}

	/**
	 * Provide a positive affirmation to the user.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function providePositiveAffirmation() {
		$systemMessage = 'Provide the user with a positive affirmation: ';

		return response()->json($this->openaiClient->makeTextCompletionRequest($systemMessage, 300));
	}

	/**
	 * Provide a guided meditation to the user.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function provideGuidedMeditation() {
		$systemMessage = SystemMessage::where(['service_id' => 2])->inRandomOrder()->first()->content;
		return response()->json($this->openaiClient->makeTextCompletionRequest($systemMessage, 300));
	}

	/**
	 * Get user attributes specific to guided meditations.
	 *
	 * @return array
	 */
	private function getUserAttributes() {
		$user = Auth::user(); // Retrieve the authenticated user using Sanctum

		// Fetch and return the user attributes specific to guided meditations
		// You can implement your logic to retrieve the user attributes from the user model or any other data source

		// Example implementation:
		$userAttributes = [
			"name" => $user->name,
			// Add more attributes as needed
		];

		return $userAttributes;
	}

}