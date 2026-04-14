<?php

namespace App\Http;

use RuntimeException;
use Symfony\Component\Validator\ConstraintViolationListInterface;

class ValidationException extends RuntimeException
{
    private ConstraintViolationListInterface $violations;

    public function __construct(ConstraintViolationListInterface $violations)
    {
        parent::__construct('Validation failed');
        $this->violations = $violations;
    }

    public function getViolations(): ConstraintViolationListInterface
    {
        return $this->violations;
    }
}

