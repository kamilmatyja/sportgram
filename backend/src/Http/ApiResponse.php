<?php

namespace App\Http;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Uid\Uuid;

class ApiResponse extends JsonResponse
{
    public static function token(string $token): self
    {
        return new self(['token' => $token], self::HTTP_OK);
    }

    public static function updated(Uuid $id): self
    {
        return new self(['id' => $id->toString()], self::HTTP_OK);
    }

    public static function created(Uuid $id): self
    {
        return new self(['id' => $id->toString()], self::HTTP_CREATED);
    }

    public static function error(string $error, int $status): self
    {
        if ($status < 100 || $status > 511) {
            $status = self::HTTP_INTERNAL_SERVER_ERROR;
        }

        return new self(['errors' => $error], $status);
    }

    public static function badRequest(array $errors): self
    {
        return new self(['errors' => $errors], self::HTTP_BAD_REQUEST);
    }

    public static function unauthorized(string $error): self
    {
        return new self(['error' => $error], self::HTTP_UNAUTHORIZED);
    }

    public static function forbidden(string $error): self
    {
        return new self(['error' => $error], self::HTTP_FORBIDDEN);
    }

    public static function notFound(string $error): self
    {
        return new self(['error' => $error], self::HTTP_NOT_FOUND);
    }

    public static function conflict(string $error): self
    {
        return new self(['error' => $error], self::HTTP_CONFLICT);
    }
}
