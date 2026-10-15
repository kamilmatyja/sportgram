<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Resource\PageParticipantResource;
use Tests\Factory\{PageFactory, PageParticipantFactory, UserFactory};

class PageParticipantResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $participant = self::persisted(PageParticipantFactory::make([
            'page' => self::persisted(PageFactory::make()),
            'user' => self::persisted(UserFactory::make()),
        ]));

        $data = PageParticipantResource::fromEntity($participant);

        $this->assertSame([
            'id' => $participant->id,
            'pageId' => $participant->page->id,
            'userId' => $participant->user->id,
            'createdAt' => self::formatDate($participant->createdAt),
            'updatedAt' => self::formatDate($participant->updatedAt),
            'status' => $participant->status,
        ], $data);
        $this->assertMatchesSchema(PageParticipantResource::class, $data);
    }
}
