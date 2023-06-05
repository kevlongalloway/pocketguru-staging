# API Documentation

This document provides an overview of the available API endpoints and their functionalities in the Pocket Guru AI API Backend.

## Authentication

All API routes, except for `/register` and `/login`, require authentication using a token-based authentication mechanism. Include the authentication token in the `Authorization` header of each request using the `Bearer` scheme.

## Endpoints

### Register

- **Route:** `/register`
- **Method:** `POST`
- **Description:** Register a new user.
- **Request Body:**
  - `name`: (string) User's name.
  - `email`: (string) User's email address.
  - `password`: (string) User's password.
- **Response:**
  - `user`: User details.
  - `access_token`: Authentication token for the registered user.

### Login

- **Route:** `/login`
- **Method:** `POST`
- **Description:** Authenticate a user and obtain an access token.
- **Request Body:**
  - `email`: (string) User's email address.
  - `password`: (string) User's password.
- **Response:**
  - `user`: User details.
  - `access_token`: Authentication token for the logged-in user.

### Logout

- **Route:** `/logout/{token}`
- **Method:** `GET`
- **Description:** Log out a user and invalidate the provided access token.
- **Parameters:**
  - `token`: (string) User's access token.
- **Response:**
  - `message`: "User logged out successfully."

### Chat

- **Route:** `/chat`
- **Method:** `POST`
- **Description:** Send a user's message to the mental health therapist chatbot and receive a response.
- **Request Body:**
  - `message`: (string) User's message to the chatbot.
- **Authentication Required:** Yes
- **Response:**
  - `response`: Assistant's reply message.

### Guided Meditation

- **Route:** `/guided-meditation`
- **Method:** `POST`
- **Description:** Request a guided meditation session from the API.
- **Authentication Required:** Yes
- **Response:**
  - `response`: Assistant's reply message.

### Positive Affirmation

- **Route:** `/positive-affirmation`
- **Method:** `POST`
- **Description:** Request positive affirmations from the API.
- **Authentication Required:** Yes
- **Response:**
  - `response`: Assistant's reply message.

### Breathing Exercise

- **Route:** `/breathing-exercise`
- **Method:** `POST`
- **Description:** Request breathing exercises from the API.
- **Authentication Required:** Yes
- **Response:**
  - `response`: Assistant's reply message.

### Reset Conversation

- **Route:** `/reset-conversation`
- **Method:** `GET`
- **Description:** Reset the conversation history for the logged-in user.
- **Authentication Required:** Yes
- **Response:**
  - `message`: "Conversation history has been reset."

## Response Format

The API responses follow the JSON format and include the following properties:

- `response`: The response message from the API.

For authenticated routes that return conversation history, the response will include an additional property:

- `history`: An array containing the conversation history, including user and assistant messages.

---

Please note that all endpoints require the appropriate authentication middleware, `auth:sanctum`, except for `/register` and `/login` routes.
