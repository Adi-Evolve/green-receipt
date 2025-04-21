# Green Receipt - Setup Instructions

This document provides detailed instructions on how to set up and run the Green Receipt application. 

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- Git (for version control)

## Step 1: Project Setup

1. Clone or download this repository to your local machine.

2. Open a terminal/command prompt and navigate to the project directory:
   ```
   cd path/to/green-receipt
   ```

3. Install the dependencies:
   ```
   npm install
   ```
   or if you use yarn:
   ```
   yarn install
   ```

## Step 2: Running the Development Server

1. Start the development server:
   ```
   npm run dev
   ```
   or with yarn:
   ```
   yarn dev
   ```

2. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Step 3: MongoDB Setup (Future Implementation)

Currently, the application is set up to work without a database, using local storage for demo purposes. When you're ready to integrate MongoDB:

1. Create a MongoDB database either locally or using MongoDB Atlas
2. Create a `.env.local` file in the root directory with the following content:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```
3. Replace `your_mongodb_connection_string` with your actual MongoDB connection string
4. Restart the application

## Project Structure Overview

- `/src/app`: Main application pages using Next.js App Router
- `/src/components`: Reusable React components
- `/src/app/dashboard`: Dashboard interface for businesses
- `/src/app/create-bill`: Receipt creation functionality
- `/src/app/login` and `/src/app/register`: Authentication pages

## Features Implemented

The current version includes:

1. **Homepage** - Introduction to Green Receipt
2. **Login/Registration** - User authentication forms
3. **Dashboard** - Business overview
4. **Create Bill** - Fully functional receipt editor with:
   - Custom template options
   - Product management
   - QR code generation
   - Preview functionality

## Browser Compatibility

The application has been tested and works best on:
- Google Chrome (latest)
- Mozilla Firefox (latest)
- Microsoft Edge (latest)
- Safari (latest)

## Troubleshooting

If you encounter any issues:

1. Make sure all dependencies are installed correctly
2. Check if you're using the correct Node.js version
3. Clear your browser cache
4. Check the browser console for any errors

## Support

For any questions or support, please contact [support@greenreceipt.example.com](mailto:support@greenreceipt.example.com) 