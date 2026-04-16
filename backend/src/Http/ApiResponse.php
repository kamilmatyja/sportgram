<?php

namespace App\Http;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Uid\Uuid;

class ApiResponse extends JsonResponse
{
    public static function created(Uuid $id): self
    {
        return new self(['id' => $id->toString()], self::HTTP_CREATED);
    }

    public static function error(array $errors): self
    {
        return new self(['errors' => $errors], self::HTTP_BAD_REQUEST);
    }
}
