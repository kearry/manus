# Database Seeding Instructions

This guide will help you set up and run the database seeding script to populate your Manus AI application with sample data for testing.

## Overview

The seeding script creates:

1. A test user account
2. Several sample tasks in various states (pending, in progress, completed)
3. Task steps for the in-progress tasks
4. Agent logs to simulate execution
5. Task results for completed tasks

## Prerequisites

Ensure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn
- Prisma CLI

## Installation

Make sure you have all the necessary dependencies installed:

```bash
# Install dependencies
npm install

# Install ts-node and bcrypt specifically (if not already installed)
npm install --save-dev ts-node
npm install --save bcrypt
npm install --save-dev @types/bcrypt
```

## Running the Seed Script

1. Make sure your database connection is properly configured in the `.env` file:

```