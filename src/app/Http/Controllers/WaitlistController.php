<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class WaitlistController extends Controller
{
    /**
     * Store a new email in the database.
     *
     * @param  \Illuminate\Http\Request  $request
     *         The HTTP request object containing the email to be stored.
     *
     *         The request must contain an 'email' parameter which is a
     *         valid email address and does not already exist in the 'emails'
     *         table in the database.
     *
     * @return \Illuminate\Http\JsonResponse
     *         A JSON response indicating success.
     *
     *         The response will contain a 'message' key with the value
     *         'Email saved successfully'.
     */
    public function storeEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:emails',
        ], [
            'email.unique' => 'You are already enrolled to receive updates!',
        ]);

        if ($validator->fails()) {
            return view('welcome')->withErrors($validator->errors());
        }

        // Insert the email into the database
        DB::table('emails')->insert([
            'email' => $request->email,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Return a success response
        return redirect()->route('success');
    }
}
