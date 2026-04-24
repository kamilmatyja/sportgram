<?php

namespace App\Controller;

use App\Dto\{GoalDetailsQueryDto, GoalDto, GoalIndexDto, GoalStatusDto, SaveStatusDto};
use App\Enum\RoleEnum;
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Collection, Conflict, Created, Forbidden, Item, Ok, Unauthorized};
use App\Resource\GoalResource;
use App\Security\Voter\{GoalCreatorVoter, GoalParticipantResultVoter, GoalParticipantVoter, GoalVoter};
use App\Service\GoalService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\{MapQueryString, MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

class GoalController extends AbstractController
{
    #[Route('/api/goals', name: 'goal_create', methods: ['POST'])]
    #[IsGranted(RoleEnum::ROLE_PARTICIPANT)]
    #[OA\Post(
        summary: 'Create goal',
        requestBody: new Body('GoalDto'),
        tags: ['goals'],
        responses: [new Created(), new BadRequest(), new Unauthorized(), new Forbidden()],
    )]
    final public function create(
        #[MapRequestPayload]
        GoalDto $dto,
        GoalService $service,
    ): JsonResponse {
        $goalId = $service->create($dto);

        return ApiResponse::created($goalId);
    }

    #[Route('/api/goals/{id}', name: 'goal_update', methods: ['PUT'])]
    #[IsGranted(GoalCreatorVoter::GOAL_CREATOR, subject: 'id')]
    #[OA\Put(
        summary: 'Update goal',
        requestBody: new Body('GoalDto'),
        tags: ['goals'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function update(
        Uuid $id,
        #[MapRequestPayload]
        GoalDto $dto,
        GoalService $service,
    ): JsonResponse {
        $goalId = $service->update($id, $dto);

        return ApiResponse::ok($goalId);
    }

    #[Route('/api/goals/{id}/status', name: 'goal_update_status', methods: ['PATCH'])]
    #[IsGranted(GoalVoter::GOAL, subject: 'id')]
    #[OA\Patch(
        summary: 'Update goal status',
        requestBody: new Body('GoalStatusDto'),
        tags: ['goals'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateStatus(
        Uuid $id,
        #[MapRequestPayload]
        GoalStatusDto $dto,
        GoalService $service,
    ): JsonResponse {
        $goalId = $service->updateStatus($id, $dto);

        return ApiResponse::ok($goalId);
    }

    #[Route('/api/goals/{id}', name: 'goal_delete', methods: ['DELETE'])]
    #[IsGranted(GoalCreatorVoter::GOAL_CREATOR, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete goal',
        tags: ['goals'],
        responses: [new Ok(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function delete(
        Uuid $id,
        GoalService $service,
    ): JsonResponse {
        $goalId = $service->delete($id);

        return ApiResponse::ok($goalId);
    }

    #[Route('/api/goals', name: 'goal_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of goals',
        tags: ['goals'],
        responses: [new Collection('GoalResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function index(
        #[MapQueryString(validationFailedStatusCode: 400)]
        GoalIndexDto $dto,
        GoalService $service,
    ): JsonResponse {
        $goals = $service->index($dto);

        $data = GoalResource::fromEntityCollection($goals);

        return ApiResponse::elements($data);
    }

    #[Route('/api/goals/{id}', name: 'goal_details', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Details of users',
        tags: ['goals'],
        responses: [new Item('GoalResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function details(
        Uuid $id,
        #[MapQueryString(validationFailedStatusCode: 400)]
        GoalDetailsQueryDto $dto,
        GoalService $service,
    ): JsonResponse {
        $goal = $service->details($id);

        $data = GoalResource::fromEntity($goal, $dto);

        return ApiResponse::elements($data);
    }

    #[Route('/api/goal-participants/{id}/status', name: 'goal_participant_update_status', methods: ['PATCH'])]
    #[IsGranted(GoalParticipantVoter::GOAL_PARTICIPANT, subject: 'id')]
    #[OA\Patch(
        summary: 'Update goal participant status',
        requestBody: new Body('SaveStatusDto'),
        tags: ['goals'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function participantUpdateStatus(
        Uuid $id,
        #[MapRequestPayload]
        SaveStatusDto $dto,
        GoalService $service,
    ): JsonResponse {
        $goalParticipantId = $service->updateParticipantStatus($id, $dto);

        return ApiResponse::ok($goalParticipantId);
    }

    #[Route('/api/goal-participant-results/{id}/status', name: 'goal_participant_result_update_status', methods: ['PATCH'])]
    #[IsGranted(GoalParticipantResultVoter::GOAL_PARTICIPANT_RESULT, subject: 'id')]
    #[OA\Patch(
        summary: 'Update goal participant result status',
        requestBody: new Body('SaveStatusDto'),
        tags: ['goals'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function participantResultUpdateStatus(
        Uuid $id,
        #[MapRequestPayload]
        SaveStatusDto $dto,
        GoalService $service,
    ): JsonResponse {
        $goalParticipantResultId = $service->updateParticipantResultStatus($id, $dto);

        return ApiResponse::ok($goalParticipantResultId);
    }
}
