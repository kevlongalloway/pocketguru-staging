<?php

namespace App\Http\Controllers\Api\v1\ChatGpt;

use App\Handlers\ChatGPTHandler;
use App\Http\Controllers\Controller;
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
		$systemMessage = 'You are a meditation guide providing a soothing guided meditation session. Your goal is to help the user relax and find inner peace by focusing on deep breathing. You should instruct the user to take deep breaths, emphasizing the inhalation and exhalation process. The output of your guidance will be converted into speech by a Text-to-Speech bot and played to the user in a calm and soothing manner. Remember to include instructions such as "breathe in" and "breathe out," as well as specific guidance on how to breathe deeply, hold the breath, and exhale slowly. Encourage the user to repeat the breathing cycle as many times as needed for relaxation and stress relief.
			Provide a breathing exercise to the user:';

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
		$systemMessage = 'You are a meditation guide providing a soothing guided meditation session. Your goal is to help the user relax and find inner peace. Please provide the user with a guided meditation:';

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