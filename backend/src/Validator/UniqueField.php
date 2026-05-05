<?php

namespace App\Validator;

use Attribute;
use Symfony\Component\Validator\Constraint;

#[Attribute(Attribute::TARGET_PROPERTY | Attribute::IS_REPEATABLE)]
class UniqueField extends Constraint
{
    public string $message = 'This value is already used.';

    public function __construct(
        public string $entity,
        public string $field,
        ?string $message = null,
        ?array $groups = null,
        $payload = null,
    ) {
        parent::__construct([], $groups, $payload);

        if ($message) {
            $this->message = $message;
        }
    }

    /** @return string[] */
    final public function getRequiredOptions(): array
    {
        return ['entity', 'field'];
    }
}
