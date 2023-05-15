<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WaitlistController;
use App\Http\Controllers\Api\v1\Auth\AuthController;

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

Route::post('/subscribe',[WaitlistController::class, 'storeEmail'])->name('store_email');

Route::post('register', [AuthController::class, 'register']);

Route::post('test', function () {
	return response()->json(['message' => 'success']);

});
