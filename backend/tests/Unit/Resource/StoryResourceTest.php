<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Entity\Story;
use App\Resource\StoryResource;
use Tests\Factory\{StoryFactory, UserFactory};

class StoryResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $story = $this->story();

        $data = StoryResource::fromEntity($story);

        $this->assertSame([
            'id' => $story->id,
            'userId' => $story->user->id,
            'createdAt' => self::formatDate($story->createdAt),
            'updatedAt' => self::formatDate($story->updatedAt),
            'text' => $story->text,
            'photo' => $story->photo,
            'status' => $story->status,
        ], $data);
        $this->assertMatchesSchema(StoryResource::class, $data);
    }

    final public function testMapsCollectionInOrder(): void
    {
        $stories = [$this->story(), $this->story()];

        $data = StoryResource::fromEntityCollection($stories);

        $this->assertSame([StoryResource::fromEntity($stories[0]), StoryResource::fromEntity($stories[1])], $data);
        $this->assertSame([], StoryResource::fromEntityCollection([]));
    }

    private function story(): Story
    {
        return self::persisted(StoryFactory::make(['user' => self::persisted(UserFactory::make())]));
    }
}
