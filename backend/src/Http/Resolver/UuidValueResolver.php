<?php

namespace App\Http\Resolver;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Controller\ValueResolverInterface;
use Symfony\Component\HttpKernel\ControllerMetadata\ArgumentMetadata;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;

class UuidValueResolver implements ValueResolverInterface
{
    public function resolve(Request $request, ArgumentMetadata $argument): iterable
    {
        if ($argument->getType() !== Uuid::class) {
            return [];
        }

        $value = $request->attributes->get($argument->getName());

        if (! $value || ! Uuid::isValid($value)) {
            throw new ValidatorException('Invalid UUID');
        }

        yield Uuid::fromString($value);
    }
}
