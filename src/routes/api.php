<?php

use App\Http\Controllers\Api\v1\AnswerController;
use App\Http\Controllers\Api\v1\Auth\AuthController;
use App\Http\Controllers\Api\v1\ChatGpt\ChatCompletionController;
use App\Http\Controllers\Api\v1\ChatGpt\ChatGptTestingController;
use App\Http\Controllers\Api\v1\ChatGpt\TextCompletionController;
use App\Http\Controllers\Api\v1\QuestionController;
use App\Http\Controllers\Api\v1\TTS\TTSController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
 */

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
	return $request->user();
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/logout/{token}', [AuthController::class, 'logout']);
Route::get('/check-authentication', [AuthController::class, 'checkAuthentication'])->middleware('auth:sanctum');

Route::get('/chat', [ChatCompletionController::class, 'index'])->middleware('auth:sanctum');
Route::post('/chat', [ChatCompletionController::class, 'chat'])->middleware('auth:sanctum');
Route::post('/guided-meditation', [TextCompletionController::class, 'provideGuidedMeditation'])->middleware('auth:sanctum');
Route::post('/test-system-message', [ChatGptTestingController::class, 'testSystemMessage'])->middleware('auth:sanctum');
Route::post('/positive-affirmation', [TextCompletionController::class, 'providePositiveAffirmation'])->middleware('auth:sanctum');
Route::post('/breathing-exercise', [TextCompletionController::class, 'provideBreathingExercise'])->middleware('auth:sanctum');
Route::get('/reset-conversation', [ChatCompletionController::class, 'resetHistory'])->middleware('auth:sanctum');
Route::get('questionaire-completed', [QuestionController::class, 'checkQuestionaireCompleted'])->middleware('auth:sanctum');

Route::post('/v1/answers', [AnswerController::class, 'storeUserAnswers'])->middleware('auth:sanctum');

Route::get('/questions', [QuestionController::class, 'index']);

Route::post('/tts', [TTSController::class, 'synthesize']);
