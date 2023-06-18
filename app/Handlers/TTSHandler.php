<?php

namespace App\Handlers;

use Illuminate\Support\Facades\Http;

class TTSHandler {
	private $apiKey;
	private $parentUrl;

	public function __construct($apiKey) {
		$this->apiKey = $apiKey;
		$this->parentUrl = env('TTS_PARENT_URL'); // Fetch the parent URL from the environment variable
	}

	public function synthesizeAudio($input, $voiceName, $ssml = false, $outputFormat = 'MP3', $sampleRate = 48000) {
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

		// Set the request URL
		$url = $this->parentUrl;

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
