<?php

namespace App\Validator;

use App\Repository\UserRepository;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

class UniqueUserFieldValidator extends ConstraintValidator
{
    public function __construct(private readonly UserRepository $userRepository)
    {
    }

    final public function validate($value, Constraint $constraint): void
    {
        if (!$constraint instanceof UniqueUserField) {
            throw new UnexpectedTypeException($constraint, UniqueUserField::class);
        }
        if (null === $value || '' === $value) {
            return;
        }

        $field = $constraint->field;
        if ($field === 'phone' && !is_int($value)) {
            return;
        }

        $found = $this->userRepository->findOneBy([$field => $value]);
        if ($found) {
            $this->context->buildViolation($constraint->message)->addViolation();
        }
    }
}
