<?php

namespace App\Handlers;

use Illuminate\Support\Facades\Http;

class TTSHandler {
	private $apiKey;
	private $parentUrl;

	public function __construct($apiKey) {
		$this->apiKey = $apiKey;
		$this->parentUrl = env('TTS_PARENT_URL', 'projects/%s/locations/%s'); // Fetch the parent URL from the environment variable
	}

	public function synthesizeAudio($input, $voiceName, $ssml = false, $outputFormat = 'MP3', $sampleRate = 48000) {
		$project = env('TTS_PROJECT');
		$location = env('TTS_LOCATION');
		// Prepare the request body
		$requestBody = [
			'input' => [
				$ssml ? 'ssml' : 'text' => $input,
			],
			'audioConfig' => [
				'audioEncoding' => $outputFormat,
				'sampleRateHertz' => $sampleRate,
			],
			'voice' => [
				'name' => $voiceName,
			],
		];

		// Create the parent URL using the format and variables
		$parentUrl = sprintf($this->parentUrl, $project, $location);

		// Set the request URL
		$url = "https://texttospeech.googleapis.com/v1beta1/" . $parentUrl . ":synthesizeLongAudio";

		// Set the request headers
		$headers = [
			'Content-Type' => 'application/json',
			'Authorization' => 'Bearer ' . $this->apiKey,
		];

		// Send the POST request
		$response = Http::withHeaders($headers)->post($url, $requestBody);

		return $response;
	}
}
