<?php

namespace App\OpenApi;

use Attribute;
use OpenApi\Attributes as OA;

#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class Item extends OA\Response
{
    public function __construct(string $class, ?array $includes = null)
    {
        $properties = [];
        foreach ($includes ?? [] as $property => $include) {
            $properties[] = new OA\Property(
                property: $property,
                description: 'Included ' . $property . ' if requested',
                type: 'array',
                items: new OA\Items(ref: '#/components/schemas/' . $include),
            );
        }

        parent::__construct(
            response: 200,
            description: 'OK',
            content: new OA\JsonContent(
                allOf: array_filter([
                    new OA\Schema(ref: '#/components/schemas/' . $class),
                    $properties ? new OA\Schema(properties: $properties) : null,
                ]),
            ),
        );
    }
}
