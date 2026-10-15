<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Dto\{EntryCountIndexDto, EntryDto, EntryIndexDto};
use App\Entity\{Entry, User};
use App\Enum\EntryTypeEnum;
use App\Repository\EntryRepository;
use App\Service\EntryService;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\EntryFactory;

#[AllowMockObjectsWithoutExpectations]
class EntryServiceTest extends ServiceTestCase
{
    private EntryRepository&MockObject $entryRepository;

    private User $currentUser;

    private EntryService $service;

    protected function setUp(): void
    {
        $this->entryRepository = $this->createMock(EntryRepository::class);
        $this->currentUser = self::user();

        $this->service = new EntryService($this->entryRepository, $this->security($this->currentUser));
    }

    public static function entryTypes(): iterable
    {
        foreach (EntryTypeEnum::cases() as $type) {
            yield $type->name => [$type];
        }
    }

    #[DataProvider('entryTypes')]
    final public function testCreateSavesEntryForCurrentUser(EntryTypeEnum $type): void
    {
        $dto = new EntryDto();
        $dto->entityId = Uuid::v7();
        $dto->type = $type;
        $saved = null;
        $this->entryRepository->expects($this->once())
            ->method('save')
            ->willReturnCallback(static function (Entry $entry) use (&$saved): void {
                $saved = $entry;
                self::persist()($entry);
            });

        $id = $this->service->create($dto);

        $this->assertNotNull($id);
        $this->assertSame($saved->id, $id);
        $this->assertSame($this->currentUser, $saved->user);
        $this->assertSame($dto->entityId, $saved->entityId);
        $this->assertSame($type, $saved->type);
    }

    final public function testIndexDelegatesToRepository(): void
    {
        $dto = new EntryIndexDto();
        $window = self::window([self::entity(EntryFactory::make())]);
        $this->entryRepository->expects($this->once())->method('findEntries')->with($dto)->willReturn($window);

        $this->assertSame($window, $this->service->index($dto));
    }

    final public function testIndexCountDelegatesToRepository(): void
    {
        $dto = new EntryCountIndexDto();
        $window = self::window([['entityId' => Uuid::v7(), 'count' => 3]]);
        $this->entryRepository->expects($this->once())->method('findCountEntries')->with($dto)->willReturn($window);

        $this->assertSame($window, $this->service->indexCount($dto));
    }

    final public function testDetails(): void
    {
        $entry = self::entity(EntryFactory::make());
        $this->entryRepository->expects($this->once())->method('findById')->with($entry->id)->willReturn($entry);

        $this->assertSame($entry, $this->service->details($entry->id));
    }

    final public function testDetailsPropagatesNotFound(): void
    {
        $this->entryRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());

        $this->expectException(NotFoundHttpException::class);

        $this->service->details(Uuid::v7());
    }
}
