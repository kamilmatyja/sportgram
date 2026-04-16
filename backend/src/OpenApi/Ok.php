<?php

namespace App\OpenApi;

use Attribute;
use OpenApi\Attributes as OA;

#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class Ok extends OA\Response
{
    public function __construct()
    {
        parent::__construct(
            response: 200,
            description: 'Ok',
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: 'id',
                        type: 'string',
                        example: 'b3b6c1e2-8e2a-4c1a-9e2a-8e2a4c1a9e2a',
                    ),
                ],
                type: 'object',
            ),
        );
    }
}
