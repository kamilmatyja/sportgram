<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\PageDto;
use App\Enum\ColorEnum;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class PageDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $this->assertSame([], new PageDto()->userIds);
    }

    final public function testEmptyDtoRequiresMandatoryFields(): void
    {
        $this->assertViolations(new PageDto(), [
            'title',
            'description',
            'link',
            'profilePhoto',
            'backgroundPhoto',
            'color',
        ]);
    }

    final public function testValid(): void
    {
        $this->assertValid($this->validDto());
    }

    final public function testValidWithUserIds(): void
    {
        $dto = $this->validDto();
        $dto->addUserId(Uuid::v7());
        $dto->addUserId(Uuid::v7());

        $this->assertValid($dto);
    }

    final public function testAddUserIdAppends(): void
    {
        $first = Uuid::v7();
        $second = Uuid::v7();
        $dto = new PageDto();
        $dto->addUserId($first);
        $dto->addUserId($second);

        $this->assertSame([$first, $second], $dto->userIds);
    }

    #[DataProvider('colorProvider')]
    final public function testAcceptsColor(ColorEnum $color): void
    {
        $dto = $this->validDto();
        $dto->color = $color;

        $this->assertValid($dto);
    }

    public static function colorProvider(): iterable
    {
        foreach (ColorEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    #[DataProvider('boundaryValueProvider')]
    final public function testAcceptsBoundaryValue(string $property, mixed $value): void
    {
        $dto = $this->validDto();
        $dto->{$property} = $value;

        $this->assertValid($dto);
    }

    public static function boundaryValueProvider(): iterable
    {
        yield 'title min' => ['title', 'a'];
        yield 'title max' => ['title', str_repeat('a', 256)];
        yield 'description min' => ['description', 'a'];
        yield 'description max' => ['description', str_repeat('a', 2048)];
        yield 'link min' => ['link', 'abcde'];
        yield 'link max' => ['link', str_repeat('a', 64)];
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, mixed $value): void
    {
        $dto = $this->validDto();
        $dto->{$property} = $value;

        $this->assertOnlyViolation($dto, $property);
    }

    public static function invalidValueProvider(): iterable
    {
        yield 'title empty' => ['title', ''];
        yield 'title too long' => ['title', str_repeat('a', 257)];
        yield 'description empty' => ['description', ''];
        yield 'description too long' => ['description', str_repeat('a', 2049)];
        yield 'link empty' => ['link', ''];
        yield 'link too short' => ['link', 'abcd'];
        yield 'link too long' => ['link', str_repeat('a', 65)];
        yield 'link with invalid characters' => ['link', 'my_page!'];
        yield 'profile photo empty' => ['profilePhoto', ''];
        yield 'profile photo not base64' => ['profilePhoto', '!!!'];
        yield 'background photo empty' => ['backgroundPhoto', ''];
        yield 'background photo not base64' => ['backgroundPhoto', '!!!'];
    }

    #[DataProvider('invalidUserIdProvider')]
    final public function testRejectsInvalidUserId(mixed $userId): void
    {
        $dto = $this->validDto();
        $dto->userIds = [Uuid::v7(), $userId];

        $this->assertOnlyViolation($dto, 'userIds[1]');
    }

    public static function invalidUserIdProvider(): iterable
    {
        yield 'empty' => [''];
        yield 'not uuid' => ['not-a-uuid'];
    }

    final public function testRejectsDuplicatedUserIds(): void
    {
        $id = Uuid::v7();
        $dto = $this->validDto();
        $dto->userIds = [$id, $id];

        $this->assertOnlyViolation($dto, 'userIds');
    }

    private function validDto(): PageDto
    {
        $dto = new PageDto();
        $dto->title = 'My page';
        $dto->description = 'Page description';
        $dto->link = 'my-page';
        $dto->profilePhoto = base64_encode('profile');
        $dto->backgroundPhoto = base64_encode('background');
        $dto->color = ColorEnum::Blue;

        return $dto;
    }
}
