<?php

namespace App\Handlers;

use Illuminate\Support\Facades\Http;

class TTSHandler {
	private $apiKey;
	private $parentUrl;

	public function __construct() {
		$this->apiKey = $this->getAccessToken();
		$this->parentUrl = env('TTS_PARENT_URL', 'projects/%s/locations/%s'); // Fetch the parent URL from the environment variable
	}

	private function getAccessToken() {
		$keyFilePath = storage_path('pg-tts-390208.json');

		if (file_exists($keyFilePath)) {
			$jsonKey = file_get_contents($keyFilePath);
			$keyData = json_decode($jsonKey, true);
			$privateKey = $keyData['private_key'];
			$clientId = $keyData['client_id'];

			$now = time();
			$expiresIn = 3600; // Token expires in 1 hour
			$payload = [
				'iss' => $clientId,
				'sub' => $clientId,
				'aud' => 'https://oauth2.googleapis.com/token',
				'iat' => $now,
				'exp' => $now + $expiresIn,
				'scope' => 'https://www.googleapis.com/auth/cloud-platform',
			];

			$jwt = \Firebase\JWT\JWT::encode($payload, $privateKey, 'RS256');

			$response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
				'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
				'assertion' => $jwt,
			]);

			$accessToken = $response->json()['access_token'];

			return $accessToken;
		} else {
			throw new \Exception('API key file not found.');
		}
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
			'Content-Type' => 'application/x-www-form-urlencoded',
			'Authorization' => 'Bearer ' . $this->apiKey,
		];

		// Send the POST request
		$response = Http::withHeaders($headers)->post($url, json_encode($requestBody));

		return $response;
	}
}
