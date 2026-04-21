<?php

namespace App\Service;

use App\Dto\{ElementStatusDto,
    PageDetailsQueryDto,
    PageDto,
    PageFollowIndexDto,
    PageFollowStatusDto,
    PageIndexDto,
    SaveStatusDto};
use App\Entity\{Page, PageFollow, User};
use App\Enum\{ColorEnum, ElementStatusEnum, PageFollowStatusEnum, SaveStatusEnum};
use App\Repository\{PageFollowRepository, PageParticipantRepository, PageRepository};
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;

readonly class PageService
{
    public function __construct(
        private PageRepository $pageRepository,
        private PageParticipantRepository $pageParticipantRepository,
        private PageFollowRepository $pageFollowRepository,
        private Security $security,
    ) {
    }

    final public function create(PageDto $dto): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $page = new Page(
            $user,
            $dto->title,
            $dto->description,
            $dto->link,
            base64_decode($dto->profilePhoto, true),
            base64_decode($dto->backgroundPhoto, true),
            ColorEnum::from($dto->color),
            ElementStatusEnum::Active,
        );

        $this->pageRepository->save($page);

        return $page->id;
    }

    final public function update(Uuid $pageId, PageDto $dto): Uuid
    {
        $page = $this->pageRepository->findById($pageId);

        if (! $page) {
            throw new ValidatorException('Page not found.');
        }

        $page->title = $dto->title;
        $page->description = $dto->description;
        $page->link = $dto->link;
        $page->profilePhoto = base64_decode($dto->profilePhoto, true);
        $page->backgroundPhoto = base64_decode($dto->backgroundPhoto, true);
        $page->color = ColorEnum::from($dto->color);
        $this->pageRepository->save($page);

        return $page->id;
    }

    final public function updateStatus(Uuid $pageId, ElementStatusDto $dto): Uuid
    {
        $page = $this->pageRepository->findById($pageId);

        if (! $page) {
            throw new ValidatorException('Page not found.');
        }

        $page->status = ElementStatusEnum::from($dto->status);
        $this->pageRepository->save($page);

        return $page->id;
    }

    final public function delete(Uuid $pageId): Uuid
    {
        $page = $this->pageRepository->findById($pageId);

        if (! $page) {
            throw new ValidatorException('Page not found.');
        }

        $page->softDelete();
        $this->pageRepository->save($page);

        return $page->id;
    }

    final public function index(PageIndexDto $dto): array
    {
        return $this->pageRepository->findPages($dto);
    }

    final public function details(Uuid $pageId, PageDetailsQueryDto $dto): Page
    {
        if (in_array($dto::PAGE_FOLLOWS, $dto->include) && in_array($dto::PAGE_PARTICIPANTS, $dto->include)) {
            return $this->pageRepository->findWithFollowsAndParticipants($pageId);
        } elseif (in_array($dto::PAGE_FOLLOWS, $dto->include)) {
            $page = $this->pageRepository->findWithFollows($pageId);
        } elseif (in_array($dto::PAGE_PARTICIPANTS, $dto->include)) {
            $page = $this->pageRepository->findWithParticipants($pageId);
        } else {
            $page = $this->pageRepository->findById($pageId);
        }

        if (! $page) {
            throw new ValidatorException('Page not found.');
        }

        return $page;
    }

    final public function updateParticipantStatus(Uuid $pageParticipantId, SaveStatusDto $dto): Uuid
    {
        $pageParticipant = $this->pageParticipantRepository->findById($pageParticipantId);

        if (! $pageParticipant) {
            throw new ValidatorException('Page participant not found.');
        }

        $pageParticipant->status = SaveStatusEnum::from($dto->status);
        $this->pageParticipantRepository->save($pageParticipant);

        return $pageParticipant->id;
    }

    final public function createFollow(Uuid $pageId, PageFollowStatusDto $dto): Uuid
    {
        $page = $this->pageRepository->findById($pageId);

        if (! $page) {
            throw new ValidatorException('Page not found.');
        }

        /** @var User $user */
        $user = $this->security->getUser();

        $pageFollow = new PageFollow($page, $user, PageFollowStatusEnum::from($dto->status));

        $this->pageFollowRepository->save($pageFollow);

        return $pageFollow->id;
    }

    final public function updateFollowStatus(Uuid $pageFollowId, PageFollowStatusDto $dto): Uuid
    {
        $pageFollow = $this->pageFollowRepository->findById($pageFollowId);

        if (! $pageFollow) {
            throw new ValidatorException('Page follow not found.');
        }

        $pageFollow->status = PageFollowStatusEnum::from($dto->status);
        $this->pageFollowRepository->save($pageFollow);

        return $pageFollow->id;
    }

    final public function deleteFollow(Uuid $pageFollowId): Uuid
    {
        $pageFollow = $this->pageFollowRepository->findById($pageFollowId);

        if (! $pageFollow) {
            throw new ValidatorException('Page follow not found.');
        }

        $pageFollow->softDelete();
        $this->pageFollowRepository->save($pageFollow);

        return $pageFollow->id;
    }

    final public function indexFollows(PageFollowIndexDto $dto): array
    {
        return $this->pageFollowRepository->findPageFollows($dto);
    }

    final public function detailsFollow(Uuid $pageFollowId): PageFollow
    {
        $pageFollow = $this->pageFollowRepository->findById($pageFollowId);

        if (! $pageFollow) {
            throw new ValidatorException('Page follow not found.');
        }

        return $pageFollow;
    }
}
