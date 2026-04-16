<?php

namespace App\OpenApi;

use Attribute;
use OpenApi\Attributes as OA;

#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class Token extends OA\Response
{
    public function __construct()
    {
        parent::__construct(
            response: 200,
            description: 'Ok',
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: 'token',
                        type: 'string',
                        example: 'token',
                    ),
                ],
                type: 'object',
            ),
        );
    }
}
