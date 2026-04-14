<?php

namespace App\Http;

use Symfony\Component\Validator\ConstraintViolationListInterface;

class ValidationHelper
{
    public static function throwOnErrors(ConstraintViolationListInterface $errors): void
    {
        if (count($errors) > 0) {
            throw new ValidationException($errors);
        }
    }
}

