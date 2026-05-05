<?php

namespace App\Resource;

use App\Dto\PageDetailsQueryDto;
use App\Entity\{Page, PageFollow, PageParticipant};
use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'createdAt',
        'updatedAt',
        'title',
        'description',
        'link',
        'profilePhoto',
        'backgroundPhoto',
        'color',
        'status',
    ],
    properties: [
        new OA\Property(
            property: 'Id',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'title', type: 'string', example: 'Page title'),
        new OA\Property(property: 'description', type: 'string', example: 'Page description'),
        new OA\Property(property: 'link', type: 'string', example: 'my-link'),
        new OA\Property(property: 'profilePhoto', type: 'string', example: 'base64string'),
        new OA\Property(property: 'backgroundPhoto', type: 'string', example: 'base64string'),
        new OA\Property(property: 'color', type: 'integer', example: 1),
        new OA\Property(property: 'status', type: 'integer', example: 1),
        new OA\Property(
            property: 'follows',
            type: 'array',
            items: new OA\Items(ref: new Model(type: PageFollowResource::class)),
        ),
        new OA\Property(
            property: 'participants',
            type: 'array',
            items: new OA\Items(ref: new Model(type: PageParticipantResource::class)),
        ),
    ],
    type: 'object',
)]
class PageResource
{
    public static function fromEntity(Page $page, ?PageDetailsQueryDto $dto = null): array
    {
        $data = [
            'id' => $page->id->toString(),
            'createdAt' => $page->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $page->updatedAt->format('Y-m-d\TH:i:s'),
            'title' => $page->title,
            'description' => $page->description,
            'profilePhoto' => $page->profilePhoto,
            'backgroundPhoto' => $page->backgroundPhoto,
            'color' => $page->color->value,
            'status' => $page->status->value,
        ];

        if ($dto && in_array($dto::PAGE_FOLLOWS, $dto->include)) {
            $data['follows'] = array_map(
                fn (PageFollow $follow) => PageFollowResource::fromEntity($follow),
                $page->follows->toArray(),
            );
        }

        if ($dto && in_array($dto::PAGE_PARTICIPANTS, $dto->include)) {
            $data['participants'] = array_map(
                fn (PageParticipant $participant) => PageParticipantResource::fromEntity($participant),
                $page->participants->toArray(),
            );
        }

        return $data;
    }

    /** @param Page[] $pages */
    public static function fromEntityCollection(array $pages): array
    {
        return array_map(fn (Page $page) => self::fromEntity($page), $pages);
    }
}
