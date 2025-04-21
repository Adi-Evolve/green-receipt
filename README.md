# Green Receipt - Digital Billing Platform

Green Receipt is a modern web application that allows businesses to create, manage, and share digital receipts with their customers, eliminating the need for paper receipts.

## 🌟 Features

- **Custom Receipt Templates**: Create and customize receipt formats to match your brand
- **QR Code Integration**: Automatically generate QR codes for receipts that can be scanned by customers
- **Customer Management**: Store customer details and track purchase history
- **Product Catalog**: Maintain a database of your products for quick bill generation
- **Draft Receipts**: Save unfinished receipts as drafts to complete later
- **Sales Reports**: View sales statistics and analyze business performance
- **Environmentally Friendly**: Reduce paper waste by going digital

## 💻 Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Database**: MongoDB (planned integration)
- **Authentication**: NextAuth.js (planned integration)
- **Styling**: Tailwind CSS with custom green-themed color palette

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/green-receipt.git
cd green-receipt
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📱 Usage

### Business Portal

1. Register your business with all necessary details
2. Design your receipt template by selecting/removing elements
3. Add your products and customer information
4. Generate digital receipts with QR codes
5. Send receipts to customers digitally

### Customer Experience

1. Receive digital receipts through QR codes
2. Scan QR code to view receipt details
3. Store all receipts digitally in one place

## 📋 Project Structure

```
green-receipt/
├── public/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── create-bill/
│   │   ├── login/
│   │   ├── register/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── lib/
│   ├── models/
│   └── styles/
├── package.json
└── README.md
```

## 🔄 MongoDB Connection

To connect the application to MongoDB:

1. Create a MongoDB Atlas account or set up a local MongoDB server
2. Create a database and obtain the connection string
3. Add your connection string to the environment variables
4. Restart the application

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Inspired by the need for eco-friendly receipt solutions
- Built with Next.js and Tailwind CSS for a modern, responsive design 