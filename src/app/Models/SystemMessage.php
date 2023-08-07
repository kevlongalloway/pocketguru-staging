<?php

namespace App\Models;

use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Orchid\Screen\AsSource;

class SystemMessage extends Model {
	use HasFactory, AsSource;

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
