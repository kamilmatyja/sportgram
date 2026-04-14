<?php

namespace App\Controller;

use App\Dto\UserCreateDto;
use App\Http\ApiResponse;
use App\Http\JsonRequestHelper;
use App\Http\UserCreateInputConstraints;
use App\Http\ValidationHelper;
use App\Service\UserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class UserController extends AbstractController
{
    #[Route('/users', name: 'create_user', methods: ['POST'])]
    final public function create(
        Request $request,
        SerializerInterface $serializer,
        ValidatorInterface $validator,
        UserService $userService
    ): JsonResponse {
        $data = JsonRequestHelper::getJsonData($request);
        $inputViolations = $validator->validate($data, UserCreateInputConstraints::get());
        ValidationHelper::throwOnErrors($inputViolations);
        $dto = $serializer->denormalize($data, UserCreateDto::class);

        $id = $userService->createUser($dto);
        return ApiResponse::created($id);
    }
}
