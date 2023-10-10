<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
   <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">

      <title>PocketGuruAI: Mindfulness & Meditation App | Coming Soon!</title>
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
      <link rel="manifest" href="/site.webmanifest">
      <meta name="msapplication-TileColor" content="#da532c">
      <meta name="theme-color" content="#ffffff">
      <meta name="description" content="PocketGuruAI: Revolutionizing mental wellness with AI-driven guidance. Transforming support services. Coming soon to App Store & Google Play.">

      <!-- Fonts -->
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
   </head>
   <body class="antialiased">
      <!-- component -->
      <!--
         Coming Soon Page
         Created by Surjith S M
         for: https://web3templates.com
         -->
      <div class="relative overflow-hidden">
         <div class="bg-white pt-10 pb-14 sm:pt-16 lg:overflow-hidden lg:pt-24 lg:pb-24">
            <div class="mx-auto max-w-5xl lg:px-8">
               <div class="lg:grid lg:grid-cols-2 lg:gap-8">
                  <div class="mx-auto max-w-md px-4 text-center sm:max-w-2xl sm:px-6 lg:flex lg:items-center lg:px-0 lg:text-left">
                     <div class="lg:py-24">
                        <h1 class="mt-4 text-4xl font-bold tracking-tight text-black sm:mt-5 sm:text-6xl lg:mt-6 xl:text-6xl"><span class="block text-pink-500">PocketGuruAI</span><span class="block text-black">Coming Soon!</span></h1>
                        <p class="mt-3 text-base text-gray-400 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
  Experience Mindfulness and Meditation with PocketGuruAI - Join the Beta Waitlist!
</p>
                        <div class="mt-10 sm:mt-12">
                           <!-- This is a working waitlist form. Create your access key from https://web3forms.com/s to setup.  -->
                           <form class="sm:mx-auto sm:max-w-xl lg:mx-0" action="{{  route('store_email') }}" method="post">
                              @csrf
                              <div class="sm:flex">
                                 <div class="min-w-0 flex-1"><label for="email" class="sr-only">Email address</label><input id="email" name="email" type="email" placeholder="Enter your email" class="block w-full rounded-md border-0 bg-gray-200 px-4 py-3 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400" value="" autocomplete="off" required /></div>
                                 <div class="mt-3 sm:mt-0 sm:ml-3"><button type="submit" class="block w-full rounded-md bg-pink-500 py-3 px-4 font-medium text-white shadow hover:bg-pink-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-gray-900">Join Waitlist</button></div>
                              </div>
                           </form>
                        </div>
                        @if ($errors->any())
                        <div class="mt-4">
                           <p class="text-red-700">{{  $errors->first() }}</p>
                        </div>
                        @endif
                     </div>
                  </div>
                  <div class="mt-12 hidden lg:block"><img class="" src="https://user-images.githubusercontent.com/1884712/202186141-9f8a93e1-7743-459a-bc95-b1d826931624.png" alt="" /></div>
               </div>
            </div>
         </div>
      </div>
      <footer class="bg-white">
      <div class="mx-auto max-w-7xl overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      <nav class="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
         <div class="px-5 py-2"><a href="#" class="text-base text-gray-500 hover:text-gray-900">About</a></div>
         <div class="px-5 py-2"><a href="#" class="text-base text-gray-500 hover:text-gray-900">Press</a></div>
         <div class="px-5 py-2"><a href="#" class="text-base text-gray-500 hover:text-gray-900">Privacy</a></div>
      </nav>
      <div class="mt-8 flex justify-center space-x-6">
      <a href="#" class="text-gray-400 hover:text-gray-500" >
         <span class="sr-only">Twitter</span>
         <svg fill="currentColor" viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
         </svg>
      </a>
      <a href="https://github.com/web3templates" class="text-gray-400 hover:text-gray-500">
      <a href="https://instagram.com/pocketguruai?igshid=NTc4MTIwNjQ2YQ==" class="text-gray-400 hover:text-gray-500">
         <span class="sr-only">Instagram</span>
         <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
         </svg>
      </a>
   </body>
</html>