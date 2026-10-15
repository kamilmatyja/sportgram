<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\FeedReactionDto;
use App\Enum\FeedReactionEnum;
use PHPUnit\Framework\Attributes\DataProvider;

class FeedReactionDtoTest extends DtoTestCase
{
    final public function testRequiresType(): void
    {
        $this->assertOnlyViolation(new FeedReactionDto(), 'type');
    }

    #[DataProvider('typeProvider')]
    final public function testAcceptsType(FeedReactionEnum $type): void
    {
        $dto = new FeedReactionDto();
        $dto->type = $type;

        $this->assertSame($type, $dto->type);
        $this->assertValid($dto);
    }

    public static function typeProvider(): iterable
    {
        foreach (FeedReactionEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }
}
