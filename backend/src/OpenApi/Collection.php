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
                properties: [
                    new OA\Property(
                        property: 'data',
                        type: 'array',
                        items: new OA\Items(
                            ref: new Model(type: $class),
                        ),
                    ),
                    new OA\Property(
                        property: 'pagination',
                        properties: [
                            new OA\Property(
                                property: 'total',
                                type: 'integer',
                                example: 125,
                            ),
                            new OA\Property(
                                property: 'page',
                                type: 'integer',
                                example: 2,
                            ),
                            new OA\Property(
                                property: 'perPage',
                                type: 'integer',
                                example: 20,
                            ),
                            new OA\Property(
                                property: 'totalPages',
                                type: 'integer',
                                example: 7,
                            ),
                            new OA\Property(
                                property: 'hasNextPage',
                                type: 'boolean',
                                example: true,
                            ),
                        ],
                        type: 'object',
                        nullable: true,
                    ),
                ],
                type: 'object',
            ),
        );
    }
}
