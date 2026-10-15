<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\PageController;
use App\Dto\{ElementStatusDto, PageDetailsQueryDto, PageDto, PageFollowIndexDto, PageFollowStatusDto, PageIndexDto, SaveStatusDto};
use App\Entity\{Page, PageFollow, PageParticipant};
use App\Enum\RoleEnum;
use App\Resource\{PageFollowResource, PageResource};
use App\Security\Voter\{PageCreatorVoter, PageFollowVoter, PageParticipantVoter, PageVoter};
use App\Service\PageService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{PageFactory, PageFollowFactory, PageParticipantFactory};

class PageControllerTest extends ControllerTestCase
{
    private PageService&MockObject $service;

    private PageController $controller;

    protected function setUp(): void
    {
        $this->controller = new PageController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([PageController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([PageController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'create' => ['create', '/api/pages', 'POST', 'page_create', RoleEnum::ROLE_ORGANIZER, null];
        yield 'update' => ['update', '/api/pages/{id}', 'PUT', 'page_update', PageCreatorVoter::PAGE_CREATOR, 'id'];
        yield 'patchStatus' => ['patchStatus', '/api/pages/{id}/status', 'PATCH', 'page_patch_status', PageVoter::PAGE, 'id'];
        yield 'delete' => ['delete', '/api/pages/{id}', 'DELETE', 'page_delete', PageCreatorVoter::PAGE_CREATOR, 'id'];
        yield 'index' => ['index', '/api/pages', 'GET', 'page_index', 'IS_AUTHENTICATED_FULLY', null];
        yield 'details' => ['details', '/api/pages/{id}', 'GET', 'page_details', 'IS_AUTHENTICATED_FULLY', null];
        yield 'patchParticipantStatus' => ['patchParticipantStatus', '/api/page-participants/{id}/status', 'PATCH', 'page_participant_patch_status', PageParticipantVoter::PAGE_PARTICIPANT, 'id'];
        yield 'createFollow' => ['createFollow', '/api/pages/{id}/follows', 'POST', 'page_follow_create', 'IS_AUTHENTICATED_FULLY', null];
        yield 'patchFollowStatus' => ['patchFollowStatus', '/api/page-follows/{id}/status', 'PATCH', 'page_follow_patch_status', PageFollowVoter::PAGE_FOLLOW, 'id'];
        yield 'deleteFollow' => ['deleteFollow', '/api/page-follows/{id}', 'DELETE', 'page_follow_delete', PageFollowVoter::PAGE_FOLLOW, 'id'];
        yield 'indexFollows' => ['indexFollows', '/api/page-follows', 'GET', 'page_follow_index', 'IS_AUTHENTICATED_FULLY', null];
        yield 'detailsFollow' => ['detailsFollow', '/api/page-follows/{id}', 'GET', 'page_follow_details', 'IS_AUTHENTICATED_FULLY', null];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(PageController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    final public function testRequestMapping(): void
    {
        $this->assertMapsRequestPayload([PageController::class, 'create'], 'dto');
        $this->assertMapsRequestPayload([PageController::class, 'update'], 'dto');
        $this->assertMapsRequestPayload([PageController::class, 'patchStatus'], 'dto');
        $this->assertMapsQueryString([PageController::class, 'index'], 'dto');
        $this->assertMapsQueryString([PageController::class, 'index'], 'include');
        $this->assertMapsQueryString([PageController::class, 'details'], 'dto');
        $this->assertMapsRequestPayload([PageController::class, 'patchParticipantStatus'], 'dto');
        $this->assertMapsRequestPayload([PageController::class, 'createFollow'], 'dto');
        $this->assertMapsRequestPayload([PageController::class, 'patchFollowStatus'], 'dto');
        $this->assertMapsQueryString([PageController::class, 'indexFollows'], 'dto');
    }

    final public function testCreate(): void
    {
        $dto = new PageDto();
        $id = Uuid::v7();
        $this->service()->expects($this->once())->method('create')->with($dto)->willReturn($id);

        $response = $this->controller->create($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $id], $response);
    }

    final public function testUpdate(): void
    {
        $id = Uuid::v7();
        $dto = new PageDto();
        $this->service()->expects($this->once())->method('update')->with($id, $dto)->willReturn($id);

        $response = $this->controller->update($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testPatchStatus(): void
    {
        $id = Uuid::v7();
        $dto = new ElementStatusDto();
        $this->service()->expects($this->once())->method('updateStatus')->with($id, $dto)->willReturn($id);

        $response = $this->controller->patchStatus($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testDelete(): void
    {
        $id = Uuid::v7();
        $this->service()->expects($this->once())->method('delete')->with($id)->willReturn($id);

        $response = $this->controller->delete($id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testIndex(): void
    {
        $dto = new PageIndexDto();
        $include = new PageDetailsQueryDto();
        $include->include = [PageDetailsQueryDto::PAGE_FOLLOWS, PageDetailsQueryDto::PAGE_PARTICIPANTS];
        $pages = [$this->pageWithRelations(), $this->page()];
        $window = self::window($pages, total: 12, page: 1, limit: 2);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, $include, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, [
            'data' => PageResource::fromEntityCollection($pages, $include),
            'pagination' => self::pagination($window),
        ], $response);
    }

    final public function testIndexWithoutResults(): void
    {
        $dto = new PageIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('index')->with($dto)->willReturn($window);

        $response = $this->controller->index($dto, new PageDetailsQueryDto(), $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    final public function testDetails(): void
    {
        $page = $this->pageWithRelations();
        $dto = new PageDetailsQueryDto();
        $dto->include = [PageDetailsQueryDto::PAGE_FOLLOWS, PageDetailsQueryDto::PAGE_PARTICIPANTS];
        $this->service()->expects($this->once())->method('details')->with($page->id)->willReturn($page);

        $response = $this->controller->details($page->id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => PageResource::fromEntity($page, $dto)], $response);
    }

    final public function testDetailsWithoutIncludes(): void
    {
        $page = $this->pageWithRelations();
        $this->service()->expects($this->once())->method('details')->with($page->id)->willReturn($page);

        $response = $this->controller->details($page->id, new PageDetailsQueryDto(), $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => PageResource::fromEntity($page)], $response);
    }

    final public function testPatchParticipantStatus(): void
    {
        $id = Uuid::v7();
        $dto = new SaveStatusDto();
        $this->service()->expects($this->once())->method('updateParticipantStatus')->with($id, $dto)->willReturn($id);

        $response = $this->controller->patchParticipantStatus($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testCreateFollow(): void
    {
        $pageId = Uuid::v7();
        $followId = Uuid::v7();
        $dto = new PageFollowStatusDto();
        $this->service()->expects($this->once())->method('createFollow')->with($pageId, $dto)->willReturn($followId);

        $response = $this->controller->createFollow($pageId, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_CREATED, ['id' => (string) $followId], $response);
    }

    final public function testPatchFollowStatus(): void
    {
        $id = Uuid::v7();
        $dto = new PageFollowStatusDto();
        $this->service()->expects($this->once())->method('updateFollowStatus')->with($id, $dto)->willReturn($id);

        $response = $this->controller->patchFollowStatus($id, $dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testDeleteFollow(): void
    {
        $id = Uuid::v7();
        $this->service()->expects($this->once())->method('deleteFollow')->with($id)->willReturn($id);

        $response = $this->controller->deleteFollow($id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['id' => (string) $id], $response);
    }

    final public function testIndexFollows(): void
    {
        $dto = new PageFollowIndexDto();
        $follows = [$this->follow(), $this->follow()];
        $window = self::window($follows, total: 5, page: 2, limit: 2);
        $this->service()->expects($this->once())->method('indexFollows')->with($dto)->willReturn($window);

        $response = $this->controller->indexFollows($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, [
            'data' => PageFollowResource::fromEntityCollection($follows),
            'pagination' => self::pagination($window),
        ], $response);
    }

    final public function testIndexFollowsWithoutResults(): void
    {
        $dto = new PageFollowIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('indexFollows')->with($dto)->willReturn($window);

        $response = $this->controller->indexFollows($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    final public function testDetailsFollow(): void
    {
        $follow = $this->follow();
        $this->service()->expects($this->once())->method('detailsFollow')->with($follow->id)->willReturn($follow);

        $response = $this->controller->detailsFollow($follow->id, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => PageFollowResource::fromEntity($follow)], $response);
    }

    final public function testResponsesDoNotExposePasswordHashes(): void
    {
        $page = $this->pageWithRelations();
        $dto = new PageDetailsQueryDto();
        $dto->include = [PageDetailsQueryDto::PAGE_FOLLOWS, PageDetailsQueryDto::PAGE_PARTICIPANTS];
        $this->service()->expects($this->once())->method('details')->with($page->id)->willReturn($page);

        $content = $this->controller->details($page->id, $dto, $this->service())->getContent();

        $this->assertStringNotContainsString($page->user->password, $content);
        $this->assertStringNotContainsString('password', $content);
    }

    private function service(): PageService&MockObject
    {
        return $this->service ??= $this->createMock(PageService::class);
    }

    private function page(): Page
    {
        $page = PageFactory::make();
        $page->id = Uuid::v7();
        $page->onPrePersist();
        $page->user->id = Uuid::v7();
        $page->user->onPrePersist();

        return $page;
    }

    private function pageWithRelations(): Page
    {
        $page = $this->page();
        $page->follows->add($this->follow($page));
        $page->participants->add($this->participant($page));

        return $page;
    }

    private function follow(?Page $page = null): PageFollow
    {
        $follow = PageFollowFactory::make(['page' => $page ?? $this->page()]);
        $follow->id = Uuid::v7();
        $follow->onPrePersist();
        $follow->user->id = Uuid::v7();
        $follow->user->onPrePersist();

        return $follow;
    }

    private function participant(Page $page): PageParticipant
    {
        $participant = PageParticipantFactory::make(['page' => $page]);
        $participant->id = Uuid::v7();
        $participant->onPrePersist();
        $participant->user->id = Uuid::v7();
        $participant->user->onPrePersist();

        return $participant;
    }
}
