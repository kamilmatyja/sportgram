<?php

namespace App\OpenApi;

use Attribute;
use OpenApi\Attributes as OA;

#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class BadRequest extends OA\Response
{
    public function __construct()
    {
        parent::__construct(
            response: 400,
            description: 'Bad request',
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: 'errors',
                        type: 'object',
                        example: [
                            'email' => ['This value is already used.'],
                            'password' => ['This value is too short.'],
                        ],
                    ),
                ],
                type: 'object',
            ),
        );
    }
}
