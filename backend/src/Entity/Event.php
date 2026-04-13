<?php

namespace App\Entity;

use App\Enum\ElementStatusEnum;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'events')]
#[ORM\HasLifecycleCallbacks]
class Event
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
    private ?Uuid $id = null;
    #[ORM\ManyToOne(targetEntity: PageParticipant::class)]
    #[ORM\JoinColumn(name: 'page_participant_id', referencedColumnName: 'id', nullable: false)]
    private PageParticipant $pageParticipant;
    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;
    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt;
    #[ORM\Column(name: 'deleted_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $deletedAt = null;
    #[ORM\Column(name: 'started_at', type: 'datetime_immutable')]
    private DateTimeImmutable $startedAt;
    #[ORM\Column(name: 'ended_at', type: 'datetime_immutable')]
    private DateTimeImmutable $endedAt;
    #[ORM\Column(name: 'title', type: 'text', length: 256)]
    private string $title;
    #[ORM\Column(name: 'description', type: 'text', length: 4096)]
    private string $description;
    #[ORM\Column(name: 'link', type: 'text', length: 2048)]
    private string $link;
    #[ORM\Column(name: 'rules', type: 'text', length: 4096)]
    private string $rules;
    #[ORM\Column(name: 'photo', type: 'binary')]
    private string $photo;
    #[ORM\Column(name: 'location', type: 'text', length: 1024)]
    private string $location;
    #[ORM\Column(name: 'status', type: 'integer', enumType: ElementStatusEnum::class)]
    private ElementStatusEnum $status;

    public function __construct(
        PageParticipant $pageParticipant,
        DateTimeImmutable $startedAt,
        DateTimeImmutable $endedAt,
        string $title,
        string $description,
        string $link,
        string $rules,
        string $photo,
        string $location,
        ElementStatusEnum $status,
    ) {
        $this->pageParticipant = $pageParticipant;
        $this->startedAt = $startedAt;
        $this->endedAt = $endedAt;
        $this->title = $title;
        $this->description = $description;
        $this->link = $link;
        $this->rules = $rules;
        $this->photo = $photo;
        $this->location = $location;
        $this->status = $status;
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now = new DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }
}
