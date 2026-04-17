<?php

namespace App\OpenApi;

use Attribute;
use OpenApi\Attributes as OA;

#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class Includes extends OA\Parameter
{
    public function __construct(array $includes)
    {
        parent::__construct(
            name: 'include',
            description: 'Include related entities',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'string', enum: $includes),
        );
    }
}
