<?php

namespace App\Dto;

use App\Entity\{Page, User};
use App\Enum\{ColorEnum};
use App\Validator\{Base64String, EntityExistsField, UniqueField};
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'PageDto',
    required: ['title', 'description', 'link', 'profilePhoto', 'backgroundPhoto', 'color'],
    properties: [
        new OA\Property(property: 'title', type: 'string', example: 'Page title'),
        new OA\Property(property: 'description', type: 'string', example: 'Page description'),
        new OA\Property(property: 'link', type: 'string', example: 'my-link'),
        new OA\Property(property: 'profilePhoto', type: 'string', example: 'base64string'),
        new OA\Property(property: 'backgroundPhoto', type: 'string', example: 'base64string'),
        new OA\Property(property: 'color', type: 'integer', example: 1),
        new OA\Property(
            property: 'participants',
            type: 'array',
            items: new OA\Items(type: 'string', format: 'uuid'),
            example: ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'],
            nullable: true,
        ),
    ],
    type: 'object',
)]
class PageDto
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 256)]
    public string $title;

    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 2048)]
    public string $description;

    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 64)]
    #[Assert\Regex(pattern: '/^[a-zA-Z0-9-]+$/')]
    #[UniqueField(entity: Page::class, field: 'link')]
    public string $link;

    #[Assert\NotBlank]
    #[Base64String]
    public string $profilePhoto;

    #[Assert\NotBlank]
    #[Base64String]
    public string $backgroundPhoto;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [ColorEnum::class, 'values'])]
    public int $color;

    /** @var string[] */
    #[Assert\All([
        new Assert\NotBlank(),
        new Assert\Uuid(),
        new EntityExistsField(entity: User::class),
    ])]
    #[Assert\Count(min: 1)]
    #[Assert\Unique]
    public array $participants = [];
}
