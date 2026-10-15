<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\ConversationActivityFilterDto;
use Symfony\Component\Uid\Uuid;

class ConversationActivityFilterDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new ConversationActivityFilterDto();

        $this->assertNull($dto->userId);
        $this->assertValid($dto);
    }

    final public function testAcceptsUserId(): void
    {
        $userId = Uuid::v7();
        $dto = new ConversationActivityFilterDto();
        $dto->userId = $userId;

        $this->assertSame($userId, $dto->userId);
        $this->assertValid($dto);
    }
}
