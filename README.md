
# **URL Shortener**

A simple and efficient URL Shortening service built with **NestJS**. This service allows users to shorten long URLs, track clicks, and gather useful insights about user interactions.

---

## **Features**

- **URL Shortening**: Convert long URLs into shorter, shareable links.
- **Analytics**:
  - Track clicks on shortened URLs.
  - Capture metadata like IP address, operating system, and device type.
- **Rate Limiting**: Prevent abuse by limiting the number of requests per user within a specific time window.
- **Active/Inactive URLs**: Enable or disable shortened URLs as needed.

---

## **Tech Stack**

- **Backend**: [NestJS](https://nestjs.com/) (Node.js Framework)
- **Database**: PostgreSQL
- **Cache & Queue**: Redis
- **Containerization**: Docker
- **Testing**: Jest
- **Other Libraries**: `ua-parser-js` for extracting OS and device information.

---

## **Setup Instructions**

### **1. Clone the Repository**
```bash
git clone git@github.com:nitin-kukreti/url-shortener.git
cd url-shortener
```

### **2. Install Dependencies**
Make sure you have Node.js and npm installed, then run:
```bash
npm install
```

### **3. Configure Environment Variables**
Create a `.env` file in the root directory and add the following variables:
```env

NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=url_shortener

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=86400

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# in case of direct run
# GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
# in case of nginx
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback


#JWT
JWT_SECRET=
JWT_EXPIRES_IN=

# App
BASE_URL=http://localhost:3000/api
THROTTLE_TTL=5000
THROTTLE_LIMIT=3





```

### **4. Run the Application**
- **Development Mode**:
  ```bash
  npm run start:dev
  ```
- **Production Mode** (with Docker):
  ```bash
  docker-compose up --build
  ```

### **5. Access the Application**
Visit the application at: [http://localhost:3000](http://localhost:3000)

---

## **API Endpoints**

### **1. Shorten URL**
**POST** `/shorten`  
Request Body:
```json
{
  "longUrl": "string",
  "customAlias": "string",
  "topic": "string"
}
```
Response:
```json
{
  "shortUrl": "http://localhost:3000/custom-alias"
}
```

### **2. Redirect Shortened URL**
**GET** `api/shorten/{alias}`  
Redirects to the original URL.

**GET** `api/shorten`  
list of all records long-url and short url.

### **3. View Analytics**
**GET** `/api/analytics/overall`  
Response:
```json
{
  "totalUrls": 7,
  "totalClicks": 5,
  "uniqueClicks": 1,
  "clicksByDate": [
    {
      "date": "2024-12-21T00:00:00.000Z",
      "totalClicks": 5
    }
  ],
  "osType": [
    {
      "osName": "Linux 0.0.0",
      "uniqueClicks": 1,
      "uniqueUsers": 1
    }
  ],
  "deviceType": [
    {
      "deviceName": "Other 0.0.0",
      "uniqueClicks": 1,
      "uniqueUsers": 1
    }
  ]
}
```
**GET** `/analytics/topic/{topic}`  
Response:
```json
{
  "totalCount": "5",
  "uniqueClicks": "1",
  "clicksByDate": [
    {
      "date": "2024-12-21T00:00:00.000Z",
      "totalClicks": "5"
    }
  ],
  "urls": [
    {
      "shortUrl": "http:/localhost:3000/api/shorten/JDFjjA5nKVWjpkx66spb2",
      "totalClicks": "0",
      "uniqueClicks": "0"
    },
    {
      "shortUrl": "http:/localhost:3000/api/shorten/eZq04ES13UXub_IsMLTOk",
      "totalClicks": "1",
      "uniqueClicks": "1"
    },
    {
      "shortUrl": "http:/localhost:3000/api/shorten/sI6iLgLxSg7H5wVFA7tVy",
      "totalClicks": "0",
      "uniqueClicks": "0"
    },
    {
      "shortUrl": "http:/localhost:3000/api/shorten/yoUNSudCSP4NnRD5U6yVY",
      "totalClicks": "4",
      "uniqueClicks": "1"
    }
  ]
}
```


**GET** `/analytics/{alias}`  
Response:
```json
{
  "totalClicks": "4",
  "uniqueClicks": "1",
  "clicksByDate": [
    {
      "date": "2024-12-21T00:00:00.000Z",
      "clickCount": "4"
    }
  ],
  "osType": [
    {
      "osName": "Linux 0.0.0",
      "uniqueClicks": "1",
      "uniqueUsers": "4"
    }
  ],
  "deviceType": [
    {
      "deviceName": "Other 0.0.0",
      "uniqueClicks": "1",
      "uniqueUsers": "4"
    }
  ]
}
```

---

## **Development**

### **Code Formatting**
Use **Prettier** and **ESLint**:
```bash
npm run lint
npm run format
```

### **Run Tests**
```bash
npm run test
```

---

## **Deployment**

To deploy the application, ensure that the environment variables are correctly configured and use Docker to build and deploy the service.  
```bash
docker-compose -f docker-compose.prod.yml up --build
```

---

## **License**
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---
