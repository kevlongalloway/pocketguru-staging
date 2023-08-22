<?php

namespace App\Models;

use Backpack\CRUD\app\Models\Traits\CrudTrait;
use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemMessage extends Model {
    use CrudTrait;
	use HasFactory;

	protected $fillable = [
		'content',
		'service_id',
	];

	public function getContent() {
		return $this->content;
	}

	public function service() {
		return $this->belongsTo(Service::class);
	}

}
