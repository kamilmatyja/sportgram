<?php

namespace App\Validator;

use Attribute;
use Symfony\Component\Validator\Constraint;

#[Attribute(Attribute::TARGET_PROPERTY | Attribute::IS_REPEATABLE)]
class EntryEntityExists extends Constraint
{
    public string $message = 'Entity for type {{ type }} and id {{ entityId }} does not exist.';

    final public function validatedBy(): string
    {
        return EntryEntityExistsValidator::class;
    }
}
