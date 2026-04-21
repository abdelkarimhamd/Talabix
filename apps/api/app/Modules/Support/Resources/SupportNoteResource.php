<?php

namespace App\Modules\Support\Resources;

use App\Models\SupportNote;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SupportNote
 */
class SupportNoteResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'order_uuid' => $this->order?->uuid,
            'author_user_id' => $this->author_user_id,
            'author_name' => $this->author?->name,
            'body' => $this->body,
            'attachment_disk' => $this->attachment_disk,
            'attachment_path' => $this->attachment_path,
            'created_at' => $this->created_at,
        ];
    }
}
