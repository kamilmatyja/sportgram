<?php

namespace App\Http;

use Doctrine\ORM\Tools\Pagination\WindowPage;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Uid\Uuid;

class ApiResponse extends JsonResponse
{
    public static function token(string $token): self
    {
        return new self(['token' => $token], self::HTTP_OK);
    }

    public static function elements(array $data, ?WindowPage $window = null): self
    {
        if ($window) {
            return new self(
                [
                    'data' => $data,
                    'pagination' => [
                        'total' => $window->getTotalCount(),
                        'page' => $window->getPageNumber(),
                        'perPage' => $window->getPageCount(),
                        'totalPages' => $window->getTotalCount(),
                        'hasNextPage' => $window->hasNextPage(),
                    ],
                ],
                self::HTTP_OK,
            );
        } else {
            return new self(['data' => $data], self::HTTP_OK);
        }
    }

    public static function ok(Uuid $id): self
    {
        return new self(['id' => $id], self::HTTP_OK);
    }

    public static function created(Uuid $id): self
    {
        return new self(['id' => $id], self::HTTP_CREATED);
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
