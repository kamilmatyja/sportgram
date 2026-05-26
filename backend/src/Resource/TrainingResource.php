<?php

namespace App\Resource;

use App\Dto\TrainingDetailsQueryDto;
use App\Entity\{Training, TrainingDiscipline, TrainingParticipant};
use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'feedId',
        'userId',
        'createdAt',
        'updatedAt',
        'startedAt',
        'endedAt',
        'title',
        'description',
        'link',
        'location',
        'status',
    ],
    properties: [
        new OA\Property(
            property: 'id',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'feedId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'userId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2026-04-22T10:00:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time', example: '2026-04-22T12:00:00'),
        new OA\Property(property: 'startedAt', type: 'string', format: 'date-time', example: '2026-04-22T10:00:00'),
        new OA\Property(property: 'endedAt', type: 'string', format: 'date-time', example: '2026-04-22T12:00:00'),
        new OA\Property(property: 'title', type: 'string', example: 'Training title'),
        new OA\Property(property: 'description', type: 'string', example: 'Training description'),
        new OA\Property(property: 'link', type: 'string', example: 'my-link'),
        new OA\Property(property: 'location', type: 'string', example: 'Training location'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
        new OA\Property(
            property: 'disciplines',
            type: 'array',
            items: new OA\Items(ref: new Model(type: TrainingDisciplineResource::class)),
        ),
        new OA\Property(
            property: 'participants',
            type: 'array',
            items: new OA\Items(ref: new Model(type: TrainingParticipantResource::class)),
        ),
    ],
    type: 'object',
)]
class TrainingResource
{
    public static function fromEntity(Training $training, ?TrainingDetailsQueryDto $dto = null): array
    {
        $data = [
            'id' => $training->id->toString(),
            'feedId' => $training->feed->id->toString(),
            'userId' => $training->user->id->toString(),
            'createdAt' => $training->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $training->updatedAt->format('Y-m-d\TH:i:s'),
            'startedAt' => $training->startedAt->format('Y-m-d\TH:i:s'),
            'endedAt' => $training->endedAt->format('Y-m-d\TH:i:s'),
            'title' => $training->title,
            'description' => $training->description,
            'link' => $training->link,
            'location' => $training->location,
            'status' => $training->status->value,
        ];

        if ($dto && in_array($dto::TRAINING_DISCIPLINES, $dto->include)) {
            $data['disciplines'] = array_map(
                fn (TrainingDiscipline $discipline) => TrainingDisciplineResource::fromEntity(
                    $discipline,
                    $dto,
                ),
                $training->disciplines->toArray(),
            );
        }

        if ($dto && in_array($dto::TRAINING_PARTICIPANTS, $dto->include)) {
            $data['participants'] = array_map(
                fn (TrainingParticipant $participant) => TrainingParticipantResource::fromEntity($participant),
                $training->participants->toArray(),
            );
        }

        return $data;
    }

    /** @param Training[] $trainings */
    public static function fromEntityCollection(array $trainings): array
    {
        return array_map(fn (Training $training) => self::fromEntity($training), $trainings);
    }
}
