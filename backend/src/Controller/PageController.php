<?php

namespace App\Controller;

use App\Dto\{ElementStatusDto,
    PageDetailsQueryDto,
    PageDto,
    PageFollowIndexDto,
    PageFollowStatusDto,
    PageIndexDto,
    SaveStatusDto};
use App\Enum\RoleEnum;
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Collection, Conflict, Created, Forbidden, Item, Ok, Unauthorized};
use App\Resource\{PageFollowResource, PageResource};
use App\Security\Voter\{PageCreatorVoter, PageFollowVoter, PageParticipantVoter, PageVoter};
use App\Service\PageService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\{MapQueryString, MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

class PageController extends AbstractController
{
    #[Route('/api/pages', name: 'page_create', methods: ['POST'])]
    #[IsGranted(RoleEnum::ROLE_ORGANIZER)]
    #[OA\Post(
        summary: 'Create page',
        requestBody: new Body(PageDto::class),
        tags: ['pages'],
        responses: [new Created(), new BadRequest(), new Unauthorized(), new Forbidden()],
    )]
    final public function create(
        #[MapRequestPayload]
        PageDto $dto,
        PageService $service,
    ): JsonResponse {
        $pageId = $service->create($dto);

        return ApiResponse::created($pageId);
    }

    #[Route('/api/pages/{id}', name: 'page_update', methods: ['PUT'])]
    #[IsGranted(PageCreatorVoter::PAGE_CREATOR, subject: 'id')]
    #[OA\Put(
        summary: 'Update page',
        requestBody: new Body(PageDto::class),
        tags: ['pages'],
        responses: [new Ok(), new BadRequest(), new Unauthorized(), new Forbidden(), new Conflict()],
    )]
    final public function update(
        Uuid $id,
        #[MapRequestPayload]
        PageDto $dto,
        PageService $service,
    ): JsonResponse {
        $pageId = $service->update($id, $dto);

        return ApiResponse::ok($pageId);
    }

    #[Route('/api/pages/{id}/status', name: 'page_patch_status', methods: ['PATCH'])]
    #[IsGranted(PageVoter::PAGE, subject: 'id')]
    #[OA\Patch(
        summary: 'Update page status',
        requestBody: new Body(ElementStatusDto::class),
        tags: ['pages'],
        responses: [new Ok(), new BadRequest(), new Unauthorized(), new Forbidden(), new Conflict()],
    )]
    final public function patchStatus(
        Uuid $id,
        #[MapRequestPayload]
        ElementStatusDto $dto,
        PageService $service,
    ): JsonResponse {
        $pageId = $service->updateStatus($id, $dto);

        return ApiResponse::ok($pageId);
    }

    #[Route('/api/pages/{id}', name: 'page_delete', methods: ['DELETE'])]
    #[IsGranted(PageCreatorVoter::PAGE_CREATOR, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete page',
        tags: ['pages'],
        responses: [new Ok(), new BadRequest(), new Unauthorized(), new Forbidden(), new Conflict()],
    )]
    final public function delete(
        Uuid $id,
        PageService $service,
    ): JsonResponse {
        $pageId = $service->delete($id);

        return ApiResponse::ok($pageId);
    }

    #[Route('/api/pages', name: 'page_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of pages',
        tags: ['pages'],
        responses: [new Collection(PageResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function index(
        #[MapQueryString(validationFailedStatusCode: 400)]
        PageIndexDto $dto,
        #[MapQueryString(validationFailedStatusCode: 400)]
        PageDetailsQueryDto $include,
        PageService $service,
    ): JsonResponse {
        $pages = $service->index($dto);

        $data = PageResource::fromEntityCollection($pages, $include);

        return ApiResponse::elements($data);
    }

    #[Route('/api/pages/{id}', name: 'page_details', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Details of page',
        tags: ['pages'],
        responses: [new Item(PageResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function details(
        Uuid $id,
        #[MapQueryString(validationFailedStatusCode: 400)]
        PageDetailsQueryDto $dto,
        PageService $service,
    ): JsonResponse {
        $page = $service->details($id);

        $data = PageResource::fromEntity($page, $dto);

        return ApiResponse::elements($data);
    }

    #[Route('/api/page-participants/{id}/status', name: 'page_participant_patch_status', methods: ['PATCH'])]
    #[IsGranted(PageParticipantVoter::PAGE_PARTICIPANT, subject: 'id')]
    #[OA\Patch(
        summary: 'Update page participant status',
        requestBody: new Body(SaveStatusDto::class),
        tags: ['pages'],
        responses: [new Ok(), new BadRequest(), new Unauthorized(), new Forbidden(), new Conflict()],
    )]
    final public function patchParticipantStatus(
        Uuid $id,
        #[MapRequestPayload]
        SaveStatusDto $dto,
        PageService $service,
    ): JsonResponse {
        $pageParticipantId = $service->updateParticipantStatus($id, $dto);

        return ApiResponse::ok($pageParticipantId);
    }

    #[Route('/api/pages/{id}/follows', name: 'page_follow_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Post(
        summary: 'Create page follow',
        requestBody: new Body(PageFollowStatusDto::class),
        tags: ['pages'],
        responses: [new Created(), new BadRequest(), new Unauthorized(), new Forbidden()],
    )]
    final public function createFollow(
        Uuid $id,
        #[MapRequestPayload]
        PageFollowStatusDto $dto,
        PageService $service,
    ): JsonResponse {
        $pageFollowId = $service->createFollow($id, $dto);

        return ApiResponse::created($pageFollowId);
    }

    #[Route('/api/page-follows/{id}/status', name: 'page_follow_patch_status', methods: ['PATCH'])]
    #[IsGranted(PageFollowVoter::PAGE_FOLLOW, subject: 'id')]
    #[OA\Patch(
        summary: 'Update page follow status',
        requestBody: new Body(PageFollowStatusDto::class),
        tags: ['pages'],
        responses: [new Ok(), new BadRequest(), new Unauthorized(), new Forbidden(), new Conflict()],
    )]
    final public function patchFollowStatus(
        Uuid $id,
        #[MapRequestPayload]
        PageFollowStatusDto $dto,
        PageService $service,
    ): JsonResponse {
        $pageFollowId = $service->updateFollowStatus($id, $dto);

        return ApiResponse::ok($pageFollowId);
    }

    #[Route('/api/page-follows/{id}', name: 'page_follow_delete', methods: ['DELETE'])]
    #[IsGranted(PageFollowVoter::PAGE_FOLLOW, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete page follow',
        tags: ['pages'],
        responses: [new Ok(), new BadRequest(), new Unauthorized(), new Forbidden(), new Conflict()],
    )]
    final public function deleteFollow(
        Uuid $id,
        PageService $service,
    ): JsonResponse {
        $pageFollowId = $service->deleteFollow($id);

        return ApiResponse::ok($pageFollowId);
    }

    #[Route('/api/page-follows', name: 'page_follow_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of page follows',
        tags: ['pages'],
        responses: [new Collection(PageResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function indexFollows(
        #[MapQueryString(validationFailedStatusCode: 400)]
        PageFollowIndexDto $dto,
        PageService $service,
    ): JsonResponse {
        $pageFollows = $service->indexFollows($dto);

        $data = PageFollowResource::fromEntityCollection($pageFollows);

        return ApiResponse::elements($data);
    }

    #[Route('/api/page-follows/{id}', name: 'page_follow_details', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Details of page follow',
        tags: ['pages'],
        responses: [new Item(PageResource::class), new BadRequest(), new Unauthorized()],
    )]
    final public function detailsFollow(
        Uuid $id,
        PageService $service,
    ): JsonResponse {
        $pageFollow = $service->detailsFollow($id);

        $data = PageFollowResource::fromEntity($pageFollow);

        return ApiResponse::elements($data);
    }
}
