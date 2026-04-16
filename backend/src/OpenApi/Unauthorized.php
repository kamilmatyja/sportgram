<?php

namespace App\OpenApi;

use Attribute;
use OpenApi\Attributes as OA;

#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class Unauthorized extends OA\Response
{
    public function __construct()
    {
        parent::__construct(
            response: 401,
            description: 'Unauthorized',
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: 'error',
                        type: 'object',
                        example: [
                            'Authentication required.',
                        ],
                    ),
                ],
                type: 'object',
            ),
        );
    }
}
