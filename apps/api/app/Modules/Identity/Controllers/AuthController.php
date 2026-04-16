<?php

namespace App\Modules\Identity\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CustomerProfile;
use App\Models\User;
use App\Modules\Identity\Actions\IssueTokenAction;
use App\Modules\Identity\Requests\ForgotPasswordRequest;
use App\Modules\Identity\Requests\LoginRequest;
use App\Modules\Identity\Requests\RegisterCustomerRequest;
use App\Modules\Identity\Requests\ResetPasswordRequest;
use App\Modules\Identity\Requests\UpdateCustomerProfileRequest;
use App\Modules\Identity\Resources\UserResource;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private readonly IssueTokenAction $issueTokenAction)
    {
    }

    public function customerLogin(LoginRequest $request): JsonResponse
    {
        return $this->loginForActor($request, 'customer');
    }

    public function customerRegister(RegisterCustomerRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $user = User::query()->create([
                'uuid' => (string) Str::uuid(),
                'name' => $request->string('name')->toString(),
                'email' => $request->string('email')->toString(),
                'phone' => $request->string('phone')->toString(),
                'email_verified_at' => now(),
                'password' => $request->string('password')->toString(),
            ]);

            $user->syncRoles(['customer']);

            CustomerProfile::query()->create([
                'uuid' => (string) Str::uuid(),
                'user_id' => $user->id,
            ]);

            return $user->fresh();
        });

        $token = $this->issueTokenAction->execute(
            $user,
            'customer',
            $request->string('device_name')->toString()
        );

        $user->forceFill(['last_login_at' => now()])->save();

        return response()->json([
            'data' => [
                'token' => $token->plainTextToken,
                'user' => new UserResource($user->fresh()->withAccessToken($token->accessToken)),
            ],
        ], 201);
    }

    public function merchantLogin(LoginRequest $request): JsonResponse
    {
        return $this->loginForActor($request, 'merchant');
    }

    public function riderLogin(LoginRequest $request): JsonResponse
    {
        return $this->loginForActor($request, 'rider');
    }

    public function opsLogin(LoginRequest $request): JsonResponse
    {
        return $this->loginForActor($request, 'ops');
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new UserResource($request->user()),
        ]);
    }

    public function updateCustomerProfile(UpdateCustomerProfileRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'customer:profile.write');

        $request->user()->update($request->validated());

        return response()->json([
            'data' => new UserResource($request->user()->fresh()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $status = Password::sendResetLink($request->validated());

        return response()->json([
            'message' => __($status),
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->validated(),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        return response()->json([
            'message' => __($status),
        ]);
    }

    private function loginForActor(LoginRequest $request, string $actor): JsonResponse
    {
        $user = User::query()->where('email', $request->string('email'))->first();

        if (! $user || ! Hash::check($request->string('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'The provided credentials are invalid.',
            ]);
        }

        $token = $this->issueTokenAction->execute(
            $user,
            $actor,
            $request->string('device_name')->toString()
        );

        $user->forceFill(['last_login_at' => now()])->save();

        return response()->json([
            'data' => [
                'token' => $token->plainTextToken,
                'user' => new UserResource($user->fresh()->withAccessToken($token->accessToken)),
            ],
        ]);
    }
}
