# Ingredient Tracker

A full-stack web application designed to reduce food waste by tracking ingredient expiry dates and providing intelligent recipe suggestions based on items nearing expiration.

## Overview

This application helps users manage their food inventory efficiently by monitoring expiration dates and suggesting recipes that utilize ingredients before they spoil. The system integrates with the Spoonacular API to offer personalized recipe recommendations.

## Features

- **Ingredient Management**: Add, edit, and delete ingredients with expiry date tracking
- **Smart Expiry Monitoring**: Visual indicators for fresh, expiring soon, and expired items
- **Recipe Suggestions**: API-powered recipe recommendations based on expiring ingredients
- **Dashboard Analytics**: Overview statistics showing inventory status
- **Responsive Design**: Mobile-friendly interface with modern UI/UX
- **Real-time Updates**: Dynamic status updates as items approach expiration

## Technology Stack

**Backend:**
- Python Flask
- SQLite database
- RESTful API architecture
- Spoonacular Recipe API integration

**Frontend:**
- React.js
- Modern CSS with responsive design
- Component-based architecture
- State management with React hooks

**Development Tools:**
- Git version control
- Environment variable management
- CORS handling for cross-origin requests

## Installation & Setup

### Prerequisites
- Python 3.7+
- Node.js 14+
- npm or yarn

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/AryanDhiman06/IngredientTracker.git
   cd IngredientTracker
   ```

2. Create virtial environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env  # Add your Spoonacular API key to .env file
   ```

5. Initialize database and start server:
   ```bash
   python app.py
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm start
   ```

The application will be available at http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ingredients` | Retrieve all ingredients |
| POST | `/api/ingredients` | Add new ingredient |
| PUT | `/api/ingredients/<id>` | Update ingredient |
| DELETE | `/api/ingredients/<id>` | Delete ingredient |
| GET | `/api/expiring` | Get expiring ingredients |
| GET | `/api/recipe-suggestions` | Get recipe recommendations |
| GET | `/api/stats` | Get dashboard statistics |

## Environment Variables

Create a `.env` file in the root directory:

`SPOONACULAR_API_KEY=your_api_key_here`

Get your API key from [Spoonacular API](https://spoonacular.com/food-api)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request
