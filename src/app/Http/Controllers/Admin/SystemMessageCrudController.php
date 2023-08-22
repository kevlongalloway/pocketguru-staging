<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\SystemMessageRequest;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

/**
 * Class SystemMessageCrudController
 * @package App\Http\Controllers\Admin
 * @property-read \Backpack\CRUD\app\Library\CrudPanel\CrudPanel $crud
 */
class SystemMessageCrudController extends CrudController {
	use \Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
	use \Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
	use \Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
	use \Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
	use \Backpack\CRUD\app\Http\Controllers\Operations\ShowOperation;

	/**
	 * Configure the CrudPanel object. Apply settings to all operations.
	 *
	 * @return void
	 */
	public function setup() {
		CRUD::setModel(\App\Models\SystemMessage::class);
		CRUD::setRoute(config('backpack.base.route_prefix') . '/system-message');
		CRUD::setEntityNameStrings('system message', 'system messages');
	}

	/**
	 * Define what happens when the List operation is loaded.
	 *
	 * @see  https://backpackforlaravel.com/docs/crud-operation-list-entries
	 * @return void
	 */
	protected function setupListOperation() {
		CRUD::column('service_id')->model('App\Models\Service')->attribute('name')->entity('service');
		CRUD::column('content')->type('text');
		/**
		 * Columns can be defined using the fluent syntax:
		 * - CRUD::column('price')->type('number');
		 */
	}

	/**
	 * Define what happens when the Create operation is loaded.
	 *
	 * @see https://backpackforlaravel.com/docs/crud-operation-create
	 * @return void
	 */
	protected function setupCreateOperation() {
		CRUD::setValidation(SystemMessageRequest::class);
		// Add a field to select a service using a dropdown
		CRUD::field('service_id')
			->type('select')
			->model('App\Models\Service') // Specify the model to fetch data from
			->attribute('name') // Specify the attribute to display in the dropdown
			->entity('service'); // Assign an alias to the relationship

		// Add a field for the content
		CRUD::addField([
			'name' => 'content',
			'type' => 'text',
			'label' => "Content",
		]);

		/**
		 * Fields can be defined using the fluent syntax:
		 * - CRUD::field('price')->type('number');
		 */
	}

	/**
	 * Define what happens when the Update operation is loaded.
	 *
	 * @see https://backpackforlaravel.com/docs/crud-operation-update
	 * @return void
	 */
	protected function setupUpdateOperation() {
		$this->setupCreateOperation();
	}
}
