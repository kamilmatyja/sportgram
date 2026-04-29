<?php

namespace App\Validator;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Validator\{Constraint, ConstraintValidator};
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

class UniqueFieldValidator extends ConstraintValidator
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly RequestStack $requestStack,
    ) {
    }

    final public function validate($value, Constraint $constraint): void
    {
        if (! $constraint instanceof UniqueField) {
            throw new UnexpectedTypeException($constraint, UniqueField::class);
        }

        if ($value === null || $value === '') {
            return;
        }

        $repo = $this->em->getRepository($constraint->entity);
        $criteria = [$constraint->field => $value];

        $found = $repo->findOneBy($criteria);

        $request = $this->requestStack->getCurrentRequest();
        $excludeId = $request?->attributes->get('id');

        if ($found) {
            if ($excludeId && property_exists($found, 'id') && (string)$found->id === (string)$excludeId) {
                return;
            }

            $this->context
                ->buildViolation($constraint->message)
                ->addViolation();
        }
    }
}
