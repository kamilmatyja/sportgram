<?php

namespace App\Validator;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\{Constraint, ConstraintValidator};
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

class EntityExistsFieldValidator extends ConstraintValidator
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    final public function validate($value, Constraint $constraint): void
    {
        if (! $constraint instanceof EntityExistsField) {
            throw new UnexpectedTypeException($constraint, EntityExistsField::class);
        }

        if ($value === null || $value === '') {
            return;
        }

        $repo = $this->em->getRepository($constraint->entity);

        $found = $repo->find($value);

        if (! $found) {
            $this->context
                ->buildViolation($constraint->message)
                ->addViolation();
        }
    }
}
