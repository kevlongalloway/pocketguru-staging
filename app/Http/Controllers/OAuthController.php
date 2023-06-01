<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;

class OAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     *
     * @return \Symfony\Component\HttpFoundation\RedirectResponse
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Obtain the user information from Google.
     *
     * @param  Request  $request
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\RedirectResponse
     */
    public function handleGoogleCallback(Request $request)
    {
        $user = Socialite::driver('google')->user();

        // Check if the user exists in your database
        $existingUser = User::where('email', $user->email)->first();

        if ($existingUser) {
            // Log in the existing user
            $token = $existingUser->createToken('GoogleToken')->plainTextToken;
        } else {
            // Create a new user record
            $newUser = User::create([
                'name' => $user->name,
                'email' => $user->email,
                // Additional fields as per your user table structure
            ]);

            // Log in the newly created user
            $token = $newUser->createToken('GoogleToken')->plainTextToken;
        }

        if ($request->expectsJson()) {
            return response()->json(['token' => $token]);
        }

        return redirect()->route('home');
    }

    /**
     * Redirect the user to the Apple authentication page.
     *
     * @return \Symfony\Component\HttpFoundation\RedirectResponse
     */
    public function redirectToApple()
    {
        return Socialite::driver('apple')->redirect();
    }

    /**
     * Obtain the user information from Apple.
     *
     * @param  Request  $request
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\RedirectResponse
     */
    public function handleAppleCallback(Request $request)
    {
        $user = Socialite::driver('apple')->user();

        // Check if the user exists in your database
        $existingUser = User::where('email', $user->email)->first();

        if ($existingUser) {
            // Log in the existing user
            $token = $existingUser->createToken('AppleToken')->plainTextToken;
        } else {
            // Create a new user record
            $newUser = User::create([
                'name' => $user->name,
                'email' => $user->email,
                // Additional fields as per your user table structure
            ]);

            // Log in the newly created user
            $token = $newUser->createToken('AppleToken')->plainTextToken;
        }

        if ($request->expectsJson()) {
            return response()->json(['token' => $token]);
        }

        return redirect()->route('home');
    }
}

