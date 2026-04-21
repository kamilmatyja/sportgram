<?php

namespace App\Service;

use App\Dto\{ElementStatusDto,
    PageDetailsQueryDto,
    PageDto,
    PageFollowIndexDto,
    PageFollowStatusDto,
    PageIndexDto,
    SaveStatusDto};
use App\Entity\{Page, PageFollow};
use Symfony\Component\Uid\Uuid;

readonly class PageService
{
    public function create(PageDto $dto): Uuid
    {
        // TODO: implement
    }

    public function update(Uuid $pageId, PageDto $dto): Uuid
    {
        // TODO: implement
    }

    public function patchStatus(Uuid $pageId, ElementStatusDto $dto): Uuid
    {
        // TODO: implement
    }

    public function delete(Uuid $pageId): Uuid
    {
        // TODO: implement
    }

    public function index(PageIndexDto $dto): array
    {
        // TODO: implement
    }

    public function details(Uuid $pageId, PageDetailsQueryDto $dto): Page
    {
        // TODO: implement
    }

    public function patchParticipantStatus(Uuid $pageParticipantId, SaveStatusDto $dto): Uuid
    {
        // TODO: implement
    }

    public function createFollow(Uuid $pageId, PageFollowStatusDto $dto): Uuid
    {
        // TODO: implement
    }

    public function patchFollowStatus(Uuid $pageFollowId, PageFollowStatusDto $dto): Uuid
    {
        // TODO: implement
    }

    public function deleteFollow(Uuid $pageFollowId): Uuid
    {
        // TODO: implement
    }

    public function indexFollows(PageFollowIndexDto $dto): array
    {
        // TODO: implement
    }

    public function detailsFollow(Uuid $pageFollowId): PageFollow
    {
        // TODO: implement
    }
}
