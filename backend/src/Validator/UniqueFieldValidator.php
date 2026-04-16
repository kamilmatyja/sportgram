<?php

namespace App\Validator;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\{Constraint, ConstraintValidator};
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

class UniqueFieldValidator extends ConstraintValidator
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    public function validate($value, Constraint $constraint): void
    {
        if (! $constraint instanceof UniqueField) {
            throw new UnexpectedTypeException($constraint, UniqueField::class);
        }

        if ($value === null || $value === '') {
            return;
        }

        $repo = $this->em->getRepository($constraint->entity);

        $found = $repo->findOneBy([
            $constraint->field => $value,
        ]);

        if ($found) {
            $this->context
                ->buildViolation($constraint->message)
                ->addViolation();
        }
    }
}
