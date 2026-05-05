<?php

namespace App\OpenApi;

use Attribute;
use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;

#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class Item extends OA\Response
{
    public function __construct(string $class)
    {
        parent::__construct(
            response: 200,
            description: 'OK',
            content: new OA\JsonContent(
                ref: new Model(type: $class),
            ),
        );
    }
}
