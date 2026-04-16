<?php

namespace App\OpenApi;

use Attribute;
use OpenApi\Attributes as OA;

#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class Forbidden extends OA\Response
{
    public function __construct()
    {
        parent::__construct(
            response: 403,
            description: 'Forbidden',
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: 'error',
                        type: 'object',
                        example: [
                            'Access Denied.',
                        ],
                    ),
                ],
                type: 'object',
            ),
        );
    }
}
