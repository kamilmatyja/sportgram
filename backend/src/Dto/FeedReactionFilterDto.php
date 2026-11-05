<?php

namespace App\Dto;

use App\Entity\{Feed, User};
use App\Enum\{ElementStatusEnum, FeedReactionEnum};
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    properties: [
        new OA\Property(
            property: 'userId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
            nullable: true,
        ),
        new OA\Property(
            property: 'feedId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
            nullable: true,
        ),
        new OA\Property(property: 'reaction', type: 'integer', example: 1, nullable: true),
        new OA\Property(property: 'status', type: 'integer', example: 1, nullable: true),
    ],
    type: 'object',
)]
class FeedReactionFilterDto
{
    #[Assert\Uuid]
    #[EntityExistsField(entity: User::class)]
    public ?Uuid $userId = null;

    #[Assert\Uuid]
    #[EntityExistsField(entity: Feed::class)]
    public ?Uuid $feedId = null;

    #[Assert\Choice(callback: [FeedReactionEnum::class, 'cases'])]
    public ?FeedReactionEnum $reaction = null;

    #[Assert\Choice(callback: [ElementStatusEnum::class, 'cases'])]
    public ?ElementStatusEnum $status = null;
}
