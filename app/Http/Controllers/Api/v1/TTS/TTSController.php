<?php

namespace App\Http\Controllers\Api\v1\TTS;

use App\Handlers\TTSHandler;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class TTSController extends Controller {
	private $ttsHandler;

	public function __construct(TTSHandler $ttsHandler) {
		$this->ttsHandler = $ttsHandler;
	}

	public function synthesize(Request $request) {
		$input = $request->input('input');
		$voiceName = $request->input('en-US-Standard-I');
		$ssml = $request->input('ssml', false);
		$outputFormat = $request->input('output_format', 'MP3');
		$sampleRate = $request->input('sample_rate', 48000);
		$languageCode = $request->input('language_code', 'en');

		// Add validation and error handling as needed

		// Call the TTSHandler to synthesize the audio
		$audioContent = $this->ttsHandler->synthesizeAudio($input, $voiceName, $languageCode, $ssml, $outputFormat, $sampleRate);

		// Return the API response as-is or modify it as needed
		return Response::make($audioContent, 200, [
			'Content-Type' => 'audio/mpeg',
			'Content-Disposition' => 'inline; filename="audio.mp3"',
		]);
	}
}
