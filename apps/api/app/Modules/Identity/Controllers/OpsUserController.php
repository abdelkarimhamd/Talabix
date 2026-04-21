<?php

namespace App\Modules\Identity\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Identity\Enums\UserAccountStatus;
use App\Modules\Identity\Requests\StoreOpsUserRequest;
use App\Modules\Identity\Requests\UpdateOpsUserRequest;
use App\Modules\Identity\Resources\OpsUserResource;
use App\Modules\Shared\Actions\RecordAuditLogAction;
use App\Modules\Shared\Enums\AuditActionType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OpsUserController extends Controller
{
    private const OPS_ROLES = ['ops_admin', 'ops_dispatcher', 'ops_support'];

    public function __construct(private readonly RecordAuditLogAction $recordAuditLogAction) {}

    public function index(Request $request): JsonResponse
    {
        $this->ensureAbility($request, 'ops:users.manage');

        $users = User::query()
            ->whereHas('roles', fn ($query) => $query->whereIn('name', self::OPS_ROLES))
            ->with('roles')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => OpsUserResource::collection($users),
        ]);
    }

    public function store(StoreOpsUserRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'ops:users.manage');

        $validated = $request->validated();
        $user = User::query()->create([
            'uuid' => (string) Str::uuid(),
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'account_status' => $validated['account_status'] ?? UserAccountStatus::ACTIVE,
            'email_verified_at' => now(),
            'password' => $validated['password'],
        ]);

        $user->syncRoles([$validated['role']]);

        $this->recordAuditLogAction->execute(
            AuditActionType::PERMISSION_CHANGED,
            $request->user(),
            $user,
            'Ops user invited.',
            [
                'target_email' => $user->email,
                'role' => $validated['role'],
                'account_status' => $user->account_status->value,
            ]
        );

        return response()->json([
            'data' => new OpsUserResource($user->load('roles')),
        ], 201);
    }

    public function update(UpdateOpsUserRequest $request, User $user): JsonResponse
    {
        $this->ensureAbility($request, 'ops:users.manage');
        $this->ensureOpsUser($user);

        $validated = $request->validated();

        if ($user->is($request->user())) {
            $this->preventSelfLockout($validated);
        }

        $user->fill(collect($validated)
            ->only(['name', 'phone', 'account_status'])
            ->all());
        $user->save();

        if (isset($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        if (isset($validated['account_status']) && $this->statusValue($validated['account_status']) !== UserAccountStatus::ACTIVE->value) {
            $user->tokens()->delete();
        }

        $this->recordAuditLogAction->execute(
            AuditActionType::PERMISSION_CHANGED,
            $request->user(),
            $user,
            'Ops user access updated.',
            [
                'target_email' => $user->email,
                'role' => $user->getRoleNames()->first(),
                'account_status' => $user->account_status->value,
            ]
        );

        return response()->json([
            'data' => new OpsUserResource($user->fresh()->load('roles')),
        ]);
    }

    private function ensureOpsUser(User $user): void
    {
        if (! $user->hasAnyRole(self::OPS_ROLES)) {
            throw ValidationException::withMessages([
                'user' => 'Only ops users can be managed here.',
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function preventSelfLockout(array $validated): void
    {
        if (isset($validated['account_status']) && $this->statusValue($validated['account_status']) !== UserAccountStatus::ACTIVE->value) {
            throw ValidationException::withMessages([
                'account_status' => 'You cannot disable your own admin account.',
            ]);
        }

        if (isset($validated['role']) && $validated['role'] !== 'ops_admin') {
            throw ValidationException::withMessages([
                'role' => 'You cannot remove your own admin role.',
            ]);
        }
    }

    private function statusValue(mixed $status): string
    {
        return $status instanceof UserAccountStatus ? $status->value : (string) $status;
    }
}
