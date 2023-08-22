{{-- This file is used for menu items by any Backpack v6 theme --}}
<li class="nav-item"><a class="nav-link" href="{{ backpack_url('dashboard') }}"><i class="la la-home nav-icon"></i> {{ trans('backpack::base.dashboard') }}</a></li>

<x-backpack::menu-item title="System messages" icon="la la-question" :link="backpack_url('system-message')" />
<x-backpack::menu-item title="Answers" icon="la la-question" :link="backpack_url('answer')" />
<x-backpack::menu-item title="Options" icon="la la-question" :link="backpack_url('option')" />
<x-backpack::menu-item title="Preferences" icon="la la-question" :link="backpack_url('preference')" />
<x-backpack::menu-item title="Questions" icon="la la-question" :link="backpack_url('question')" />
<x-backpack::menu-item title="Services" icon="la la-question" :link="backpack_url('service')" />
<x-backpack::menu-item title="Subscription tiers" icon="la la-question" :link="backpack_url('subscription-tier')" />
<x-backpack::menu-item title="Users" icon="la la-question" :link="backpack_url('user')" />