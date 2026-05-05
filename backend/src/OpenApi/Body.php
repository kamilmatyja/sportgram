<?php

namespace App\OpenApi;

use Attribute;
use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;

#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class Body extends OA\RequestBody
{
    public function __construct(string $class)
    {
        parent::__construct(
            required: true,
            content: new OA\JsonContent(ref: new Model(type: $class)),
        );
    }
}
