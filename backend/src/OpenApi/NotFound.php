<?php

namespace App\OpenApi;

use Attribute;
use OpenApi\Attributes as OA;

#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class NotFound extends OA\Response
{
    public function __construct()
    {
        parent::__construct(
            response: 404,
            description: 'Not found',
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: 'error',
                        type: 'object',
                        example: [
                            'Element not found.',
                        ],
                    ),
                ],
                type: 'object',
            ),
        );
    }
}
