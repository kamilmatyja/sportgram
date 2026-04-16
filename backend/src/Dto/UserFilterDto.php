<?php

namespace App\Dto;

use App\Enum\{CountryEnum, GenderEnum};
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class UserFilterDto
{
    #[Assert\Length(min: 1, max: 64)]
    #[OA\Property(example: 'Jan')]
    public ?string $firstName = null;

    #[Assert\Length(min: 1, max: 64)]
    #[OA\Property(example: 'Kowalski')]
    public ?string $lastName = null;

    #[Assert\Choice(callback: [GenderEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public ?int $gender = null;

    #[Assert\Choice(callback: [CountryEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public ?int $country = null;
}
