<?php

namespace App\OpenApi;

use Attribute;
use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;

#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class Collection extends OA\Response
{
    public function __construct(string $class)
    {
        parent::__construct(
            response: 200,
            description: 'OK',
            content: new OA\JsonContent(
                type: 'array',
                items: new OA\Items(ref: new Model(type: $class)),
            ),
        );
    }
}
