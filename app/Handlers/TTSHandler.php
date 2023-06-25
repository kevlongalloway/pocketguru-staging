<?php

namespace App\Handlers;

use Google\Cloud\TextToSpeech\V1\AudioConfig;
use Google\Cloud\TextToSpeech\V1\AudioEncoding;
use Google\Cloud\TextToSpeech\V1\SynthesisInput;
use Google\Cloud\TextToSpeech\V1\TextToSpeechClient;
use Google\Cloud\TextToSpeech\V1\VoiceSelectionParams;
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

	public function synthesizeAudio($input, $voiceName, $languageCode, $ssml = false, $outputFormat = 'MP3', $sampleRate = 48000) {
		$textToSpeechClient = new TextToSpeechClient();

		$textInput = new SynthesisInput();
		$textInput->setText($input);

		$voice = new VoiceSelectionParams();
		$voice->setName($voiceName);
		$voice->setLanguageCode($languageCode);

		$audioConfig = new AudioConfig();
		$audioConfig->setAudioEncoding(AudioEncoding::MP3);
		$audioConfig->setSampleRateHertz($sampleRate);

		$resp = $textToSpeechClient->synthesizeSpeech($textInput, $voice, $audioConfig);
		$audioContent = $resp->getAudioContent();

		$textToSpeechClient->close();

		return Response::make($audioContent, 200, [
			'Content-Type' => 'audio/mpeg',
			'Content-Disposition' => 'inline; filename="audio.mp3"',
		]);
	}
}
