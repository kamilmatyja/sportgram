<?php

namespace App\Service;

use App\Dto\{UserCreateDto, UserCreateNanoDto, UserIndexDto, UserStatusDto, UserUpdateDto};
use App\Entity\{User, UserDiscipline, UserRegister, UserRole};
use App\Enum\{ColorEnum,
    LanguageEnum,
    NotificationTypeEnum,
    ThemeEnum,
    UnauthorizedStatusEnum,
    UserStatusEnum};
use App\Event\{NotificationEvent, UserRegisterEmailEvent};
use App\Repository\{UserDisciplineRepository, UserRegisterRepository, UserRepository, UserRoleRepository};
use App\Security\Voter\AssignAdminRoleVoter;
use DateMalformedStringException;
use Doctrine\ORM\Tools\Pagination\WindowPage;
use Random\RandomException;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;

readonly class UserService
{
    public function __construct(
        private UserRepository $userRepository,
        private UserRoleRepository $userRoleRepository,
        private UserDisciplineRepository $userDisciplineRepository,
        private UserRegisterRepository $userRegisterRepository,
        private UserPasswordHasherInterface $hasher,
        private AuthorizationCheckerInterface $authorizationChecker,
        private EventDispatcherInterface $eventDispatcher,
    ) {
    }

    /**
     * @throws DateMalformedStringException
     * @throws RandomException
     */
    final public function create(UserCreateDto $dto): Uuid
    {
        $user = new User(
            $dto->birthAt,
            mb_ucfirst(mb_strtolower($dto->firstName)),
            mb_ucfirst(mb_strtolower($dto->lastName)),
            $dto->gender,
            $dto->phone,
            mb_strtolower($dto->email),
            $dto->link,
            $dto->language,
            $dto->country,
            $dto->theme,
            $dto->color,
            $dto->profilePhoto,
            $dto->backgroundPhoto,
            $dto->bio,
            UserStatusEnum::Pending,
        );

        $user->password = $this->hasher->hashPassword($user, $dto->password);

        $this->userRepository->save($user);

        foreach ($dto->roles as $role) {
            $userRole = new UserRole($user, $role);

            $this->userRoleRepository->save($userRole);
        }

        foreach ($dto->disciplines as $discipline) {
            $userDiscipline = new UserDiscipline($user, $discipline);

            $this->userDisciplineRepository->save($userDiscipline);
        }

        $userRegister = new UserRegister($user, random_int(100000, 999999), 0, UnauthorizedStatusEnum::NotSent);
        $this->userRegisterRepository->save($userRegister);

        $this->eventDispatcher->dispatch(new UserRegisterEmailEvent($user, $userRegister));

        return $user->id;
    }

    /**
     * @throws DateMalformedStringException
     * @throws RandomException
     */
    final public function createNano(UserCreateNanoDto $dto): Uuid
    {
        $user = new User(
            $dto->birthAt,
            mb_ucfirst(mb_strtolower($dto->firstName)),
            mb_ucfirst(mb_strtolower($dto->lastName)),
            $dto->gender,
            $dto->phone,
            mb_strtolower($dto->email),
            sprintf('%s-%s-%s', $dto->firstName, $dto->lastName, random_int(100, 999)),
            LanguageEnum::Polish,
            $dto->country,
            ThemeEnum::Light,
            ColorEnum::Blue,
            base64_encode(file_get_contents(__DIR__ . '/../../public/profile.webp')),
            base64_encode(file_get_contents(__DIR__ . '/../../public/background.webp')),
            sprintf('%s %s bio', $dto->firstName, $dto->lastName),
            UserStatusEnum::Pending,
        );

        $user->password = $this->hasher->hashPassword($user, $dto->password);

        $this->userRepository->save($user);

        foreach ($dto->roles as $role) {
            $userRole = new UserRole($user, $role);

            $this->userRoleRepository->save($userRole);
        }

        $userRegister = new UserRegister($user, random_int(100000, 999999), 0, UnauthorizedStatusEnum::NotSent);
        $this->userRegisterRepository->save($userRegister);

        $this->eventDispatcher->dispatch(new UserRegisterEmailEvent($user, $userRegister));

        return $user->id;
    }

    /**
     * @throws DateMalformedStringException
     */
    final public function update(Uuid $userId, UserUpdateDto $dto): Uuid
    {
        if (! $this->authorizationChecker->isGranted(AssignAdminRoleVoter::ASSIGN_ADMIN_ROLE, $dto)) {
            throw new ValidatorException('Role not allowed for this user.');
        }

        $user = $this->userRepository->findById($userId);

        $user->birthAt = $dto->birthAt;
        $user->firstName = mb_ucfirst(mb_strtolower($dto->firstName));
        $user->lastName = mb_ucfirst(mb_strtolower($dto->lastName));
        $user->gender = $dto->gender;
        $user->phone = $dto->phone;
        $user->email = mb_strtolower($dto->email);
        $user->link = $dto->link;
        $user->language = $dto->language;
        $user->country = $dto->country;
        $user->theme = $dto->theme;
        $user->color = $dto->color;
        $user->profilePhoto = $dto->profilePhoto;
        $user->backgroundPhoto = $dto->backgroundPhoto;
        $user->bio = $dto->bio;

        if (! empty($dto->password)) {
            $user->password = $this->hasher->hashPassword($user, $dto->password);
        }

        foreach ($user->roles as $role) {
            $this->userRoleRepository->delete($role);
        }

        foreach ($dto->roles as $role) {
            $userRole = new UserRole($user, $role);

            $this->userRoleRepository->save($userRole);
        }

        foreach ($user->disciplines as $discipline) {
            $this->userDisciplineRepository->delete($discipline);
        }

        foreach ($dto->disciplines as $discipline) {
            $userDiscipline = new UserDiscipline($user, $discipline);

            $this->userDisciplineRepository->save($userDiscipline);
        }

        $this->userRepository->save($user);

        return $user->id;
    }

    final public function updateStatus(Uuid $userId, UserStatusDto $dto): Uuid
    {
        $user = $this->userRepository->findById($userId);

        $user->status = $dto->status;
        $this->userRepository->save($user);

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $user,
                NotificationTypeEnum::UserStatus,
                $user->firstName . ' ' . $user->lastName,
                '/users/' . $user->link,
            ),
        );

        return $user->id;
    }

    final public function delete(Uuid $userId): Uuid
    {
        $user = $this->userRepository->findById($userId);

        if ($user->pages->count() > 0) {
            throw new ValidatorException('Cannot delete user with pages.');
        }

        $this->userRepository->delete($user);

        return $userId;
    }

    final public function index(UserIndexDto $dto): WindowPage
    {
        return $this->userRepository->findUsers($dto);
    }

    final public function details(Uuid $userId): User
    {
        return $this->userRepository->findById($userId);
    }
}
