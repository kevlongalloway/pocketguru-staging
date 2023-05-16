<?php

namespace App\Exceptions;

use Exception;
use Symfony\Component\Routing\Exception\RouteNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class RouteNotFoundHandler extends ExceptionHandler
{
   /**
    * Render an exception into an HTTP response.
    *
    * @param  \Illuminate\Http\Request  $request
    * @param  \Throwable  $exception
    * @return \Symfony\Component\HttpFoundation\Response|\Illuminate\Http\Response
    */
    public function render($request, Throwable $exception)
    {
        if ($exception instanceof RouteNotFoundException) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Unauthorized.'], 401);
            }
        }

        return parent::render($request, $exception);
    }
}
