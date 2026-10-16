<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\PageParticipant;
use App\Enum\SaveStatusEnum;
use App\Repository\PageParticipantRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{PageFactory, PageParticipantFactory, UserFactory};

class PageParticipantRepositoryTest extends RepositoryTestCase
{
    private PageParticipantRepository $pageParticipantRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('page_participants', 'pages', 'users');
        $this->pageParticipantRepository = $this->repository(PageParticipantRepository::class);
    }

    final public function testSavePersistsPageParticipant(): void
    {
        $page = PageFactory::make(em: $this->em);
        $user = UserFactory::make(em: $this->em);
        $pageParticipant = PageParticipantFactory::make([
            'page' => $page,
            'user' => $user,
            'status' => SaveStatusEnum::Pending,
        ]);

        $this->pageParticipantRepository->save($pageParticipant);
        $this->clear();

        $found = $this->pageParticipantRepository->findById(self::id($pageParticipant));
        $this->assertSame(SaveStatusEnum::Pending, $found->status);
        $this->assertTrue($found->page->id->equals($page->id));
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingPageParticipant(): void
    {
        $pageParticipant = $this->pageParticipant(SaveStatusEnum::Pending);

        $pageParticipant->status = SaveStatusEnum::Accepted;
        $this->pageParticipantRepository->save($pageParticipant);
        $this->clear();

        $this->assertSame(
            SaveStatusEnum::Accepted,
            $this->pageParticipantRepository->findById(self::id($pageParticipant))->status,
        );
        $this->assertSame(1, $this->pageParticipantRepository->count());
    }

    final public function testDeleteRemovesPageParticipant(): void
    {
        $pageParticipant = $this->pageParticipant();
        $other = $this->pageParticipant();
        $id = self::id($pageParticipant);

        $this->pageParticipantRepository->delete($pageParticipant);
        $this->clear();

        $this->assertNull($this->pageParticipantRepository->find($id));
        $this->assertNotNull($this->pageParticipantRepository->find(self::id($other)));
    }

    final public function testFindByIdReturnsPageParticipant(): void
    {
        $pageParticipant = $this->pageParticipant();
        $this->pageParticipant();
        $this->clear();

        $found = $this->pageParticipantRepository->findById(self::id($pageParticipant));

        $this->assertSame((string) $pageParticipant->id, (string) $found->id);
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->pageParticipantRepository->findById(Uuid::v4());
    }

    private function pageParticipant(?SaveStatusEnum $status = null): PageParticipant
    {
        return PageParticipantFactory::make(array_filter(['status' => $status]), $this->em);
    }
}
