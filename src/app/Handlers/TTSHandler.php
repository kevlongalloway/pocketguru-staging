<?php

namespace App\Handlers;

use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TTSHandler {
	private $accessToken;

	public function __construct() {
		$this->accessToken = $this->getAccessToken();
	}

	private function getAccessToken() {
		$keyFilePath = storage_path('pg-tts-390208.json');

		if (!file_exists($keyFilePath)) {
			Log::error('TTS credentials file not found.');
			return null;
		}

		$keyData = json_decode(file_get_contents($keyFilePath), true);
		$now = time();

		$payload = [
			'iss'   => $keyData['client_email'],
			'scope' => 'https://www.googleapis.com/auth/cloud-platform',
			'aud'   => 'https://oauth2.googleapis.com/token',
			'iat'   => $now,
			'exp'   => $now + 3600,
		];

		$jwt = JWT::encode($payload, $keyData['private_key'], 'RS256', $keyData['private_key_id']);

		$response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
			'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			'assertion'  => $jwt,
		]);

		return $response->json()['access_token'] ?? null;
	}

	public function synthesizeAudio($input, $voiceName, $languageCode, $ssml = false, $outputFormat = 'MP3', $sampleRate = 48000) {
		$response = Http::withToken($this->accessToken)
			->post('https://texttospeech.googleapis.com/v1/text:synthesize', [
				'input'       => $ssml ? ['ssml' => $input] : ['text' => $input],
				'voice'       => ['languageCode' => $languageCode, 'name' => $voiceName],
				'audioConfig' => ['audioEncoding' => $outputFormat, 'sampleRateHertz' => $sampleRate],
			]);

		return base64_decode($response->json()['audioContent']);
	}
}
