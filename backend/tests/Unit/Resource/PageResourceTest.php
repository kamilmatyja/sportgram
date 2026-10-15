<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Dto\PageDetailsQueryDto;
use App\Entity\Page;
use App\Resource\{PageFollowResource, PageParticipantResource, PageResource};
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Factory\{PageFactory, PageFollowFactory, PageParticipantFactory, UserFactory};

class PageResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $page = $this->page();

        $data = PageResource::fromEntity($page);

        $this->assertSame([
            'id' => $page->id,
            'userId' => $page->user->id,
            'createdAt' => self::formatDate($page->createdAt),
            'updatedAt' => self::formatDate($page->updatedAt),
            'title' => $page->title,
            'description' => $page->description,
            'link' => $page->link,
            'profilePhoto' => $page->profilePhoto,
            'backgroundPhoto' => $page->backgroundPhoto,
            'color' => $page->color,
            'status' => $page->status,
        ], $data);
        $this->assertMatchesSchema(PageResource::class, $data);
    }

    final public function testEmptyIncludeAddsNoRelations(): void
    {
        $data = PageResource::fromEntity($this->pageWithRelations(), new PageDetailsQueryDto());

        $this->assertArrayNotHasKey('follows', $data);
        $this->assertArrayNotHasKey('participants', $data);
    }

    #[DataProvider('includeProvider')]
    final public function testIncludesRequestedRelations(array $include, bool $follows, bool $participants): void
    {
        $page = $this->pageWithRelations();
        $dto = new PageDetailsQueryDto();
        $dto->include = $include;

        $data = PageResource::fromEntity($page, $dto);

        if ($follows) {
            $this->assertSame(array_map(PageFollowResource::fromEntity(...), $page->follows->toArray()), $data['follows']);
        } else {
            $this->assertArrayNotHasKey('follows', $data);
        }

        if ($participants) {
            $this->assertSame(
                array_map(PageParticipantResource::fromEntity(...), $page->participants->toArray()),
                $data['participants'],
            );
        } else {
            $this->assertArrayNotHasKey('participants', $data);
        }

        $this->assertMatchesSchema(PageResource::class, $data);
    }

    public static function includeProvider(): iterable
    {
        yield 'follows' => [[PageDetailsQueryDto::PAGE_FOLLOWS], true, false];
        yield 'participants' => [[PageDetailsQueryDto::PAGE_PARTICIPANTS], false, true];
        yield 'both' => [[PageDetailsQueryDto::PAGE_FOLLOWS, PageDetailsQueryDto::PAGE_PARTICIPANTS], true, true];
    }

    final public function testIncludedRelationsMayBeEmpty(): void
    {
        $dto = new PageDetailsQueryDto();
        $dto->include = [PageDetailsQueryDto::PAGE_FOLLOWS, PageDetailsQueryDto::PAGE_PARTICIPANTS];

        $data = PageResource::fromEntity($this->page(), $dto);

        $this->assertSame([], $data['follows']);
        $this->assertSame([], $data['participants']);
    }

    final public function testMapsCollectionInOrder(): void
    {
        $pages = [$this->page(), $this->page()];

        $data = PageResource::fromEntityCollection($pages);

        $this->assertSame([PageResource::fromEntity($pages[0]), PageResource::fromEntity($pages[1])], $data);
        $this->assertSame([], PageResource::fromEntityCollection([]));
    }

    final public function testCollectionPassesDtoToEachItem(): void
    {
        $dto = new PageDetailsQueryDto();
        $dto->include = [PageDetailsQueryDto::PAGE_PARTICIPANTS];
        $pages = [$this->pageWithRelations(), $this->pageWithRelations()];

        $data = PageResource::fromEntityCollection($pages, $dto);

        $this->assertSame([PageResource::fromEntity($pages[0], $dto), PageResource::fromEntity($pages[1], $dto)], $data);
        $this->assertArrayHasKey('participants', $data[1]);
        $this->assertArrayNotHasKey('follows', $data[1]);
    }

    private function page(): Page
    {
        return self::persisted(PageFactory::make(['user' => self::persisted(UserFactory::make())]));
    }

    private function pageWithRelations(): Page
    {
        $page = $this->page();
        $page->follows->add(self::persisted(PageFollowFactory::make([
            'page' => $page,
            'user' => self::persisted(UserFactory::make()),
        ])));
        $page->follows->add(self::persisted(PageFollowFactory::make([
            'page' => $page,
            'user' => self::persisted(UserFactory::make()),
        ])));
        $page->participants->add(self::persisted(PageParticipantFactory::make([
            'page' => $page,
            'user' => self::persisted(UserFactory::make()),
        ])));

        return $page;
    }
}
