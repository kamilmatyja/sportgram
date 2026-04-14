<?php

namespace App\Validator;

use Attribute;
use Symfony\Component\Validator\Constraint;

#[Attribute(Attribute::TARGET_PROPERTY | Attribute::IS_REPEATABLE)]
class UniqueUserField extends Constraint
{
    public string $message = 'This value is already used.';
    public string $field;

    public function __construct(string $field, ?string $message = null, ?array $groups = null, $payload = null)
    {
        parent::__construct([], $groups, $payload);
        $this->field = $field;
        if ($message) {
            $this->message = $message;
        }
    }

    public function getRequiredOptions(): array
    {
        return ['field'];
    }
}

