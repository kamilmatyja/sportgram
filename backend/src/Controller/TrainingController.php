<?php

namespace App\Controller;

use App\Dto\{ElementStatusDto, SaveStatusDto, TrainingDetailsQueryDto, TrainingDto, TrainingIndexDto};
use App\Http\ApiResponse;
use App\OpenApi\{BadRequest, Body, Collection, Conflict, Created, Forbidden, Item, Ok, Unauthorized};
use App\Resource\TrainingResource;
use App\Security\Voter\{TrainingCreatorVoter, TrainingParticipantVoter, TrainingVoter};
use App\Service\TrainingService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\{MapQueryString, MapRequestPayload};
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

class TrainingController extends AbstractController
{
    #[Route('/api/trainings', name: 'training_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Post(
        summary: 'Create training',
        requestBody: new Body('TrainingDto'),
        tags: ['trainings'],
        responses: [new Created(), new BadRequest(), new Unauthorized(), new Forbidden()],
    )]
    final public function create(
        #[MapRequestPayload]
        TrainingDto $dto,
        TrainingService $service,
    ): JsonResponse {
        $trainingId = $service->create($dto);

        return ApiResponse::created($trainingId);
    }

    #[Route('/api/trainings/{id}', name: 'training_update', methods: ['PUT'])]
    #[IsGranted(TrainingCreatorVoter::TRAINING_CREATOR, subject: 'id')]
    #[OA\Put(
        summary: 'Update training',
        requestBody: new Body('TrainingDto'),
        tags: ['trainings'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function update(
        Uuid $id,
        #[MapRequestPayload]
        TrainingDto $dto,
        TrainingService $service,
    ): JsonResponse {
        $trainingId = $service->update($id, $dto);

        return ApiResponse::ok($trainingId);
    }

    #[Route('/api/trainings/{id}/status', name: 'training_update_status', methods: ['PATCH'])]
    #[IsGranted(TrainingVoter::TRAINING, subject: 'id')]
    #[OA\Patch(
        summary: 'Update training status',
        requestBody: new Body('ElementStatusDto'),
        tags: ['trainings'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function updateStatus(
        Uuid $id,
        #[MapRequestPayload]
        ElementStatusDto $dto,
        TrainingService $service,
    ): JsonResponse {
        $trainingId = $service->updateStatus($id, $dto);

        return ApiResponse::ok($trainingId);
    }

    #[Route('/api/trainings/{id}', name: 'training_delete', methods: ['DELETE'])]
    #[IsGranted(TrainingCreatorVoter::TRAINING_CREATOR, subject: 'id')]
    #[OA\Delete(
        summary: 'Delete training',
        tags: ['trainings'],
        responses: [new Ok(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function delete(
        Uuid $id,
        TrainingService $service,
    ): JsonResponse {
        $trainingId = $service->delete($id);

        return ApiResponse::ok($trainingId);
    }

    #[Route('/api/trainings', name: 'training_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Index of trainings',
        tags: ['trainings'],
        responses: [new Collection('TrainingResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function index(
        #[MapQueryString(validationFailedStatusCode: 400)]
        TrainingIndexDto $dto,
        TrainingService $service,
    ): JsonResponse {
        $trainings = $service->index($dto);

        $data = TrainingResource::fromEntityCollection($trainings);

        return ApiResponse::elements($data);
    }

    #[Route('/api/trainings/{id}', name: 'training_details', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    #[OA\Get(
        summary: 'Details of training',
        tags: ['trainings'],
        responses: [new Item('TrainingResource'), new BadRequest(), new Unauthorized()],
    )]
    final public function details(
        Uuid $id,
        #[MapQueryString(validationFailedStatusCode: 400)]
        TrainingDetailsQueryDto $dto,
        TrainingService $service,
    ): JsonResponse {
        $training = $service->details($id);

        $data = TrainingResource::fromEntity($training, $dto);

        return ApiResponse::elements($data);
    }

    #[Route('/api/training-participants/{id}/status', name: 'training_participant_update_status', methods: ['PATCH'])]
    #[IsGranted(TrainingParticipantVoter::TRAINING_PARTICIPANT, subject: 'id')]
    #[OA\Patch(
        summary: 'Update training participant status',
        requestBody: new Body('SaveStatusDto'),
        tags: ['trainings'],
        responses: [new Ok(), new BadRequest(), new Conflict(), new Unauthorized(), new Forbidden()],
    )]
    final public function participantUpdateStatus(
        Uuid $id,
        #[MapRequestPayload]
        SaveStatusDto $dto,
        TrainingService $service,
    ): JsonResponse {
        $trainingParticipantId = $service->updateParticipantStatus($id, $dto);

        return ApiResponse::ok($trainingParticipantId);
    }
}
