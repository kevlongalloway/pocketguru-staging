<?php

namespace App\Models;

use App\Models\systemMessages;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model {
	use HasFactory;

	/**
	 * The attributes that are mass assignable.
	 *
	 * @var array
	 */
	protected $fillable = [
		'name',
	];

	public function systemMessages() {
		return $this->hasMany(SystemMessage::class);
	}
}
