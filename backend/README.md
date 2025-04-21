# GreenReceip Backend

## Setup

1. Make sure MongoDB is running locally (default: mongodb://localhost:27017/greenreceip)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

Server will run on http://localhost:5000

## Endpoint
- POST `/api/users/register` — Register or update a business profile

Profile is saved in MongoDB in the `profiles` collection.
