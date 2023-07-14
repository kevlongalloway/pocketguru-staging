<?php

namespace App\Modules;

use Spatie\FastSnapshots\Facades\FastSnapshots;

class TokenReducer {
	private const MAX_TOKENS = 4096;

	/**
	 * Reduce the number of tokens by selecting relevant messages from the target data.
	 *
	 * @param string $userInput The user input string.
	 * @param array $targetData The target data containing messages.
	 * @return array The selected relevant messages.
	 */
	public static function reduceTokens(string $userInput, array $targetData): array
	{
		$modelPath = config('app.fasttext_model_path');
		$model = FastSnapshots::loadModel($modelPath);

		$messages = collect($targetData)->pluck('message');
		$relevantMessages = $messages->map(function ($message) use ($model, $userInput) {
			return self::calculateRelevanceScore($message, $model, $userInput);
		});

		$relevantMessages = $relevantMessages->sortByDesc('score');

		$totalTokens = str_word_count($userInput) + 2; // Include the user input and system message tokens
		$selectedMessages = [];

		foreach ($relevantMessages as $message) {
			$totalTokens += $message['tokens'];

			if ($totalTokens > self::MAX_TOKENS) {
				break;
			}

			$selectedMessages[] = $message['message'];
		}

		return $selectedMessages;
	}

	/**
	 * Calculate the relevance score for a given message.
	 *
	 * @param string $message The message to calculate the relevance score for.
	 * @param object $model The loaded FastText model.
	 * @param string $userInput The user input string.
	 * @return array The relevance score and token count for the message.
	 */
	private static function calculateRelevanceScore(string $message, $model, string $userInput): array
	{
		$messageVector = $model->textVectorize($message);
		$userInputVector = $model->textVectorize($userInput);
		$similarityScore = $model->cosineSimilarity($userInputVector, $messageVector);

		return [
			'message' => $message,
			'score' => $similarityScore,
			'tokens' => str_word_count($message),
		];
	}
}
