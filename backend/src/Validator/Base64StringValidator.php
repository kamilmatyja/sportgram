<?php

namespace App\Validator;

use Symfony\Component\Validator\{Constraint, ConstraintValidator};

class Base64StringValidator extends ConstraintValidator
{
    final public function validate($value, Constraint $constraint): void
    {
        if (null === $value || '' === $value) {
            return;
        }

        if (base64_decode($value, true) === false) {
            $this->context->buildViolation($constraint->message)->addViolation();
        }
    }
}
