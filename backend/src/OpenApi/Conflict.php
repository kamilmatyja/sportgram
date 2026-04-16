<?php

namespace App\OpenApi;

use Attribute;
use OpenApi\Attributes as OA;

#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class Conflict extends OA\Response
{
    public function __construct()
    {
        parent::__construct(
            response: 409,
            description: 'Conflict',
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: 'error',
                        type: 'object',
                        example: [
                            'User is banned.',
                        ],
                    ),
                ],
                type: 'object',
            ),
        );
    }
}
