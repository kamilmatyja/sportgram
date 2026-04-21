<?php

namespace App\Dto;

use App\Entity\Page;
use App\Enum\{ColorEnum};
use App\Validator\{Base64String, UniqueField};
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'PageDto')]
class PageDto
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 256)]
    #[OA\Property(example: 'Tytuł strony')]
    public string $title;

    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 2048)]
    #[OA\Property(example: 'Opis strony')]
    public string $description;

    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 64)]
    #[Assert\Regex(pattern: '/^[a-zA-Z0-9-]+$/')]
    #[UniqueField(entity: Page::class, field: 'link')]
    #[OA\Property(example: 'my-link')]
    public string $link;

    #[Assert\NotBlank]
    #[Base64String]
    #[OA\Property(example: 'base64string')]
    public string $profilePhoto;

    #[Assert\NotBlank]
    #[Base64String]
    #[OA\Property(example: 'base64string')]
    public string $backgroundPhoto;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [ColorEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public int $color;
}
