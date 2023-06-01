<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Auth\AuthController;
use App\Http\Controllers\ChatGptController;


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

Route::post('/chat', [ChatGptController::class, 'chat2'])->middleware('auth:sanctum');
Route::post('/guided-meditation', [ChatGptController::class, 'guidedMeditation'])->middleware('auth:sanctum');
Route::post('/positive-affirmation', [ChatGptController::class, 'providePositiveAffirmations'])->middleware('auth:sanctum');
Route::post('/breathing-exercise', [ChatGptController::class, 'provideBreathingExercises'])->middleware('auth:sanctum');
Route::get('/reset-conversation', [ChatGptController::class, 'resetHistory'])->middleware('auth:sanctum');

