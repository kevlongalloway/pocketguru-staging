<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\v1\Auth\OAuthController;
use App\Http\Controllers\Api\v1\ChatGpt\TextCompletionController;
use App\Http\Controllers\Api\v1\ChatGpt\ChatCompletionController;


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

Route::post('/chat', [ChatCompletionController::class, 'chat'])->middleware('auth:sanctum');
Route::post('/guided-meditation', [TextCompletionController::class, 'provideGuidedMeditation'])->middleware('auth:sanctum');
Route::post('/positive-affirmation', [TextCompletionController::class, 'providePositiveAffirmation'])->middleware('auth:sanctum');
Route::post('/breathing-exercise', [TextCompletionController::class, 'provideBreathingExercise'])->middleware('auth:sanctum');
Route::get('/reset-conversation', [ChatCompletionController::class, 'resetHistory'])->middleware('auth:sanctum');

