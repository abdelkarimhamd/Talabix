<?php

namespace App\Modules\Shared\Actions;

use App\Models\User;
use App\Modules\Shared\Enums\AuditActionType;
use Illuminate\Database\Eloquent\Model;

class RecordAuditLogAction
{
    public function execute(
        AuditActionType $actionType,
        User $causer,
        Model $subject,
        string $description,
        array $properties = []
    ): void {
        activity('audit')
            ->causedBy($causer)
            ->performedOn($subject)
            ->event($actionType->value)
            ->withProperties($properties)
            ->log($description);
    }
}
