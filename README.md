# E-Commerce API

This project is a RESTful API for managing an e-commerce platform, built using Node.js, Express, and MongoDB. It supports full CRUD operations for categories, subcategories, brands, and products, along with secure authentication and cart management.

## Features

- **Categories, Subcategories, Brands, Products:**

  - Full CRUD operations (Create, Read, Update, Delete)

- **Authentication:**

  - Secure user authentication and authorization using JWT
  - Protect access to sensitive routes and user-specific data

- **Shopping Cart:**
  - Add, remove, and manage items in the cart
  - Apply coupons for discount

## Endpoints

### Categories

- `GET /api/v1/categories` - Get all categories
- `POST /api/v1/categories` - Create a new category
- `GET /api/v1/categories/:id` - Get a single category
- `PUT /api/v1/categories/:id` - Update a category
- `DELETE /api/v1/categories/:id` - Delete a category

### Subcategories

- Similar CRUD endpoints as categories

### Brands

- Similar CRUD endpoints as categories

### Products

- Similar CRUD endpoints as categories

### Authentication

- `POST /api/v1/auth/signup` - Register a new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout

### Cart

- `GET /api/v1/cart` - Get user’s cart
- `POST /api/v1/cart` - Add item to cart
- `DELETE /api/v1/cart/:itemId` - Remove item from cart
