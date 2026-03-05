<?php

namespace App\Controller;

use DateTimeImmutable;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class HealthController
{
    #[Route('/api/health', name: 'api_health', methods: ['GET'])]
    public function health(): JsonResponse
    {
        return new JsonResponse([
            'status' => 'ok',
            'service' => 'sportgram-api',
            'timestamp' => new DateTimeImmutable()->format(DATE_ATOM),
        ]);
    }

    #[Route('/api/ping', name: 'api_ping', methods: ['POST'])]
    public function ping(): JsonResponse
    {
        return new JsonResponse([
            'message' => 'pong',
        ]);
    }
}
