<?php

namespace App\Http\Controllers\Api\v1\TTS;

use App\Handlers\TTSHandler;
use Illuminate\Http\Request;

class TTSController extends Controller {
	private $ttsHandler;

	public function __construct(TTSHandler $ttsHandler) {
		$jsonFilePath = storage_path('pg-tts-390208.json');
		$jsonFileContents = File::get($jsonFilePath);
		$json = json_decode($jsonFileContents, true);

		$apiKey = $json['private_key'];
		$this->ttsHandler = new TTSHandler($apiKey);
		$this->ttsHandler = $ttsHandler;
	}

	public function synthesize(Request $request) {
		$voiceName = $request->input('en-US-Standard-H');
		$ssml = $request->input('ssml', false);
		$outputFormat = $request->input('output_format', 'MP3');
		$sampleRate = $request->input('sample_rate', 48000);

		// Add validation and error handling as needed

		// Call the TTSHandler to synthesize the audio
		$response = $this->ttsHandler->synthesizeAudio($input, $voiceName, $ssml, $outputFormat, $sampleRate);

		// Return the API response as-is or modify it as needed
		return response()->json($response);
	}
}
