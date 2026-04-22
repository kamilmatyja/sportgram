<?php

namespace App\Validator;

use Attribute;
use Symfony\Component\Validator\Constraint;

#[Attribute(Attribute::TARGET_PROPERTY | Attribute::IS_REPEATABLE)]
class EntityExistsField extends Constraint
{
    public string $message = '{{ entity }} not found.';

    public function __construct(
        public string $entity,
        ?string $message = null,
        ?array $groups = null,
        $payload = null,
    ) {
        parent::__construct([], $groups, $payload);

        if ($message) {
            $this->message = $message;
        }
    }
}
