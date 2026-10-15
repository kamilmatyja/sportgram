<?php

namespace App\Validator;

use Symfony\Component\Validator\{Constraint, ConstraintValidator, Exception\UnexpectedTypeException};

class Base64StringValidator extends ConstraintValidator
{
    final public function validate($value, Constraint $constraint): void
    {
        if (! $constraint instanceof Base64String) {
            throw new UnexpectedTypeException($constraint, Base64String::class);
        }

        if (null === $value || '' === $value) {
            return;
        }

        if (base64_decode($value, true) === false) {
            $this->context->buildViolation($constraint->message)->addViolation();
        }
    }
}
