<?php

namespace App\Service;

use App\Dto\{EntryDto, EntryIndexDto};
use App\Entity\{Entry, User};
use App\Enum\EntryTypeEnum;
use App\Repository\EntryRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;

readonly class EntryService
{
    public function __construct(
        private EntryRepository $entryRepository,
        private Security $security,
    ) {
    }

    final public function create(EntryDto $dto): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $entry = new Entry($user, Uuid::fromString($dto->entityId), EntryTypeEnum::from($dto->type));

        $this->entryRepository->save($entry);

        return $entry->id;
    }

    final public function index(EntryIndexDto $dto): array
    {
        return $this->entryRepository->findEntries($dto);
    }

    final public function details(Uuid $id): Entry
    {
        $entry = $this->entryRepository->findById($id);

        if (! $entry) {
            throw new ValidatorException('Entry not found.');
        }

        return $entry;
    }
}
