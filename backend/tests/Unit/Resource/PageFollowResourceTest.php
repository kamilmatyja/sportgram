<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Entity\PageFollow;
use App\Resource\PageFollowResource;
use Tests\Factory\{PageFactory, PageFollowFactory, UserFactory};

class PageFollowResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $pageFollow = $this->pageFollow();

        $data = PageFollowResource::fromEntity($pageFollow);

        $this->assertSame([
            'id' => $pageFollow->id,
            'pageId' => $pageFollow->page->id,
            'userId' => $pageFollow->user->id,
            'createdAt' => self::formatDate($pageFollow->createdAt),
            'updatedAt' => self::formatDate($pageFollow->updatedAt),
            'status' => $pageFollow->status,
        ], $data);
        $this->assertMatchesSchema(PageFollowResource::class, $data);
    }

    final public function testMapsCollectionInOrder(): void
    {
        $pageFollows = [$this->pageFollow(), $this->pageFollow()];

        $data = PageFollowResource::fromEntityCollection($pageFollows);

        $this->assertSame(
            [PageFollowResource::fromEntity($pageFollows[0]), PageFollowResource::fromEntity($pageFollows[1])],
            $data,
        );
        $this->assertSame([], PageFollowResource::fromEntityCollection([]));
    }

    private function pageFollow(): PageFollow
    {
        return self::persisted(PageFollowFactory::make([
            'page' => self::persisted(PageFactory::make()),
            'user' => self::persisted(UserFactory::make()),
        ]));
    }
}
