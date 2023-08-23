<?php

namespace App\Http\Middleware;

use Closure;

class CorsMiddleware {
	public function handle($request, Closure $next) {
		// List of allowed origins (your web app and website URLs)
		$allowedOrigins = [
			'https://demo.pocketguruai.com',
		];

		$origin = $request->header('Origin');

		if (in_array($origin, $allowedOrigins)) {
			$response = $next($request);

			$response->header('Access-Control-Allow-Origin', $origin);
			$response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
			$response->header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization');
			$response->header('Access-Control-Allow-Credentials', 'true');

			return $response;
		}

		// Return a response with an error message for unauthorized origins
		return response()->json(['message' => 'Unauthorized origin'], 403);
	}
}
