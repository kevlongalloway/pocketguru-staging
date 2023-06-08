<?php

use App\Http\Controllers\OAuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WaitlistController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Route::get('/subscribed', function () {
    return view('success');
})->name('success');

Route::post('/subscribe',[WaitlistController::class, 'storeEmail'])->name('store_email')->middleware('throttle:3');


// Google Authentication Routes
Route::get('/auth/google', [OAuthController::class, 'redirectToGoogle'])->name('auth.google.redirect');
Route::get('/auth/google/callback', [OAuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');

// Apple Authentication Routes
Route::get('/auth/apple', [OAuthController::class, 'redirectToApple'])->name('auth.apple.redirect');
Route::get('/auth/apple/callback', [OAuthController::class, 'handleAppleCallback'])->name('auth.apple.callback');

