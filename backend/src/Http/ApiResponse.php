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

    public static function error(string $message, int $status = self::HTTP_BAD_REQUEST): self
    {
        return new self(['error' => $message], $status);
    }

    public static function validationErrors(iterable $errors): self
    {
        $errorMessages = [];
        foreach ($errors as $error) {
            $errorMessages[$error->getPropertyPath()][] = $error->getMessage();
        }
        return new self(['errors' => $errorMessages], self::HTTP_UNPROCESSABLE_ENTITY);
    }
}

