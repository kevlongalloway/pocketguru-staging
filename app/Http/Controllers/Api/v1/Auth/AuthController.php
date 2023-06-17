<?php

namespace App\Http\Controllers\Api\v1\Auth;

use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{

    /**
 * Register a new user and issue a token.
 *
 * @param  Illuminate\Http\Request  $request
 * @return Illuminate\Http\JsonResponse
 */
    public function register(Request $request)
{
    // Validate the incoming request data
    // $request->validate([
    //     'name' => 'required|string|max:255',
    //     'email' => 'required|string|email|max:255|unique:users',
    //     'password' => 'required|string|min:8',
    // ]);

    $validator = Validator::make($request->all(), 
	['name' => 'required|string|max:255',
         'email' => 'required|string|email|max:255|unique:users',
         'password' => 'required|string|min:8']);


    if ($validator->fails()) {
	return response()->json([
	   'error' => $validator->errors()->first()
	]);
    }
    
    // Create the new user record
    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
    ]);
    
    // Issue a token for the new user
    $token = $user->createToken('auth_token')->plainTextToken;
    
    // Return the token in JSON format
    return response()->json([
        'access_token' => $token,
        'token_type' => 'Bearer',
    ]);
}

/**
 * Log in a user and issue a token.
 *
 * @param  Illuminate\Http\Request  $request
 * @return Illuminate\Http\JsonResponse
 */
public function login(Request $request)
{
    // Validate the incoming request data
    $validator = Validator::make($request->all(), [
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if ($validator->fails()) {
	return response()->json([
	   'error' => $validator->errors()->first()
	]);
    }

    // Attempt to authenticate the user
    if (!Auth::attempt($request->only('email', 'password'))) {
        return response()->json(['error' => 'Invalid credentials'], 401);
    }
    
    // Get the authenticated user
    $user = $request->user();
    
    // Issue a token for the user
    $token = $user->createToken('auth_token')->plainTextToken;
    
    // Return the token in JSON format
    return response()->json([
        'access_token' => $token,
        'token_type' => 'Bearer',
    ]);
}

/**
 * Check if the user is authenticated.
 *
 * This endpoint can be used to verify if the user is authenticated using a Sanctum token.
 *
 * @return \Illuminate\Http\JsonResponse
 */
public function checkAuthentication(Request $request)
{
    return Auth::check();
    if (Auth::user()) {
        // User is authenticated using a Sanctum token
        // Your logic for the protected endpoint
        return response()->json(['authenticated' => 'true'], 200);
    } else {
        return response()->json(['authenticated' => 'false'], 401);
    }
}



/**
 * Log out a user by revoking their Sanctum token.
 *
 * @param  string|null  $token  The Sanctum token to revoke.
 * @return void
 *
 * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
 * @throws \Illuminate\Validation\ValidationException
 */
public function logout($token = null)
{
        if (!$token) {
            return response()->json([
                'error' => 'Token is required.',
            ]);
        }

        $personalAccessToken = PersonalAccessToken::findToken($token);

        if (!$personalAccessToken) {
	    return response()->json([
		'error' => 'Token not found.'
	    ]);
        }

        $user = $personalAccessToken->tokenable;

        // Revoke the current token
        $personalAccessToken->delete();
	return response()->json([
	    'success' => true
	]);
    }

}
