# Pocket Guru AI API Backend

The Pocket Guru AI API Backend is the server-side component of the Pocket Guru AI mobile application. It serves as the central hub for handling various functionalities, including user authentication, data processing, and integration with external services. This repository contains the source code and configuration files for the API Backend.

## Project Overview

Pocket Guru AI is an innovative mobile app that provides personalized mental health support and resources to users. The API Backend plays a critical role in delivering a seamless experience by powering key features such as:

- **Mental Health Therapist Chatbot**: The backend API integrates with ChatGPT API, enabling users to engage in conversational therapy sessions with an AI-powered mental health therapist. The chatbot utilizes natural language processing to understand user input, provide empathetic responses, and offer guidance for various mental health concerns.

- **Personalized Breathing Exercises**: The API Backend includes routes that deliver personalized breathing exercises to users. These exercises are designed to help users manage stress, anxiety, and improve overall well-being. The backend leverages algorithms to generate exercise recommendations based on user preferences and historical data.

- **Personalized Guided Meditation**: The API Backend also offers routes for personalized guided meditation sessions. Users can access a library of meditation sessions tailored to their specific needs, such as mindfulness, relaxation, focus, or sleep. The backend utilizes machine learning algorithms to recommend meditation content based on user preferences and past usage patterns.

## Integration and Authentication

To enhance user experience and functionality, the Pocket Guru AI API Backend integrates with the following services:

- **Twilio**: The backend integrates with Twilio to handle SMS and voice communication. It allows users to receive notifications, reminders, and engage in voice interactions with the mental health chatbot.

- **Google and Apple OAuth**: The API Backend supports OAuth authentication, enabling users to log in using their Google or Apple accounts. This integration ensures a secure and seamless authentication process for users.

## Documentation and Usage

For detailed documentation and instructions on using the API Backend, please refer to the [API Documentation](/docs) included in this repository. It provides an overview of the available endpoints, request/response formats, and authentication requirements.

## Testing

To run the tests for the backend API, you can use the following command:

```bash
./vendor/bin/phpunit
```

## Contributors

Pocket Guru AI Backend API is developed and maintained by the following contributors:

- [Kevlon Galloway](https://github.com/kevlongalloway) - Software Engineer and System Architect

## License

This project is licensed under the Commercial Use License. To obtain a license for using this software for commercial purposes, please contact us at kevlongalloway1999m@gmail.com.

The Commercial Use License allows individuals and organizations to utilize, modify, and distribute the Pocket Guru AI API Backend software for commercial purposes. This license grants the freedom to integrate the software, make modifications, and offer services while ensuring compliance with open-source principles. By obtaining a Commercial Use License, users gain the rights to leverage the power of the Pocket Guru AI API Backend in their commercial endeavors.

You can view the license [here](./COMMERCIAL_USE_LICENSE).
