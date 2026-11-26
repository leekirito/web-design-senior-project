<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            DB::select('select 1');
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'status' => 'error',
                'database' => 'disconnected',
            ], 503);
        }

        return response()->json([
            'status' => 'ok',
            'database' => 'connected',
        ]);
    }
}
